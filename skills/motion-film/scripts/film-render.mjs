// Usage: node film-render.mjs <film-id> [--stills 0,5,12.5,...] [--from s --to s] [--scale 0.5]
//   --stills: renders those times (seconds) into renders/<id>-stills.png as a contact sheet, no video.
//   otherwise: renders the whole film (or --from/--to) to renders/<id>.mp4 (H.264, 30 fps).

import { spawn, execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const loadPlaywright = async () => {
    try {
        return await import('playwright');
    } catch {
        const { execSync: run } = await import('node:child_process');
        return import(run('npm root -g').toString().trim() + '/playwright/index.mjs');
    }
};
const { chromium } = await loadPlaywright();
const findFfmpeg = () => {
    // An ffmpeg with libx264: $FFMPEG, the one imageio-ffmpeg ships (pip install imageio-ffmpeg), or the system's.
    if (process.env.FFMPEG) {
        return process.env.FFMPEG;
    }
    try {
        return execSync('python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
        return 'ffmpeg';
    }
};

const args = process.argv.slice(2);
const id = args[0];
const opt = (name, fallback) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? args[i + 1] : fallback;
};
// Every take in one file, so the film page can place any of them.
const bundle = (existsSync(resolve(here, 'pieces')) ? readdirSync(resolve(here, 'pieces')) : [])
    .filter((name) => name.endsWith('.js') && !name.startsWith('_'))
    .sort()
    .map((name) => `(() => {\n${readFileSync(resolve(here, 'pieces', name), 'utf8')}\n})();`)
    .join('\n');
writeFileSync(resolve(here, 'pieces.bundle.js'), bundle);

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
    const page = await (await browser.newContext({ viewport: { width: 1000, height: 600 }, ignoreHTTPSErrors: true })).newPage();
    const logs = [];
    page.on('console', (m) => { if (m.type() === 'error') { logs.push(m.text()); } });
    page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
    await page.goto('file://' + resolve(here, 'film.html') + '?film=' + id);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    const total = await page.evaluate(() => window.__film.frames);
    const fps = 30;
    const scale = Number(opt('scale', '1'));

    const grab = (quality) => page.evaluate(([q, s]) => {
        const source = document.getElementById('frame');
        if (s === 1) {
            return source.toDataURL('image/jpeg', q);
        }
        const small = document.createElement('canvas');
        small.width = Math.round(source.width * s);
        small.height = Math.round(source.height * s);
        small.getContext('2d').drawImage(source, 0, 0, small.width, small.height);
        return small.toDataURL('image/jpeg', q);
    }, [quality, scale]);

    const runTo = async (frame) => {
        await page.evaluate(([from, to]) => {
            for (let n = from; n <= to; n++) {
                window.__film.frame(n);
            }
        }, [runTo.next, frame]);
        runTo.next = frame + 1;
    };
    runTo.next = 0;

    if (opt('stills')) {
        const times = opt('stills').split(',').map(Number).sort((a, b) => a - b);
        const shots = [];
        for (const time of times) {
            const frame = Math.min(total - 1, Math.round(time * fps));
            if (frame >= runTo.next) {
                await runTo(frame);
            }
            shots.push({ time, data: await grab(0.85) });
        }
        const sheet = await page.evaluate(async (list) => {
            const cols = 3;
            const w = 640;
            const h = 360;
            const canvas = document.createElement('canvas');
            canvas.width = cols * w + (cols - 1) * 8;
            canvas.height = Math.ceil(list.length / cols) * (h + 28);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < list.length; i++) {
                const img = new Image();
                img.src = list[i].data;
                await img.decode();
                const x = (i % cols) * (w + 8);
                const y = Math.floor(i / cols) * (h + 28);
                ctx.drawImage(img, x, y, w, h);
                ctx.fillStyle = '#9a9aa6';
                ctx.font = '14px monospace';
                ctx.fillText(list[i].time.toFixed(2) + 's', x + 4, y + h + 18);
            }
            return canvas.toDataURL('image/png');
        }, shots);
        const out = resolve(here, 'renders', id + '-stills.png');
        writeFileSync(out, Buffer.from(sheet.split(',')[1], 'base64'));
        console.log('stills:', out);
    } else {
        const ffmpeg = findFfmpeg();
        const from = Math.round(Number(opt('from', '0')) * fps);
        const to = Math.min(total, Math.round(Number(opt('to', String(total / fps))) * fps));
        const out = resolve(here, 'renders', id + (opt('from') || opt('to') ? `-${from}-${to}` : '') + '.mp4');
        const encoder = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
        encoder.stderr.on('data', (d) => process.stderr.write(d));
        const finished = new Promise((resolve, reject) => {
            encoder.once('error', reject);
            encoder.once('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`)));
        });
        // The encoder may fail while the browser is still drawing the next frame.
        finished.catch(() => {});
        encoder.stdin.on('error', () => {});
        try {
            const started = Date.now();
            for (let n = 0; n < to; n++) {
                await runTo(n);
                if (n < from) {
                    continue;
                }
                const data = await grab(0.93);
                await Promise.race([
                    new Promise((resolve, reject) => encoder.stdin.write(
                        Buffer.from(data.split(',')[1], 'base64'),
                        (error) => error ? reject(error) : resolve()
                    )),
                    finished.then(() => { throw new Error('ffmpeg closed before all frames were written'); })
                ]);
                if (n % 150 === 0) {
                    console.log(`frame ${n}/${to}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
                }
            }
            encoder.stdin.end();
            await finished;
        } finally {
            encoder.stdin.destroy();
            if (encoder.exitCode === null) {
                encoder.kill();
            }
        }
        console.log('video:', out);
    }
    for (const line of [...new Set([...logs, ...(await page.evaluate(() => window.__errors))])]) {
        console.log(line);
    }
} finally {
    await browser.close();
}

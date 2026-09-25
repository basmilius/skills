// Usage: node page-shot.mjs [width] [out] [--full] [--wait ms]
const loadPlaywright = async () => {
    try {
        return await import('playwright');
    } catch {
        const { execSync } = await import('node:child_process');
        const root = execSync('npm root -g').toString().trim();
        return import(root + '/playwright/index.mjs');
    }
};
const { chromium } = await loadPlaywright();
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const width = Number(args[0] || 1440);
const out = resolve(here, 'shots', args[1] || `page-${width}.png`);
const wait = args.includes('--wait') ? Number(args[args.indexOf('--wait') + 1]) : 2500;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width, height: args.includes('--h') ? Number(args[args.indexOf('--h') + 1]) : 1000 }, ignoreHTTPSErrors: true, deviceScaleFactor: 1 });
const page = await context.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
const theme = args.includes('--theme') ? '?theme=' + encodeURIComponent(args[args.indexOf('--theme') + 1]) : '';
await page.goto('file://' + resolve(here, args.includes('--remote') ? 'out/preview.html' : 'out/preview-local.html') + theme);
await page.waitForTimeout(wait);
if (args.includes('--scroll')) { await page.evaluate(() => document.getElementById('reel').scrollIntoView()); await page.waitForTimeout(wait); }
// Offscreen tiles render lazily; visit them before capturing the whole document.
if (args.includes('--full')) {
    for (const tile of await page.locator('.tile-frame').all()) {
        await tile.scrollIntoViewIfNeeded();
        await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
}
const clipH = args.includes('--h') ? Number(args[args.indexOf('--h') + 1]) : 0;
await page.screenshot({ path: out, fullPage: args.includes('--full') && !clipH, clip: clipH ? { x: 0, y: 0, width, height: clipH } : undefined });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log('shot:', out, 'horizontal overflow:', overflow);
for (const line of [...new Set(logs)]) console.log(line);
await browser.close();

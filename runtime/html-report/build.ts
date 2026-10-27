/*
 * Builds the runtime the html-report skill ships in `skills/html-report/assets`: `runtime.js` hydrates a report in
 * the browser, `server.js` renders it to HTML in `scripts/build.ts`, `runtime.css` holds Tailwind, the adecore theme
 * and the report styles.
 */
import { $ } from 'bun';

const root = import.meta.dir;
const assets = `${root}/../../skills/html-report/assets`;
const define = { 'process.env.NODE_ENV': '"production"' };

async function bundle(entry: string, target: 'browser' | 'bun', format: 'iife' | 'esm'): Promise<string> {
    const result = await Bun.build({ entrypoints: [`${root}/src/${entry}`], target, format, minify: true, define });

    if (!result.success) {
        console.error(result.logs.join('\n'));
        process.exit(1);
    }

    return result.outputs[0]!.text();
}

await Bun.write(`${assets}/runtime.js`, await bundle('client.jsx', 'browser', 'iife'));
await Bun.write(`${assets}/server.js`, await bundle('server.jsx', 'bun', 'esm'));
await $`${root}/node_modules/.bin/tailwindcss -i ${root}/src/styles.css -o ${assets}/runtime.css --minify`.quiet();

for (const name of ['runtime.js', 'server.js', 'runtime.css']) {
    console.log(`${name}: ${(Bun.file(`${assets}/${name}`).size / 1024).toFixed(0)} kB`);
}

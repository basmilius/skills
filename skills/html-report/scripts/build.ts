/*
 * Builds a report written in JSX or TSX into one self-contained HTML file: the report rendered to HTML first, then
 * the runtime that hydrates it. Needs Bun and nothing else; the runtime comes prebuilt in `../assets`.
 *
 *   bun build.ts <report.tsx> [--out <report.html>]
 */
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { BunPlugin } from 'bun';

const assets = resolve(import.meta.dir, '../assets');
const { values, positionals } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true, options: { out: { type: 'string' } } });

if (positionals[0] === undefined) {
    console.error('Usage: bun build.ts <report.tsx> [--out <report.html>]');
    process.exit(1);
}

const input = resolve(positionals[0]);
const output = resolve(values.out ?? join(dirname(input), `${basename(input, extname(input))}.html`));
interface Server {
    readonly modules: Record<string, Record<string, unknown>>;
    render(element: unknown): string;
    iconMarkup(name: string): string | null;
    registerIcons(entries: Record<string, string>): void;
    staticIcon(name: string): unknown;
    setLanguage(lang: string): void;
}

const server: Server = await import(join(assets, 'server.js'));
const source = await Bun.file(input).text();
const pascalCase = (name: string): string => name.replace(/(^|-)([a-z0-9])/g, (_, __, letter: string) => letter.toUpperCase());

/* The runtime carries no icon set: only the Lucide icons the report imports, and its brand icon, go into the file. */
const imported = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/g)].flatMap((match) =>
    match[1]!
        .split(',')
        .map((part) => part.trim().split(/\s+as\s+/)[0]!)
        .filter((name) => name !== '')
);

/* The report imports `html-report`, `react` and `lucide-react`; here they are the modules of the server bundle. */
Bun.plugin({
    name: 'html-report-server',
    setup(build) {
        for (const [specifier, module] of Object.entries(server.modules)) {
            build.module(specifier, () => ({ exports: module, loader: 'object' }));
        }

        build.module('lucide-react', () => ({ exports: Object.fromEntries(imported.map((name) => [name, server.staticIcon(name)])), loader: 'object' }));
    }
});

/* Read from the source, since the report's module formats its numbers before the `<Report>` that names the language exists. */
server.setLanguage(/\blang=["'](nl|en)["']/.exec(source)?.[1] ?? 'nl');

const exported = (await import(input)).default;
const React = server.modules.react as { createElement(type: unknown): { props: Record<string, unknown> } };
const element = typeof exported === 'function' ? React.createElement(exported) : exported;
const props = (typeof exported === 'function' ? {} : element?.props) ?? {};

if (element === undefined || element === null) {
    console.error(`${input} has no default export; export the <Report> element.`);
    process.exit(1);
}

const brandIcon = (props.brand as { icon?: unknown } | undefined)?.icon;
const iconNames = new Set(imported);

if (typeof brandIcon === 'string' && /^[a-z0-9-]{2,}$/.test(brandIcon)) {
    iconNames.add(pascalCase(brandIcon));
}

const icons: Record<string, string> = {};

for (const name of iconNames) {
    const markup = server.iconMarkup(name);

    if (markup === null) {
        console.error(`"${name}" is not a Lucide icon; see https://lucide.dev/icons for the names.`);
        process.exit(1);
    }

    icons[name] = markup;
}

server.registerIcons(icons);

/* A logo given as a file path goes into the report itself: SVG as markup, an image as a `data:` URL, scaled down to 64px on macOS. */
async function logoFrom(path: string): Promise<string> {
    if (extname(path).toLowerCase() === '.svg') {
        return Bun.file(path).text();
    }

    let file = Bun.file(path);

    if (process.platform === 'darwin') {
        const scaled = join(tmpdir(), `html-report-logo-${process.pid}.png`);
        const sips = Bun.spawnSync(['sips', '-Z', '64', '-s', 'format', 'png', path, '--out', scaled], { stdout: 'ignore', stderr: 'ignore' });

        if (sips.exitCode === 0) {
            file = Bun.file(scaled);
        }
    }

    const type = file.name?.endsWith('.png') ? 'image/png' : file.type;

    return `data:${type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
}

const logos: Record<string, string> = {};

if (typeof brandIcon === 'string' && !/^(<svg|data:|https?:)/.test(brandIcon.trim()) && !/^[a-z0-9-]+$/.test(brandIcon)) {
    const path = [resolve(dirname(input), brandIcon), resolve(brandIcon)].find((candidate) => existsSync(candidate));

    if (path === undefined) {
        console.error(`The brand icon "${brandIcon}" is no file; give a path relative to the report or an absolute one.`);
        process.exit(1);
    }

    logos[brandIcon] = await logoFrom(path);
}

(globalThis as { __HTML_REPORT_ASSETS__?: Record<string, string> }).__HTML_REPORT_ASSETS__ = logos;

if (typeof props.lang !== 'string') {
    console.warn('The <Report> has no `lang`; its interface is in Dutch. Set lang="nl" or lang="en" to match the report.');
}

const lang = typeof props.lang === 'string' ? props.lang : 'nl';

/* Written once, so the server and the browser show the same text whatever the time zone of the reader. */
const built = new Date().toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' });

(globalThis as { __HTML_REPORT_BUILT__?: string }).__HTML_REPORT_BUILT__ = built;

const markup = server.render(element);

/* In the browser the same imports resolve to the modules of the inlined runtime. */
const runtimeModules: BunPlugin = {
    name: 'html-report-browser',
    setup(build) {
        build.onResolve({ filter: /^(html-report|react|react\/jsx-runtime|react\/jsx-dev-runtime|lucide-react)$/ }, (args) => ({ path: args.path, namespace: 'runtime' }));
        build.onLoad({ filter: /.*/, namespace: 'runtime' }, (args) => {
            if (args.path === 'lucide-react') {
                const exports = imported.map((name) => `export const ${name} = globalThis.HtmlReport.staticIcon(${JSON.stringify(name)});`);

                return { loader: 'js', contents: exports.join('\n') };
            }

            const key = args.path === 'react/jsx-dev-runtime' ? 'react/jsx-runtime' : args.path;
            const names = Object.keys(server.modules[key] ?? {}).filter((name) => name !== 'default' && /^[A-Za-z_$][\w$]*$/.test(name));
            const lines = [`const m = globalThis.HtmlReport.modules[${JSON.stringify(key)}];`, 'export default m.default ?? m;', `export const { ${names.join(', ')} } = m;`];

            if (args.path === 'react/jsx-dev-runtime') {
                lines.push('export const jsxDEV = (type, props, key) => m.jsx(type, props, key);');
            }

            return { loader: 'js', contents: lines.join('\n') };
        });
    }
};

const temp = await mkdtemp(join(tmpdir(), 'html-report-'));
const entry = join(temp, 'entry.js');

await Bun.write(entry, `import report from ${JSON.stringify(input)};\nglobalThis.__HTML_REPORT_BUILT__ = ${JSON.stringify(built)};\nglobalThis.__HTML_REPORT_ASSETS__ = ${JSON.stringify(logos)};\nglobalThis.HtmlReport.registerIcons(${JSON.stringify(icons)});\nglobalThis.HtmlReport.hydrate(typeof report === 'function' ? globalThis.HtmlReport.modules.react.createElement(report) : report);\n`);

const result = await Bun.build({
    entrypoints: [entry],
    target: 'browser',
    format: 'iife',
    minify: true,
    plugins: [runtimeModules],
    define: { 'process.env.NODE_ENV': '"production"' }
});

await rm(temp, { recursive: true, force: true });

if (!result.success) {
    console.error(result.logs.map(String).join('\n'));
    process.exit(1);
}

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const title = typeof props.title === 'string' ? props.title : basename(input, extname(input));
const [css, runtime, report] = await Promise.all([Bun.file(join(assets, 'runtime.css')).text(), Bun.file(join(assets, 'runtime.js')).text(), result.outputs[0]!.text()]);

/* Nobody reads the scripts, so they travel gzipped; the browser unpacks them and runs them from a blob, which a sandboxed preview allows. */
const payload = Buffer.from(Bun.gzipSync(`${runtime}\n;\n${report}`, { level: 9 })).toString('base64');
const unpack = `(async()=>{const d=Uint8Array.from(atob(document.getElementById('html-report-runtime').textContent),c=>c.charCodeAt(0));const code=await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('gzip'))).text();const s=document.createElement('script');s.src=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));document.body.append(s)})()`;

/* Sets the theme before the first paint, so a dark system never flashes the light page. */
const theme = `try{var p=localStorage.getItem('html-report-theme:'+location.pathname)}catch(e){}document.documentElement.dataset.theme=p==='light'||p==='dark'?p:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'`;

const html = `<!doctype html>
<html lang="${escapeHtml(lang)}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="generator" content="html-report">
${typeof props.model === 'string' ? `<meta name="author" content="${escapeHtml(props.model)}">\n` : ''}<title>${escapeHtml(title)}</title>
<script>${theme}</script>
<link rel="preconnect" href="https://font.bmcdn.nl" crossorigin>
<link rel="stylesheet" href="https://font.bmcdn.nl/css2?family=geist-variable">
<style>${css.replace(/<\/style/gi, '<\\/style')}</style>
</head>
<body>
<div id="report">${markup}</div>
<!-- html-report runtime: the gzipped scripts below hydrate the report above -->
<script type="application/gzip" id="html-report-runtime">${payload}</script>
<script>${unpack}</script>
</body>
</html>
`;

await Bun.write(output, html);
console.log(`${output} (${(html.length / 1024).toFixed(0)} kB)`);

// Builds the single-file artifact from the template, the harness, every take and the page script.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFileSync(resolve(here, path), 'utf8');
// A script body must never contain its own closing tag.
const safeCode = (code) => code.replace(/<\/script/gi, '<\\/script');
const dir = process.env.PIECES_DIR || 'pieces';
const names = readdirSync(resolve(here, dir)).filter((name) => name.endsWith('.js') && !name.startsWith('_')).sort();
// One script per take, so a take that fails to parse cannot take the others down with it.
const pieces = names.map((name) => `<script>\n/* take: ${name} */\n(() => {\n${safeCode(read(dir + '/' + name))}\n})();\n</script>`).join('\n');

const page = read('page.html')
    .replace('/*THEME*/', () => safeCode(read('theme.js')))
    .replace('/*HARNESS*/', () => safeCode(read('harness.js')))
    .replace('<script>\n/*PIECES*/\n</script>', () => pieces)
    .replace('/*APP*/', () => safeCode(read('app.js')));
mkdirSync(resolve(here, 'out'), { recursive: true });
const document = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>' + page + '</body></html>';
writeFileSync(resolve(here, 'out/hero-reel.html'), document);
writeFileSync(resolve(here, 'out/preview.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}</style></head><body>' + page + '</body></html>');
console.log('built', (page.length / 1024).toFixed(1) + ' KB,', names.length, 'takes');
// Keep the local font stylesheet available for headless review.
writeFileSync(
    resolve(here, 'out/preview-local.html'),
    readFileSync(resolve(here, 'out/preview.html'), 'utf8').replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="../fonts.css" rel="stylesheet">')
);

// Loads the built page, steps the stage through every take and scrolls every tile into view; prints any error.
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
import { resolve } from 'node:path';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
const page = await context.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto('file://' + resolve('out/preview-local.html'));
await page.waitForTimeout(3000);
const takeCount = await page.locator('.tile').count();
for (let i = 0; i < takeCount; i++) { await page.click('#next'); await page.waitForTimeout(400); }
const tiles = await page.$$('.tile-frame');
for (const tile of tiles) { await tile.scrollIntoViewIfNeeded(); await page.waitForTimeout(250); }
await page.waitForTimeout(1000);
const state = await page.evaluate(() => ({ takes: document.querySelectorAll('.tile').length, errors: [...document.querySelectorAll('[data-error]')].map((e) => e.dataset.error), canvases: document.querySelectorAll('canvas').length, title: document.getElementById('c-title').textContent }));
console.log(JSON.stringify(state));
for (const line of [...new Set(logs)]) console.log(line);
await browser.close();
if (logs.length || state.errors.length || !state.takes) process.exitCode = 1;

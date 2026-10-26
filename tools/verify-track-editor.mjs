// Optional browser acceptance check; uses an externally installed Playwright.
// PLAYWRIGHT_MODULE = absolute path to playwright/index.mjs (or install playwright).
// Run against the dev server: node tools/verify-track-editor.mjs
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.TEST_OUTPUT_DIR ?? join(tmpdir(), 'swipe-out-track001');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
context.setDefaultTimeout(20000);
const errors = [], failedRequests = [];
context.on('page', page => {
  page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failedRequests.push(`${response.status()} ${response.url()}`); });
});
try {
  const page = await context.newPage();
  await page.goto(`${base}/editor.html`);
  await page.waitForFunction(() => document.querySelector('#track-title').textContent === 'Neon Causeway');
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(output, 'editor-overview.png') });
  assert.equal(await page.locator('#track-select option').count(), 14);

  // Actual mouse manipulation of the selected point's green height gizmo.
  await page.locator('#focus-button').click();
  await page.waitForTimeout(250);
  const canvas = await page.locator('#editor-canvas').boundingBox();
  const cx = canvas.x + canvas.width / 2, cy = canvas.y + canvas.height / 2;
  const initialHeight = Number(await page.locator('#point-y').inputValue());
  await page.mouse.move(cx, cy - 34);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 95, { steps: 12 });
  await page.mouse.up();
  assert.notEqual(Number(await page.locator('#point-y').inputValue()), initialHeight, '3D height gizmo must move the actual point');
  await page.locator('#undo-button').click();
  assert.equal(Number(await page.locator('#point-y').inputValue()), initialHeight);
  await page.locator('#redo-button').click();
  assert.notEqual(Number(await page.locator('#point-y').inputValue()), initialHeight);
  await page.locator('#point-y').fill('15');
  await page.locator('#point-y').press('Tab');
  await page.locator('#add-point-btn').click();
  assert.match(await page.locator('#point-count').innerText(), /34 POINTS/);
  await page.locator('#del-point-btn').click();
  assert.match(await page.locator('#point-count').innerText(), /33 POINTS/);
  await page.locator('#save-button').click();
  assert.equal(await page.locator('#save-state').innerText(), 'SAVED');
  console.log('PASS: 3D height drag, undo/redo, numeric height, insert/delete, save.');

  await page.locator('#track-select').selectOption('track10');
  assert.match(await page.locator('#point-count').innerText(), /46 OBJECTS/);
  await page.locator('#track-select').selectOption('track6');
  assert.match(await page.locator('#point-count').innerText(), /5 OBJECTS/);
  await page.locator('#object-select').selectOption('0');
  await page.getByRole('spinbutton', { name: 'Object opacity', exact: true }).fill('0');
  await page.getByRole('spinbutton', { name: 'Object opacity', exact: true }).press('Tab');
  assert.equal(await page.getByRole('spinbutton', { name: 'Object opacity', exact: true }).inputValue(), '0');
  await page.locator('#undo-button').click();
  await page.locator('#track-select').selectOption('track1');
  assert.equal(Number(await page.locator('#point-y').inputValue()), 15);
  await page.locator('#track-name').fill('Editor Test Circuit');
  await page.locator('#track-name').press('Tab');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-button').click();
  const download = await downloadPromise;
  const exportPath = join(output, 'round-trip.json');
  await download.saveAs(exportPath);
  const exported = JSON.parse(await readFile(exportPath, 'utf8'));
  assert.equal(exported.version, 3);
  assert.equal(exported.track.centerline[0][1], 15);
  await page.locator('#import-file').setInputFiles(exportPath);
  await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Imported as a new draft'));
  const customKey = await page.locator('#track-select').inputValue();
  assert.match(customKey, /^custom-/);
  assert.equal(await page.locator('#track-select option').count(), 15);
  assert.equal(await page.locator('#track-title').innerText(), 'Editor Test Circuit');
  console.log('PASS: built-in scenery, zero opacity, retained drafts, download and import as new track.');

  const previousStorage = await page.evaluate(() => localStorage.getItem('swipe-out-track-definitions'));
  for (const [name, content] of [['broken.json', '{broken'], ['future.json', JSON.stringify({ ...exported, version: 999 })]]) {
    await page.locator('#import-file').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(content) });
    await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Import failed'));
    assert.equal(await page.locator('#track-select').inputValue(), customKey);
    assert.equal(await page.evaluate(() => localStorage.getItem('swipe-out-track-definitions')), previousStorage);
  }

  const gamePromise = context.waitForEvent('page');
  await page.locator('#test-button').click();
  const game = await gamePromise;
  console.log('Opened race page:', game.url());
  await game.waitForLoadState('domcontentloaded');
  await game.waitForFunction(key => document.querySelector('#track-select')?.value === key, customKey);
  assert.equal(new URL(game.url()).searchParams.get('track'), customKey);
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem('swipe-out-track-definitions'))[key], customKey);
  assert.deepEqual(stored, exported);
  await game.locator('#start-button').click();
  // Software WebGL can render below real time; wait for the countdown to finish
  // in simulated time rather than assuming a fixed number of wall-clock seconds.
  await game.waitForFunction(() => document.querySelector('#race-speed').textContent.includes('KM/H'), null, { timeout: 60000 });
  assert.match(await game.locator('#results-screen .eyebrow').textContent(), /EDITOR TEST CIRCUIT/);
  assert.ok(Number((await game.locator('#race-speed').innerText()).replace(/\D/g, '')) > 0, 'imported track must run a moving race');
  await game.screenshot({ path: join(output, 'imported-track-race.png') });
  assert.match(await game.locator('.editor-link').getAttribute('href'), new RegExp(customKey));
  await game.close();
  console.log('PASS: invalid imports preserve draft/storage; Save & Test opens and races the exact exported track.');

  // Remove only the selected custom track, preserving the previously saved override.
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#reset-button').click();
  await page.waitForFunction(() => document.querySelector('#track-select').value === 'track1');
  assert.equal(Number(await page.locator('#point-y').inputValue()), 15);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('swipe-out-track-definitions')));
  assert.equal(saved[customKey], undefined);
  assert.equal(saved.track1.track.centerline[0][1], 15);
  await page.locator('#save-button').click();
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#track-title').textContent === 'Editor Test Circuit');
  assert.equal(Number(await page.locator('#point-y').inputValue()), 15);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: join(output, 'editor-landscape.png') });
  console.log('PASS: scoped reset, reload persistence, landscape viewport without horizontal overflow.');
  assert.deepEqual(failedRequests, []);
  // Chrome can ask for an absent favicon on the existing game page.
  assert.deepEqual(errors.filter(e => !e.includes('404 (Not Found)')), []);
  console.log(JSON.stringify({ screenshots: output, pageErrors: errors, failedRequests }));
} catch (error) {
  for (const [i, page] of context.pages().entries()) {
    console.error('Page at failure:', page.url());
    await page.screenshot({ path: join(output, `failure-${i}.png`), timeout: 5000 }).catch(() => {});
  }
  throw error;
} finally {
  await browser.close();
}

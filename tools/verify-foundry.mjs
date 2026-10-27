// Real WebGL acceptance. Inspection/seek hooks exist only in this intercepted
// test response; production exposes no game state or teleport controls.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ION_FOUNDRY, FOUNDRY_SECTORS as sectors } from '../src/track-foundry.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.TEST_OUTPUT_DIR ?? join(tmpdir(), 'swipe-out-track004');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
context.setDefaultTimeout(30000);
const errors = [], requests = [];
context.on('page', page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) requests.push(`${r.status()} ${r.url()}`); });
});
await context.route('**/src/game.js*', async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `
window.__foundry = {
  snapshot() {
    const objects=scene.getObjectByName('customTrackObjects')?.children ?? [];
    const maps=[...new Set(objects.map(m=>m.material.map).filter(Boolean))];
    return { state:race.state, distance:shipPhysics.distance, length:curve.getLength(),
      landings:shipPhysics.landings,recoveries:shipPhysics.recoveries,flight:!!shipPhysics.flight,
      route:shipPhysics.route, entries:shipPhysics.routeEntries,merges:shipPhysics.routeMerges,
      up:camera.up.toArray(), objects:objects.length,maps:maps.length,
      texturesReady:objects.length>0&&maps.every(t=>t.image?.width>0),geometries:new Set(objects.map(m=>m.geometry)).size,
      memory:{...renderer.info.memory} };
  },
  pose(u,mode='external',branch=false) {
    isPaused=true; race.state='racing'; setScreen(startScreen,false); setScreen(pauseScreen,false);
    Object.assign(shipPhysics,createShipPhysics(140)); shipPhysics.distance=u*curve.getLength();
    if(branch)shipPhysics.route={id:curve.track.branches[0].id,lap:0};
    updateCraftPose(0);shipPhysics.previousPosition.copy(craft.position);
    cameraSystem.mode=mode; magneticCamera.reset();
    cameraSystem.update(craft.position,craft.quaternion,new THREE.Vector3(),0,race.poseFrame);
    panoramaBackdrop.position.copy(craft.position); composer.render();
  },
  run(lane=0) { shipPhysics.lateralOffset=lane;shipPhysics.assistLevel=0;isPaused=false;clock.getDelta(); },
  pause() { isPaused=true; }
};` });
});
try {
  const page = await context.newPage();
  await page.goto(`${base}/?track=track15`);
  await page.locator('#start-button').click();
  await page.waitForFunction(() => window.__foundry?.snapshot().texturesReady);
  assert.equal(await page.locator('#track-select').inputValue(), 'track15');
  const assets = await page.evaluate(() => window.__foundry.snapshot());
  assert.equal(assets.objects, ION_FOUNDRY.objects.length); assert.equal(assets.geometries, 4);
  console.log('PASS: loaded optimized assets and shared geometry', assets);
  for (const [name, u, mode, branch] of [
    ['district', 0.004, 'external'], ['jump-approach', sectors.jump1 - 0.01, 'internal'],
    ['bank', sectors.bank, 'external'], ['fork', sectors.fork - 0.025, 'external'],
    ['skyway', (sectors.fork + sectors.merge) / 2, 'external', true],
    ['technical', sectors.technical + 0.02, 'external'],
    ['loop-approach', sectors.loopApproach + 0.003, 'external'], ['inverted', sectors.inverted, 'external'],
  ]) {
    await page.evaluate(({ u, mode, branch }) => window.__foundry.pose(u, mode, branch), { u, mode, branch });
    await page.screenshot({ path: join(output, `${name}.png`) });
    if (name === 'inverted') assert.ok((await page.evaluate(() => window.__foundry.snapshot())).up[1] < -0.99);
  }
  console.log('PASS: captured all sectors, cockpit, skyway and inverted loop.');
  // Normal render-loop simulation from controlled approaches (not simulated screenshots).
  for (const gap of ION_FOUNDRY.gaps) {
    await page.evaluate(u => { window.__foundry.pose(u); window.__foundry.run(); }, gap.start - 0.002);
    await page.keyboard.down('ArrowUp');
    await page.waitForFunction(() => window.__foundry.snapshot().flight, null, { timeout: 30000 });
    await page.waitForFunction(() => window.__foundry.snapshot().landings === 1, null, { timeout: 30000 });
    await page.evaluate(() => window.__foundry.pause());
    assert.equal((await page.evaluate(() => window.__foundry.snapshot())).recoveries, 0);
  }
  await page.keyboard.up('ArrowUp');
  console.log('PASS: real render-loop player launch and landing on both gaps.');
  await page.evaluate(u => { window.__foundry.pose(u); window.__foundry.run(5); }, sectors.fork - 0.001);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.__foundry.snapshot().entries === 1);
  await page.waitForFunction(() => window.__foundry.snapshot().merges === 1, null, { timeout: 60000 });
  await page.keyboard.up('ArrowUp'); await page.evaluate(() => window.__foundry.pause());
  assert.equal((await page.evaluate(() => window.__foundry.snapshot())).route, null);
  console.log('PASS: player approach lane selects skyway and real movement rejoins main road.');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(u => window.__foundry.pose(u), sectors.loopApproach);
  await page.screenshot({ path: join(output, 'landscape.png') });
  await page.close();

  const editor = await context.newPage();
  await editor.goto(`${base}/editor.html?track=track15`);
  await editor.waitForFunction(() => document.querySelector('#track-title').textContent.includes('Ion Foundry'));
  assert.equal(await editor.locator('#gap-count').innerText(), '2');
  await editor.screenshot({ path: join(output, 'editor-overview.png') });
  const pending = editor.waitForEvent('download'); await editor.locator('#download-button').click();
  const download = await pending, path = join(output, 'ion-foundry.json'); await download.saveAs(path);
  const exported = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(exported.track.objects.length, ION_FOUNDRY.objects.length);
  assert.equal(exported.track.branches[0].id, 'needle'); assert.equal(exported.track.gaps.length, 2);
  assert.ok(exported.track.objects.some(o => o.texture?.endsWith('.webp')));
  await editor.locator('#save-button').click(); await editor.reload();
  await editor.waitForFunction(() => document.querySelector('#track-title').textContent.includes('Ion Foundry'));
  assert.equal(await editor.locator('#gap-count').innerText(), '2');
  console.log('PASS: editor opens, exports and saves/reloads complete track.');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  console.log(JSON.stringify({ output, errors, requests }));
} catch (error) {
  for (const [i, page] of context.pages().entries()) await page.screenshot({ path: join(output, `failure-${i}.png`), timeout: 5000 }).catch(() => {});
  console.error({ errors, requests }); throw error;
} finally { await browser.close(); }

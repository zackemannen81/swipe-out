// Real WebGL acceptance. Inspection/seek hooks exist only in this intercepted
// test response; production exposes no game state or teleport controls.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NECROS, NECROS_SECTORS as sectors } from '../src/track-necros.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.TEST_OUTPUT_DIR ?? join(tmpdir(), 'swipe-out-necros');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] });
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
window.__necros = {
  snapshot() {
    const objects=scene.getObjectByName('customTrackObjects')?.children ?? [];
    const maps=[...new Set(objects.map(m=>m.material?.map).filter(Boolean))];
    return { hudSpeed:document.querySelector('#race-speed').textContent, hudPeak:document.querySelector('#race-top-speed').textContent, displaySource:race.currentSpeed, state:race.state, distance:shipPhysics.distance, speed:shipPhysics.speed, length:curve.getLength(),
      landings:shipPhysics.landings,recoveries:shipPhysics.recoveries,flight:!!shipPhysics.flight,
      route:shipPhysics.route, entries:shipPhysics.routeEntries,merges:shipPhysics.routeMerges,
      up:camera.up.toArray(), objects:objects.length,maps:maps.length,
      texturesReady:maps.every(t=>t.image?.width>0),geometries:new Set(objects.map(m=>m.geometry)).size,
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
  await page.goto(`${base}/?track=track17`);
  await page.locator('#start-button').click();
  await page.waitForFunction(() => window.__necros?.snapshot().texturesReady);
  assert.equal(await page.locator('#track-select').inputValue(), 'track17');
  const assets = await page.evaluate(() => window.__necros.snapshot());
  assert.equal(assets.objects, NECROS.objects.length); assert.equal(assets.geometries, 0);
  console.log('PASS: loaded route-only track without scenery', assets);
  await page.waitForFunction(() => window.__necros.snapshot().state === 'racing', null, { timeout: 30000 });
  for (const [name, u, mode, branch] of [
    ['parade', .004, 'wipeoutStyle'], ['cathedral', sectors.cathedral+.008, 'wipeoutStyle'],
    ['ascension', sectors.ascension+.03, 'wipeoutStyle'], ['summit', sectors.summit, 'wipeoutStyle'],
    ['drop', sectors.drop+.015, 'wipeoutStyle'], ['monuments', sectors.monuments, 'wipeoutStyle'],
  ]) {
    await page.evaluate(({ u, mode, branch }) => window.__necros.pose(u, mode, branch), { u, mode, branch });
    await page.screenshot({ path: join(output, `${name}.png`) });
  }
  console.log('PASS: captured Necros sectors.');
  await page.evaluate(u => { window.__necros.pose(u); window.__necros.run(); }, sectors.drop);
  const diveEntry = (await page.evaluate(() => window.__necros.snapshot())).speed;
  // Coast through the descent: gravity alone must exceed the entry speed.
  await page.waitForFunction(u => window.__necros.snapshot().distance / window.__necros.snapshot().length > u, sectors.monuments, { timeout: 45000 });
  await page.keyboard.up('ArrowUp');
  assert.equal((await page.evaluate(() => window.__necros.snapshot())).recoveries, 0);
  const diveExit = (await page.evaluate(() => window.__necros.snapshot())).speed;
  assert.ok(diveExit > diveEntry + 20, `gravity dive ${diveEntry} -> ${diveExit}`);
  console.log('PASS: real render-loop coast through dive', {diveEntry, diveExit});
  const hud = await page.evaluate(() => window.__necros.snapshot());
  const current = Number(hud.hudSpeed.match(/(\d+) KM\/H/)[1]);
  const peak = Number(hud.hudPeak.match(/(\d+) KM\/H/)[1]);
  assert.equal(current, Math.round(hud.displaySource * 3.25 * 3.6));
  assert.ok(peak >= current);
  console.log('PASS: current and peak HUD use the same scale', {current, peak});
  await page.close();

  const editor = await context.newPage();
  await editor.goto(`${base}/editor.html?track=track17`);
  await editor.waitForFunction(() => document.querySelector('#track-title').textContent.includes('Conquest Spire'));
  assert.equal(await editor.locator('#gap-count').innerText(), '0');
  await editor.screenshot({ path: join(output, 'editor-overview.png') });
  const pending = editor.waitForEvent('download'); await editor.locator('#download-button').click();
  const download = await pending, path = join(output, 'necros.json'); await download.saveAs(path);
  const exported = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(exported.track.objects.length, NECROS.objects.length);
  assert.equal(exported.track.branches.length, 0); assert.equal(exported.track.gaps.length, 0);

  await editor.locator('#save-button').click(); await editor.reload();
  await editor.waitForFunction(() => document.querySelector('#track-title').textContent.includes('Conquest Spire'));
  assert.equal(await editor.locator('#gap-count').innerText(), '0');
  console.log('PASS: editor opens, exports and saves/reloads complete track.');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  console.log(JSON.stringify({ output, errors, requests }));
} catch (error) {
  for (const [i, page] of context.pages().entries()) await page.screenshot({ path: join(output, `failure-${i}.png`), timeout: 5000 }).catch(() => {});
  console.error({ errors, requests }); throw error;
} finally { await browser.close(); }

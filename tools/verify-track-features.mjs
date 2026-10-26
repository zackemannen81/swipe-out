// Browser integration of TRACK-002. The route injection below is test-only:
// production game code does not expose debug state or teleport controls.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.TEST_OUTPUT_DIR ?? join(tmpdir(), 'swipe-out-track002');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1100, height: 760 }, acceptDownloads: true });
context.setDefaultTimeout(30000);
const errors = [], requests = [];
context.on('page', page => {
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('response', response => { if (response.status() >= 400) requests.push(`${response.status()} ${response.url()}`); });
});
await context.route('**/src/game.js*', async route => {
  const response = await route.fetch();
  const body = await response.text();
  await route.fulfill({ response, body: body + `
window.__featureTest = {
  snapshot() { return { state: race.state, paused: isPaused, distance: shipPhysics.distance,
    length: curve.getLength(), speed: shipPhysics.speed, flight: !!shipPhysics.flight, launches: shipPhysics.launches,
    landings: shipPhysics.landings, recoveries: shipPhysics.recoveries, recovery: shipPhysics.recoveryTimer,
    flightPosition: shipPhysics.flight?.position.toArray(), position: craft.position.toArray(),
    up: camera.up.toArray(), frameUp: race.poseFrame?.normal.toArray(),
    opponents: opponents.map(o => ({ landings: o.physics.landings, recoveries: o.physics.recoveries, distance: o.distance })) }; },
  seek(progress, speed = 140) {
    Object.assign(shipPhysics, createShipPhysics(speed)); shipPhysics.distance = progress * curve.getLength();
    updateCraftPose(0); shipPhysics.previousPosition.copy(craft.position); magneticCamera.reset();
  },
  gapStart() { return curve.track.gaps[0].start; },
  checkpointScene(kind) {
    for (let i=1;i<2000;i++) {
      const f=getTrackFrame(curve,i/2000);
      if ((kind==='loop' && f.center.y>120 && f.normal.y<-.9) || (kind==='roll' && f.center.z>500 && f.normal.y<-.98)) { this.seek(i/2000); return; }
    }
    throw new Error('Feature pose not found');
  }
};
` });
});
try {
  const editor = await context.newPage();
  await editor.goto(`${base}/editor.html?track=track11`);
  await editor.waitForFunction(() => document.querySelector('#track-title').textContent.includes('Gap Run'));
  assert.equal(await editor.locator('#magnetic-input').isChecked(), true);
  assert.equal(await editor.locator('#gap-count').innerText(), '1');
  const end = editor.getByRole('spinbutton', { name: 'Gap 1 end percent', exact: true });
  const originalEnd = await end.inputValue();
  await end.fill(String(Number(originalEnd) + 0.2)); await end.press('Tab');
  await editor.locator('#undo-button').click();
  assert.equal(await end.inputValue(), originalEnd);
  const dlPromise = editor.waitForEvent('download'); await editor.locator('#download-button').click();
  const dl = await dlPromise, file = join(output, 'gap-v2.json'); await dl.saveAs(file);
  const json = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(json.version, 2); assert.equal(json.track.gaps.length, 1); assert.equal(json.track.magnetic, true);
  await editor.locator('#import-file').setInputFiles(file);
  await editor.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Imported as a new draft'));
  assert.equal(await editor.locator('#gap-count').innerText(), '1');
  await editor.locator('#save-button').click();
  await editor.locator('#track-select').selectOption('track12');
  await editor.locator('#point-bank').fill('30'); await editor.locator('#point-bank').press('Tab');
  await editor.locator('#undo-button').click();
  assert.equal(await editor.locator('#point-bank').inputValue(), '0');
  await editor.locator('#side-button').click(); await editor.waitForTimeout(400);
  await editor.screenshot({ path: join(output, 'loop-editor.png') });
  console.log('PASS: gap and roll editor controls, undo, v2 export/import.');
  await editor.close();

  const game = await context.newPage();
  await game.goto(`${base}/?track=track11`);
  await game.waitForFunction(() => !!window.__featureTest);
  await game.locator('#start-button').click();
  await game.waitForFunction(() => window.__featureTest.snapshot().state === 'racing', null, { timeout: 60000 });
  await game.keyboard.down('ArrowUp');
  await game.waitForFunction(() => window.__featureTest.snapshot().flight, null, { timeout: 90000 });
  console.log('Launch snapshot:', await game.evaluate(() => window.__featureTest.snapshot()));
  await game.locator('#btn-pause-toggle').click();
  await game.keyboard.down('ArrowUp');
  const frozen = await game.evaluate(() => window.__featureTest.snapshot());
  await game.waitForTimeout(300);
  assert.deepEqual((await game.evaluate(() => window.__featureTest.snapshot())).flightPosition, frozen.flightPosition);
  await game.screenshot({ path: join(output, 'gap-flight-paused.png') });
  await game.locator('#btn-pause-toggle').click();
  await game.keyboard.down('ArrowUp');
  await game.waitForFunction(() => window.__featureTest.snapshot().landings > 0, null, { timeout: 30000 });
  await game.waitForFunction(() => window.__featureTest.snapshot().opponents.every(o => o.landings > 0), null, { timeout: 60000 });
  const jump = await game.evaluate(() => window.__featureTest.snapshot());
  assert.equal(jump.recoveries, 0);
  console.log('PASS: real player/CPU jump and landing; pause freezes world-space flight.', jump);
  await game.keyboard.up('ArrowUp');
  // Controlled low-speed approach exercises the actual render loop's recovery.
  await game.evaluate(() => window.__featureTest.seek(window.__featureTest.gapStart() - 0.001, 40));
  await game.waitForFunction(() => window.__featureTest.snapshot().recoveries === 1, null, { timeout: 30000 });
  const recovered = await game.evaluate(() => window.__featureTest.snapshot());
  assert.ok(recovered.distance < json.track.gaps[0].start * recovered.length);
  assert.equal(recovered.flight, false);
  await game.screenshot({ path: join(output, 'gap-recovery.png') });
  await game.reload(); await game.waitForFunction(() => !!window.__featureTest);
  const reset = await game.evaluate(() => window.__featureTest.snapshot());
  assert.equal(reset.launches, 0); assert.equal(reset.recoveries, 0); assert.equal(reset.flight, false);
  console.log('PASS: controlled miss recovers before ramp; reload starts with clean flight state.');

  await game.goto(`${base}/?track=track12`);
  await game.waitForFunction(() => !!window.__featureTest);
  await game.locator('#start-button').click();
  await game.waitForFunction(() => window.__featureTest.snapshot().state === 'racing', null, { timeout: 60000 });
  await game.keyboard.down('ArrowUp');
  await game.waitForFunction(() => window.__featureTest.snapshot().position[1] > 120 && window.__featureTest.snapshot().frameUp[1] < -0.9, null, { timeout: 60000 });
  await game.screenshot({ path: join(output, 'vertical-loop-race.png') });
  const loop = await game.evaluate(() => window.__featureTest.snapshot());
  assert.equal(loop.flight, false); assert.equal(loop.recoveries, 0); assert.ok(loop.up[1] < -0.9);
  await game.evaluate(() => window.__featureTest.checkpointScene('roll'));
  await game.waitForFunction(() => window.__featureTest.snapshot().up[1] < -0.9);
  await game.screenshot({ path: join(output, 'barrel-roll-race.png') });
  const roll = await game.evaluate(() => window.__featureTest.snapshot());
  assert.equal(roll.flight, false); assert.equal(roll.recoveries, 0);
  await game.keyboard.up('ArrowUp');
  console.log('PASS: actual loop traversal with inverted camera; controlled barrel-roll pose renders correctly.');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  console.log(JSON.stringify({ output, errors, requests }));
} catch (error) {
  for (const [i, page] of context.pages().entries()) {
    console.error('Failure state:', await page.evaluate(() => window.__featureTest?.snapshot()).catch(() => null));
    await page.screenshot({ path: join(output, `failure-${i}.png`), timeout: 5000 }).catch(() => {});
  }
  console.error({ errors, requests }); throw error;
} finally { await browser.close(); }

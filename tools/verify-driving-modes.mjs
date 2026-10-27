// Test-only instrumentation is appended to an intercepted response, never shipped.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FOUNDRY_SECTORS } from '../src/track-foundry.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.TEST_OUTPUT_DIR ?? join(tmpdir(), 'swipe-out-drive001');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
context.setDefaultTimeout(30000);
const errors = [], requests = [];
context.on('page', page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) requests.push(`${r.status()} ${r.url()}`); });
});
await context.addInitScript(() => { window.__pad = null; Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__pad] }); });
await context.route('**/src/game.js*', async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `
window.__driving = {
  snapshot() { return { state:race.state,paused:isPaused,mode:shipPhysics.handlingMode,settings:activeDrivingSettings,
    cameraProfile:cameraProfile(activeDrivingSettings),cameraMode:cameraSystem.mode,
    yaw:shipPhysics.yaw,yawVelocity:shipPhysics.yawVelocity,lane:shipPhysics.lateralOffset,
    distance:shipPhysics.distance,brakeLeft:shipPhysics.brakeLeft,brakeRight:shipPhysics.brakeRight,
    gamepad:classicGamepadInput,throttle:race.gamepadThrottle,mobileThrottle:mobileInput.throttle,
    touchPointer:mobileSteering.pointerId,targetSteering:race.targetSteering,flight:!!shipPhysics.flight,
    landings:shipPhysics.landings,recoveries:shipPhysics.recoveries,
    up:camera.up.toArray(),position:craft.position.toArray(),camera:camera.position.toArray(),
    look:camera.getWorldDirection(new THREE.Vector3()).toArray(),tangent:race.poseFrame?.tangent.toArray() }; },
  seek(u,speed=140,freeze=false) {
    Object.assign(shipPhysics,createShipPhysics(speed,{handlingMode:activeDrivingSettings.handling}));
    shipPhysics.distance=u*curve.getLength();race.targetSteering=race.steering=0;
    updateCraftPose(0);shipPhysics.previousPosition.copy(craft.position);
    classicCamera.reset();magneticCamera.reset();cameraSystem.mode='external';
    cameraSystem.update(craft.position,craft.quaternion,new THREE.Vector3(),0,race.poseFrame);
    isPaused=freeze;clock.getDelta();setScreen(pauseScreen,false);panoramaBackdrop.position.copy(craft.position);composer.render();
  },
  finish() { finishRace(); }
};` });
});
try {
  const page = await context.newPage(); await page.goto(`${base}/?track=track15`);
  assert.equal(await page.locator('#handling-select').inputValue(), 'swipeout');
  assert.equal(await page.locator('#assist-select').isEnabled(), true);
  await page.locator('#assist-select').selectOption('0.5');
  await page.locator('#handling-select').selectOption('wipeout');
  assert.equal(await page.locator('#assist-select').isDisabled(), true);
  await page.locator('#camera-follow-select').selectOption('swipeout');
  await page.reload();
  assert.equal(await page.locator('#handling-select').inputValue(), 'wipeout');
  assert.equal(await page.locator('#camera-follow-select').inputValue(), 'swipeout');
  assert.equal(await page.locator('#assist-select').inputValue(), '0.5');
  await page.locator('#camera-follow-select').selectOption('auto');
  await page.waitForFunction(() => !document.querySelector('#start-button').disabled);
  await page.screenshot({ path: join(output, 'mode-menu.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator('#start-button').scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: join(output, 'mode-menu-landscape.png') });
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.locator('#start-button').click();
  await page.waitForFunction(() => window.__driving?.snapshot().state === 'racing', null, { timeout: 60000 });
  let s = await page.evaluate(() => window.__driving.snapshot());
  assert.equal(s.mode, 'wipeout'); assert.equal(s.cameraProfile, 'wipeout');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.__driving.snapshot().yaw > 0.06);
  await page.keyboard.up('ArrowLeft');
  await page.waitForFunction(() => Math.abs(window.__driving.snapshot().yawVelocity) < 0.01);
  s = await page.evaluate(() => window.__driving.snapshot());
  assert.ok(s.yaw > 0.06 && s.lane > 0);
  assert.ok(s.look.some((n, i) => Math.abs(n - s.tangent[i]) > 0.01));
  await page.screenshot({ path: join(output, 'classic-steering.png') });
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(old => window.__driving.snapshot().yaw < old * 0.7, s.yaw);
  await page.keyboard.up('ArrowRight');
  console.log('PASS: saved independent modes, responsive menu, real keyboard yaw/momentum/countersteer and heading camera.');

  await page.evaluate(() => {
    window.__pad = { axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ value: 0, pressed: false })) };
    window.__pad.buttons[7] = { value: 0.6, pressed: true };
  });
  await page.waitForFunction(() => window.__driving.snapshot().brakeRight > 0.3);
  s = await page.evaluate(() => window.__driving.snapshot());
  assert.equal(s.throttle, 0); assert.equal(s.gamepad.brakeRight, 0.6); assert.equal(s.gamepad.brakeLeft, 0);
  await page.evaluate(() => { window.__pad.buttons[0] = { value: 1, pressed: true }; });
  await page.waitForFunction(() => window.__driving.snapshot().throttle === 1);
  await page.evaluate(() => { window.__pad = null; });
  await page.waitForFunction(() => window.__driving.snapshot().brakeRight === 0 && window.__driving.snapshot().throttle === 0);
  await page.locator('#btn-pause-toggle').click();
  const paused = await page.evaluate(() => window.__driving.snapshot());
  await page.waitForTimeout(250);
  assert.deepEqual((await page.evaluate(() => window.__driving.snapshot())).position, paused.position);
  await page.locator('#resume-button').click();
  console.log('PASS: synthetic analog R2/A mapping, disconnect and pause freeze.');

  await page.setViewportSize({ width: 800, height: 390 });
  const steering = await page.locator('#touch-steering-zone').boundingBox();
  assert.ok(steering);
  const touchX = steering.x + steering.width / 2, touchY = steering.y + steering.height / 2;
  await page.mouse.move(touchX, touchY); await page.mouse.down();
  await page.mouse.move(touchX + 60, touchY);
  await page.waitForFunction(() => window.__driving.snapshot().targetSteering > 0.3);
  await page.keyboard.press('Escape');
  s = await page.evaluate(() => window.__driving.snapshot());
  assert.equal(s.touchPointer, null); assert.equal(s.targetSteering, 0);
  await page.mouse.up(); await page.locator('#resume-button').click();
  const pedal = await page.locator('#btn-thrust').boundingBox();
  await page.mouse.move(pedal.x + pedal.width / 2, pedal.y + pedal.height / 2); await page.mouse.down();
  assert.equal((await page.evaluate(() => window.__driving.snapshot())).mobileThrottle, 1);
  await page.mouse.up();
  assert.equal((await page.evaluate(() => window.__driving.snapshot())).mobileThrottle, 0);
  await page.setViewportSize({ width: 1280, height: 850 });
  console.log('PASS: mobile steering/pedal pointer controls and captured-pointer reset on pause.');

  await page.evaluate(u => window.__driving.seek(u), FOUNDRY_SECTORS.jump1 - 0.002);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.__driving.snapshot().flight);
  await page.waitForFunction(() => window.__driving.snapshot().landings === 1);
  assert.equal((await page.evaluate(() => window.__driving.snapshot())).recoveries, 0);
  await page.keyboard.up('ArrowUp');
  await page.evaluate(u => window.__driving.seek(u, 140, true), FOUNDRY_SECTORS.inverted);
  assert.ok((await page.evaluate(() => window.__driving.snapshot())).up[1] < -0.99);
  await page.screenshot({ path: join(output, 'classic-loop.png') });
  // Camera selector still reaches cockpit and the original spectator views.
  await page.keyboard.press('v');
  await page.evaluate(() => window.__driving.seek(0.02));
  await page.keyboard.press('v');
  await page.waitForFunction(() => window.__driving.snapshot().cameraMode === 'internal');
  await page.screenshot({ path: join(output, 'classic-cockpit.png') });
  console.log('PASS: real classic jump/landing, inverted chase and cockpit rendering.');

  await page.evaluate(() => window.__driving.finish());
  await page.locator('#retry-button').click();
  s = await page.evaluate(() => window.__driving.snapshot());
  assert.equal(s.mode, 'wipeout'); assert.equal(s.yaw, 0); assert.equal(s.landings, 0);
  await page.evaluate(() => window.__driving.finish()); await page.locator('#menu-button').click();
  await page.locator('#handling-select').selectOption('swipeout');
  assert.equal(await page.locator('#assist-select').isEnabled(), true);
  assert.equal(await page.locator('#assist-select').inputValue(), '0.5');
  await page.locator('#camera-follow-select').selectOption('wipeout'); await page.locator('#start-button').click();
  s = await page.evaluate(() => window.__driving.snapshot());
  assert.equal(s.mode, 'swipeout'); assert.equal(s.cameraProfile, 'wipeout');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  console.log('PASS: finish/retry resets, menu returns to saved Swipeout assist with independent classic camera.');
  console.log(JSON.stringify({ output, errors, requests }));
} catch (error) {
  for (const [i, page] of context.pages().entries()) {
    console.error(await page.evaluate(() => window.__driving?.snapshot()).catch(() => null));
    await page.screenshot({ path: join(output, `failure-${i}.png`), timeout: 5000 }).catch(() => {});
  }
  console.error({ errors, requests }); throw error;
} finally { await browser.close(); }

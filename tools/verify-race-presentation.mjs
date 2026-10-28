// Response-only instrumentation: never included in the shipped game.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const output = join(tmpdir(), 'swipe-out-present001');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
await context.addInitScript(() => {
  Element.prototype.requestFullscreen = async () => {};
  window.__pad = null;
  Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__pad] });
});
await context.route('**/src/game.js*', async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `
window.__presentation = {
 snapshot() { const p = craft.position.clone().project(camera); return {
   state:race.state, paused:isPaused, intro:raceIntro.elapsed, elapsed:race.elapsed,
   countdown:race.countdownTimer, distance:shipPhysics.distance,
   opponents:opponents.map(o=>o.physics.distance), mode:cameraSystem.mode,
   projected:p.toArray(), camera:camera.position.toArray(), solo:practice.active }; },
 finish() { finishRace(); },
 pause() { togglePause(); },
 details() { document.querySelector('#practice-results').hidden=false;
   document.querySelector('#practice-result-laps').innerHTML = Array.from({length:20},(_,i)=>
   '<tr><td>'+i+'</td><td>01:23.45</td><td>00:25.00</td><td>00:25.00</td><td>00:33.45</td><td>VALID</td></tr>').join(''); },
 sounds:[], observeAudio() { const original=raceAudio.playSfx.bind(raceAudio);
   raceAudio.playSfx=(name)=>{this.sounds.push({name,time:race.countdownTimer});original(name);}; }
};` });
});
const page = await context.newPage();
page.setDefaultTimeout(45000);
const snap = () => page.evaluate(() => window.__presentation.snapshot());
async function start() {
  await page.waitForFunction(() => !document.querySelector('#start-button').disabled);
  await page.locator('#start-button').click();
  await page.waitForFunction(() => window.__presentation.snapshot().state === 'intro');
}
async function layout(name) {
  await page.evaluate(() => document.fonts.ready);
  const info = await page.evaluate(() => {
    const selectors=['#results-screen','#results-heading','#retry-button','#menu-button'];
    return selectors.map(selector=>{const e=document.querySelector(selector), r=e.getBoundingClientRect();
      return {selector, x:r.x,y:r.y,right:r.right,bottom:r.bottom,sw:e.scrollWidth,cw:e.clientWidth};});
  });
  const size=page.viewportSize();
  for(const r of info) {
    assert.ok(r.x>=0 && r.y>=0 && r.right<=size.width+1 && r.bottom<=size.height+1, JSON.stringify(r));
    assert.ok(r.sw<=r.cw+1, `horizontal overflow ${JSON.stringify(r)}`);
  }
  await page.screenshot({path:join(output,`${name}.png`)});
}
try {
  await page.goto('http://127.0.0.1:5173/?track=track15');
  await start();
  await page.evaluate(() => window.__presentation.observeAudio());
  const initial=await snap();
  await page.waitForTimeout(450);
  await page.keyboard.press('Escape');
  const frozen=await snap();
  assert.equal(frozen.paused,true);
  await page.waitForTimeout(350);
  assert.equal((await snap()).intro,frozen.intro);
  assert.equal(frozen.elapsed,0); assert.equal(frozen.distance,initial.distance);
  assert.deepEqual(frozen.opponents,initial.opponents); assert.equal(frozen.countdown,4);
  await page.keyboard.press('Escape');
  await page.screenshot({path:join(output,'intro-foundry.png')});
  assert.ok(Math.abs(frozen.projected[0])<0.9 && Math.abs(frozen.projected[1])<0.9,'craft visible during intro');
  console.log('waiting countdown',await snap());
  await page.waitForFunction(() => window.__presentation.snapshot().state==='countdown',null,{timeout:90000});
  assert.equal((await snap()).mode,'wipeoutStyle');
  await page.screenshot({path:join(output,'chase-countdown.png')});
  console.log('waiting racing',await snap());
  await page.waitForFunction(() => window.__presentation.snapshot().state==='racing',null,{timeout:20000});
  const sounds=await page.evaluate(() => window.__presentation.sounds.filter(s=>s.name.startsWith('countdown')));
  assert.deepEqual(sounds.map(s=>s.name),['countdownThree','countdownTwo','countdownOne','countdownGo']);
  for(let i=0;i<sounds.length;i++) assert.ok(Math.abs(sounds[i].time-(3-i))<0.06);
  await page.evaluate(() => window.__presentation.finish());
  const oldCss=execFileSync('git',['show','HEAD:src/style.css'],{encoding:'utf8'});
  const savedCss=await page.evaluate(css=>{const style=[...document.querySelectorAll('style')].find(s=>s.dataset.viteDevId?.endsWith('/src/style.css'));const current=style.textContent;style.textContent=css;return current;},oldCss);
  await page.screenshot({path:join(output,'results-before.png')});
  await page.evaluate(css=>{[...document.querySelectorAll('style')].find(s=>s.dataset.viteDevId?.endsWith('/src/style.css')).textContent=css;},savedCss);
  await layout('results-desktop');
  for(const viewport of [{width:844,height:390},{width:667,height:375},{width:568,height:320}]) {
    await page.setViewportSize(viewport); await layout(`results-${viewport.width}`);
  }
  await page.setViewportSize({width:844,height:390});
  await page.locator('#retry-button').click();
  assert.equal((await snap()).state,'intro');
  await page.locator('#skip-intro').click();
  await page.waitForFunction(() => window.__presentation.snapshot().state==='countdown');
  assert.equal((await snap()).mode,'wipeoutStyle');
  await page.waitForFunction(() => window.__presentation.snapshot().state==='racing');
  await page.evaluate(() => window.__presentation.finish());
  await page.locator('#menu-button').click();
  await page.locator('#race-mode-select').selectOption('time-attack');
  await page.locator('#handling-select').selectOption('wipeout');
  await start();
  assert.equal((await snap()).solo,true);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__presentation.snapshot().state==='countdown');
  await page.waitForFunction(() => window.__presentation.snapshot().state==='racing');
  await page.keyboard.press('Escape');
  await page.locator('#end-session-button').click();
  await page.evaluate(() => window.__presentation.details());
  await layout('time-attack-long-landscape');
  assert.ok(await page.locator('.results-details').evaluate(e=>e.scrollHeight>e.clientHeight));
  await page.setViewportSize({width:568,height:320}); await layout('time-attack-long-small');
  await page.locator('#menu-button').click();
  await page.locator('#track-select').selectOption('track1');
  await page.locator('#handling-select').selectOption('swipeout');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#start-button').click();
  await page.waitForFunction(() => window.__presentation.snapshot().state==='countdown');
  assert.equal((await snap()).intro,3.2);
  const legacy=await snap();
  assert.ok(Math.abs(legacy.projected[0])<0.9 && Math.abs(legacy.projected[1])<0.9, 'legacy craft visible');
  await page.screenshot({path:join(output,'legacy-grid.png')});
  // Compare against committed countdown implementation, not a rewritten copy.
  const source=await (await fetch('http://127.0.0.1:5173/src/game.js')).text();
  const baseline=execFileSync('git',['show','HEAD:src/game.js'],{encoding:'utf8'});
  const countdown=s=>s.replace(/\r\n/g,'\n').split("  if (race.state === 'countdown') {")[1].split("  } else if (race.state === 'racing') {")[0];
  assert.equal(countdown(source),countdown(baseline));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,sounds,output}));
} catch(error) {console.error(error); console.error('browser errors',errors);throw error;} finally { await browser.close(); }

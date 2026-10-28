import assert from 'node:assert/strict';
import { RACER_DEFINITIONS } from '../src/opponents.js';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1100,height:740},reducedMotion:'reduce'});
const output=join(tmpdir(),'swipe-out-cpu001');await mkdir(output,{recursive:true});
const errors=[];
context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};});
await context.route('**/src/game.js*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:await response.text()+`
window.__cpu = {
 snapshot(){return {state:race.state,selected:selectedCpuDifficulty,active:activeCpuDifficulty,
   solo:practice.active,catchUp:shipPhysics.catchUpBonus,limit:CPU_DIFFICULTIES[activeCpuDifficulty].catchUp,
   drivers:opponents.map(o=>({name:o.name,difficulty:o.difficulty,topSpeed:o.topSpeed,
     visible:o.group.visible,distance:o.distance,risk:o.risk}))};},
 finish(){finishRace();}
};`});
});
try {
  const page=await context.newPage();page.setDefaultTimeout(60000);
  await page.goto('http://127.0.0.1:5173/?track=track15');
  await page.waitForFunction(()=>!!window.__cpu);
  assert.equal(await page.locator('#cpu-difficulty-select').inputValue(),'pilot');
  await page.locator('#cpu-difficulty-select').selectOption('elite');
  await page.reload();
  await page.waitForFunction(()=>!!window.__cpu);
  assert.equal(await page.locator('#cpu-difficulty-select').inputValue(),'elite');
  assert.match(await page.locator('#cpu-difficulty-description').innerText(),/2%/);
  await page.screenshot({path:join(output,'elite-menu.png')});
  await page.setViewportSize({width:844,height:390});
  await page.locator('#cpu-difficulty-select').scrollIntoViewIfNeeded();
  await page.screenshot({path:join(output,'elite-landscape.png')});
  await page.waitForFunction(()=>!document.querySelector('#start-button').disabled);
  await page.locator('#start-button').click();
  await page.waitForFunction(()=>window.__cpu.snapshot().state==='racing');
  let s=await page.evaluate(()=>window.__cpu.snapshot());
  assert.equal(s.active,'elite');assert.equal(s.limit,0.02);
  assert.ok(s.drivers.every(d=>d.difficulty==='elite'&&d.visible));
  assert.deepEqual(s.drivers.map(d=>d.topSpeed),RACER_DEFINITIONS.map(d=>d.topSpeed));
  await page.evaluate(()=>window.__cpu.finish());await page.locator('#retry-button').click();
  await page.waitForFunction(()=>window.__cpu.snapshot().state==='racing');
  assert.equal((await page.evaluate(()=>window.__cpu.snapshot())).active,'elite');
  await page.evaluate(()=>window.__cpu.finish());await page.locator('#menu-button').click();
  await page.locator('#cpu-difficulty-select').selectOption('rookie');
  await page.locator('#race-mode-select').selectOption('time-attack');
  assert.equal(await page.locator('#cpu-difficulty-select').isDisabled(),true);
  await page.reload();
  await page.waitForFunction(()=>!!window.__cpu);
  assert.equal(await page.locator('#cpu-difficulty-select').isDisabled(),true);
  assert.equal(await page.locator('#cpu-difficulty-select').inputValue(),'rookie');
  await page.waitForFunction(()=>!document.querySelector('#start-button').disabled);
  await page.locator('#start-button').click();
  await page.waitForFunction(()=>window.__cpu.snapshot().state==='racing');
  s=await page.evaluate(()=>window.__cpu.snapshot());
  assert.equal(s.solo,true);assert.equal(s.catchUp,0);assert.ok(s.drivers.every(d=>!d.visible));
  const distances=s.drivers.map(d=>d.distance);
  await page.waitForTimeout(250);
  assert.deepEqual((await page.evaluate(()=>window.__cpu.snapshot())).drivers.map(d=>d.distance),distances);
  await page.evaluate(()=>window.__cpu.finish());await page.locator('#menu-button').click();
  await page.locator('#race-mode-select').selectOption('race');
  assert.equal(await page.locator('#cpu-difficulty-select').isEnabled(),true);
  assert.equal(await page.locator('#cpu-difficulty-select').inputValue(),'rookie');
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    try { Storage.prototype.setItem=()=>{throw new Error('quota');};
      const el=document.querySelector('#cpu-difficulty-select');el.value='pilot';el.dispatchEvent(new Event('change'));
    } finally {Storage.prototype.setItem=original;}
  });
  assert.match(await page.locator('#cpu-difficulty-description').innerText(),/this session/);
  assert.equal((await page.evaluate(()=>window.__cpu.snapshot())).selected,'pilot');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,output}));
} finally {await browser.close();}

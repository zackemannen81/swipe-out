import {chromium} from 'file:///C:/Users/zakri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__rewardTest={frontEnd,craftTemplates,craft,get audio(){return raceAudio;}};'});});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
await page.goto('http://127.0.0.1:5173/?track=track17');await page.waitForFunction(()=>window.__rewardTest,{timeout:90000});
await page.locator('[data-go=garage]').click();
await page.getByRole('button',{name:'Necron Crimson Citadel',exact:true}).click();
await page.waitForTimeout(700);await page.screenshot({path:process.env.TEMP+'/necros-reward-garage.png'});
assert.equal(await page.evaluate(()=>window.__rewardTest.frontEnd.profile.trophies.length),0);
assert.ok(await page.evaluate(()=>window.__rewardTest.craftTemplates['necron-crimson-citadel'].children.some(c=>c.children.length)));
await page.locator('#menu-back').click();await page.locator('[data-go=settings]').click();
await page.locator('#menu-soundtrack').selectOption('/audio/tracks/vi-lever-inte.mp3');
await page.reload();await page.waitForFunction(()=>window.__rewardTest,{timeout:90000});
assert.equal(await page.evaluate(()=>window.__rewardTest.frontEnd.profile.ship),'necron-crimson-citadel');
await page.locator('[data-event=race]').click();await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});await page.locator('#start-button').click();
assert.match(await page.evaluate(()=>window.__rewardTest.audio.audio.src),/vi-lever-inte/);
await page.waitForFunction(()=>window.__rewardTest.audio.audio.readyState>=2,{timeout:30000});
await page.waitForTimeout(500);await page.screenshot({path:process.env.TEMP+'/necros-reward-race.png'});
assert.deepEqual(errors,[]);console.log('Reward model, local preview grant, persisted selections and race audio passed.',errors);
}finally{await browser.close();}


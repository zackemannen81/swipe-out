import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const output=join(tmpdir(),'swipe-out-cup001');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});const errors=[];
context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};});
await context.route('**/src/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__cup={snapshot:()=>({state:race.state,track:currentTrackId,rounds:cup.progress.active?.results.length,settings:cup.progress.active?.settings,running:cup.running,waiting:cup.waiting,bests:cup.progress.data.bests,solo:practice.active,difficulty:activeCpuDifficulty}),
 finish(wait=false){race.elapsed=100;race.distance=shipPhysics.distance=curve.getLength()*3;opponents.forEach((o,i)=>{o.finishTime=wait?null:101+i;o.distance=wait?curve.getLength():curve.getLength()*3;});finishRace();},
 timeout(){race.finishElapsed=60;},
};`});});
try{
 const page=await context.newPage();page.setDefaultTimeout(60000);const ready=async()=>{await page.waitForFunction(()=>!!window.__cup);await page.waitForFunction(()=>!document.querySelector('#start-button').disabled);};
 await page.goto('http://127.0.0.1:5173/?track=track16');await ready();
 await page.locator('#race-mode-select').selectOption('cup');await page.locator('#cpu-difficulty-select').selectOption('elite');
 await page.screenshot({path:join(output,'cup-menu.png')});await page.locator('#start-button').click();
 await page.waitForFunction(()=>window.__cup.snapshot().state==='racing');let snap=await page.evaluate(()=>window.__cup.snapshot());assert.equal(snap.track,'track1');assert.equal(snap.difficulty,'elite');
 await page.evaluate(()=>window.__cup.finish(true));await page.waitForFunction(()=>window.__cup.snapshot().waiting);assert.equal(await page.locator('#retry-button').isDisabled(),true);assert.equal(await page.locator('#menu-button').isDisabled(),true);
 await page.evaluate(()=>window.__cup.timeout());await page.waitForFunction(()=>window.__cup.snapshot().rounds===1);assert.match(await page.locator('#cup-results').innerText(),/DNF/);
 await page.locator('#menu-button').click();await page.reload();await ready();assert.equal(await page.locator('#race-mode-select').inputValue(),'cup');assert.match(await page.locator('#cup-summary').innerText(),/CONTINUE ROUND 2/);assert.equal(await page.locator('#cpu-difficulty-select').isDisabled(),true);
 await page.locator('#start-button').click();await page.waitForFunction(()=>window.__cup.snapshot().track==='track13');await page.reload();await ready();assert.equal((await page.evaluate(()=>window.__cup.snapshot())).rounds,1);
 await page.locator('#start-button').click();await page.waitForFunction(()=>window.__cup.snapshot().state==='racing');assert.equal((await page.evaluate(()=>window.__cup.snapshot())).track,'track13');
 await page.evaluate(()=>window.__cup.finish());await page.waitForFunction(()=>window.__cup.snapshot().rounds===2);await page.locator('#retry-button').click();await page.waitForFunction(()=>window.__cup.snapshot().state==='racing');assert.equal((await page.evaluate(()=>window.__cup.snapshot())).track,'track15');
 await page.evaluate(()=>window.__cup.finish());await page.waitForFunction(()=>window.__cup.snapshot().rounds===3);assert.match(await page.locator('#cup-result-summary').innerText(),/GOLD/);assert.deepEqual(Object.values((await page.evaluate(()=>window.__cup.snapshot())).bests),[1]);
 await page.screenshot({path:join(output,'cup-final.png')});await page.setViewportSize({width:568,height:320});await page.screenshot({path:join(output,'cup-final-landscape.png')});await page.setViewportSize({width:1280,height:800});
 await page.locator('#menu-button').click();await page.locator('#race-mode-select').selectOption('time-attack');await page.locator('#start-button').click();await page.waitForFunction(()=>window.__cup.snapshot().state==='racing');assert.equal((await page.evaluate(()=>window.__cup.snapshot())).solo,true);assert.equal((await page.evaluate(()=>window.__cup.snapshot())).running,false);assert.equal((await page.evaluate(()=>window.__cup.snapshot())).rounds,3);
 await page.evaluate(()=>window.__cup.finish());assert.equal(await page.locator('#cup-results').isVisible(),false);await page.locator('#menu-button').click();await page.locator('#race-mode-select').selectOption('race');assert.equal(await page.locator('#track-select').isDisabled(),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output}));
}finally{await browser.close();}

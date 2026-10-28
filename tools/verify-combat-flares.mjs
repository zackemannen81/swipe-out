import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
const output=join(tmpdir(),'swipe-out-combat002');await mkdir(output,{recursive:true});const errors=[];
context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};});
await context.route('**/src/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__flares={
 snapshot(){const s=combat.states.get('player');return {race:race.state,enabled:combat.enabled,cooldown:s?.flareCooldown,uses:s?.flareUses,deflected:s?.deflected,paused:isPaused};},
 incoming(){for(const s of combat.states.values())s.aiTimer=999;const s=combat.states.get('player');s.flareCooldown=0;s.flareTime=0;s.deflectedTime=0;const f=getTrackFrame(curve,shipPhysics.distance/curve.getLength());combat.projectiles=[{id:++combat.serial,owner:opponents[0].name,type:'homing',target:'player',position:craft.position.clone().addScaledVector(f.tangent,-35).addScaledVector(f.normal,.6),velocity:f.tangent.clone().multiplyScalar(40),speed:40,life:10}];},
 threat(){const s=combat.states.get('player');s.incoming=false;s.targeted=true;s.deflectedTime=0;updateCombatHud();isPaused=true;},
 resume(){isPaused=false;clock.getDelta();},
 pad(pressed){const original=navigator.getGamepads;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{buttons:Array.from({length:16},(_,i)=>({pressed:i===1&&pressed,value:i===1&&pressed?1:0})),axes:[0,0,0,0]}]});handleGamepadInput();Object.defineProperty(navigator,'getGamepads',{configurable:true,value:original});},
 effectPreview(){const f=getTrackFrame(curve,shipPhysics.distance/curve.getLength());combat.projectiles=[];combat.effects=[];combat.effect(craft.position.clone().addScaledVector(f.tangent,14).addScaledVector(f.normal,2),0xffad55,1);combat.effects[0].life-=.12;combatView.update(combat);isPaused=true;},
 finish(){finishRace();}
};`});});
try {
 const page=await context.newPage();page.setDefaultTimeout(60000);await page.goto('http://127.0.0.1:5173/?track=track14');await page.waitForFunction(()=>!!window.__flares);
 await page.locator('#combat-enabled').check();await page.locator('#start-button').click();await page.waitForFunction(()=>window.__flares.snapshot().race==='racing');
 await page.evaluate(()=>window.__flares.threat());assert.match(await page.locator('#combat-threat').innerText(),/ENEMY TARGET LOCK/);assert.doesNotMatch(await page.locator('#lock-status').innerText(),/ENEMY/);await page.screenshot({path:join(output,'enemy-lock.png')});
 await page.evaluate(()=>{window.__flares.resume();window.__flares.incoming();});await page.waitForFunction(()=>document.querySelector('#combat-threat').dataset.threat==='incoming');
 await page.screenshot({path:join(output,'incoming.png')});await page.keyboard.press('x');await page.waitForFunction(()=>window.__flares.snapshot().deflected>0);
 assert.equal((await page.evaluate(()=>window.__flares.snapshot())).uses,1);await page.screenshot({path:join(output,'diverted.png')});
 await page.locator('#btn-pause-toggle').click();const paused=await page.evaluate(()=>window.__flares.snapshot());await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>window.__flares.snapshot())).cooldown,paused.cooldown);
 await page.locator('#btn-pause-toggle').click();
 await page.evaluate(()=>window.__flares.incoming());await page.locator('#flare-button').click();await page.waitForFunction(()=>window.__flares.snapshot().uses===2);
 await page.evaluate(()=>{window.__flares.incoming();window.__flares.pad(true);});await page.waitForFunction(()=>window.__flares.snapshot().uses===3);
 await page.evaluate(()=>window.__flares.pad(false));
 for(const [width,height] of [[844,390],[568,320]]) {await page.setViewportSize({width,height});await page.evaluate(()=>window.__flares.threat());
  const bounds=await page.locator('#combat-threat').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y+bounds.height<=height);
  const lock=await page.locator('#lock-status').boundingBox();assert.ok(lock.y+lock.height<=bounds.y);
  const button=await page.locator('#flare-button').boundingBox();assert.ok(button.x>=0&&button.x+button.width<=width&&button.y+button.height<=height);
  await page.screenshot({path:join(output,'threat-'+width+'.png')});await page.evaluate(()=>window.__flares.resume());}
 await page.evaluate(()=>window.__flares.effectPreview());await page.screenshot({path:join(output,'impact.png')});await page.evaluate(()=>window.__flares.resume());
 await page.evaluate(()=>window.__flares.finish());await page.locator('#retry-button').click();await page.waitForFunction(()=>window.__flares.snapshot().race==='racing');assert.equal((await page.evaluate(()=>window.__flares.snapshot())).uses,0);
 await page.evaluate(()=>window.__flares.finish());await page.locator('#menu-button').click();await page.locator('#race-mode-select').selectOption('time-attack');await page.locator('#start-button').click();await page.waitForFunction(()=>window.__flares.snapshot().race==='racing');
 assert.equal((await page.evaluate(()=>window.__flares.snapshot())).enabled,false);assert.equal(await page.locator('#combat-threat').isVisible(),false);assert.equal(await page.locator('#flare-button').isVisible(),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output}));
} finally {await browser.close();}

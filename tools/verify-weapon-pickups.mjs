import assert from 'node:assert/strict';import {mkdir,readFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
const output=join(tmpdir(),'swipe-out-combat003');await mkdir(output,{recursive:true});const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};});
await context.route('**/src/editor.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__pickupEditor={snapshot:()=>structuredClone(track())};'});});
await context.route('**/src/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__pickup={
 snapshot(){const s=combat.states.get('player');return {race:race.state,enabled:combat.enabled,weapon:s?.weapon,ammo:s?.ammo,shots:s?.shots,pickups:s?.pickups,time:combat.time,pads:race.weaponPads?.length,visible:track.userData.weaponPads.visual.visible};},
 cross(){const pad=race.weaponPads[0];combat.padReadyAt.clear();shipPhysics.flight=null;shipPhysics.recoveryTimer=0;shipPhysics.route=pad.routeId?{id:pad.routeId,lap:0}:null;shipPhysics.distance=pad.d-10;shipPhysics.lateralOffset=pad.offset;shipPhysics.verticalOffset=0;combat.capture(combatRacers());shipPhysics.distance=pad.d+5;combat.step(1/60,combatRacers(),curve);updateCraftPose(0);updateCombatHud();updateWeaponPads(track,combat.time,combat);},
 finish(){finishRace();}
};`});});
try{
 const page=await context.newPage();page.setDefaultTimeout(60000);
 await page.goto('http://127.0.0.1:5173/editor.html?track=track16');await page.waitForFunction(()=>!!window.__pickupEditor);
 await page.locator('#add-weapon').click();let data=await page.evaluate(()=>window.__pickupEditor.snapshot());const index=data.pads.length;
 assert.equal(data.pads.at(-1).type,'weapon');await page.getByLabel('Pad '+index+' weapon',{exact:true}).selectOption('homing');
 await page.locator('#undo-button').click();assert.equal((await page.evaluate(()=>window.__pickupEditor.snapshot())).pads.at(-1).weapon,'rocket');await page.locator('#redo-button').click();
 await page.getByLabel('Pad '+index+' weapon',{exact:true}).selectOption('minigun');
 await page.locator('#pad-list .gap-row').last().getByRole('button',{name:'FOCUS',exact:true}).click();await page.screenshot({path:join(output,'editor-weapon.png')});
 await page.locator('#save-button').click();await page.reload();await page.waitForFunction(()=>!!window.__pickupEditor);assert.equal((await page.evaluate(()=>window.__pickupEditor.snapshot())).pads.at(-1).weapon,'minigun');
 const pending=page.waitForEvent('download');await page.locator('#download-button').click();const downloaded=await pending,source=await readFile(await downloaded.path(),'utf8');const exported=JSON.parse(source);assert.equal(exported.version,5);
 await page.locator('#import-file').setInputFiles({name:'weapons.json',mimeType:'application/json',buffer:Buffer.from(source)});await page.waitForFunction(()=>document.querySelector('#track-select').value.startsWith('custom-'));assert.deepEqual((await page.evaluate(()=>window.__pickupEditor.snapshot())).pads,exported.track.pads);await page.locator('#save-button').click();
 await page.goto('http://127.0.0.1:5173/?track=track16');await page.waitForFunction(()=>!!window.__pickup);await page.locator('#combat-enabled').check();await page.locator('#start-button').click();await page.waitForFunction(()=>window.__pickup.snapshot().race==='countdown');
 assert.equal((await page.evaluate(()=>window.__pickup.snapshot())).weapon,null);assert.match(await page.locator('#weapon-status').innerText(),/EMPTY/);
 await page.waitForFunction(()=>window.__pickup.snapshot().race==='racing');await page.evaluate(()=>window.__pickup.cross());assert.equal((await page.evaluate(()=>window.__pickup.snapshot())).weapon,'minigun');assert.equal((await page.evaluate(()=>window.__pickup.snapshot())).pads,1);
 await page.waitForFunction(()=>{const i=document.querySelector('#weapon-icon');return !i.hidden && i.complete && i.naturalWidth===256;});
 assert.match(await page.locator('#weapon-icon').getAttribute('src'),/minigun-256.png/);
 for(const name of ['minigun','rockets','heatseeker'])assert.equal((await page.request.get('http://127.0.0.1:5173/images/icons/'+name+'-256.png')).status(),200);
 await page.screenshot({path:join(output,'pickup-race.png')});await page.keyboard.press('1');assert.equal((await page.evaluate(()=>window.__pickup.snapshot())).weapon,'minigun');
 await page.keyboard.down('Space');await page.waitForFunction(()=>window.__pickup.snapshot().weapon===null);await page.keyboard.up('Space');assert.equal((await page.evaluate(()=>window.__pickup.snapshot())).shots,30);assert.equal(await page.locator('#weapon-icon').isVisible(),false);
 await page.locator('#btn-pause-toggle').click();const time=(await page.evaluate(()=>window.__pickup.snapshot())).time;await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>window.__pickup.snapshot())).time,time);await page.locator('#btn-pause-toggle').click();
 await page.setViewportSize({width:568,height:320});await page.screenshot({path:join(output,'empty-landscape.png')});
 await page.evaluate(()=>window.__pickup.finish());await page.locator('#retry-button').click();await page.waitForFunction(()=>window.__pickup.snapshot().race==='countdown');assert.equal((await page.evaluate(()=>window.__pickup.snapshot())).pickups,0);
 await page.evaluate(()=>window.__pickup.finish());await page.locator('#menu-button').click();await page.locator('#race-mode-select').selectOption('time-attack');await page.locator('#start-button').click();await page.waitForFunction(()=>window.__pickup.snapshot().race==='racing');
 const solo=await page.evaluate(()=>window.__pickup.snapshot());assert.equal(solo.enabled,false);assert.equal(solo.visible,false);assert.equal(await page.locator('#combat-hud').isVisible(),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output}));
}finally{await browser.close();}


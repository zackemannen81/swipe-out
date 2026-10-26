// Isolated browser acceptance. Debug access is injected into served test responses,
// never shipped in game.js. Requires a running Vite and external Playwright/Chrome.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:5173',output=join(tmpdir(),'swipe-out-track003');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1000,height:720},acceptDownloads:true});context.setDefaultTimeout(30000);
const errors=[],requests=[];
context.on('page',p=>{p.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});p.on('response',r=>{if(r.status()>=400)requests.push(`${r.status()} ${r.url()}`);});});
await context.route('**/src/game.js*',async route=>{
  const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__nextTest={
 snapshot(){return {state:race.state,paused:isPaused,enabled:combat.enabled,distance:shipPhysics.distance,route:shipPhysics.route,entries:shipPhysics.routeEntries,merges:shipPhysics.routeMerges,
  position:craft.position.toArray(),speed:shipPhysics.speed,player:{...combat.states.get('player')},opponents:opponents.map(o=>({name:o.name,entries:o.physics.routeEntries,combat:{...combat.states.get(o.name)}})),
  projectiles:combat.projectiles.map(p=>({position:p.position.toArray(),type:p.type})),effects:combat.effects.length};},
 approach(){const b=curve.track.branches[0];Object.assign(shipPhysics,createShipPhysics(130));shipPhysics.distance=b.start*curve.getLength()-15;shipPhysics.lateralOffset=6;shipPhysics.assistLevel=0;updateCraftPose(0);shipPhysics.previousPosition.copy(craft.position);},
 center(){shipPhysics.assistLevel=1;},
 arena(cpu=false){const origin=curve.getLength()*.16;Object.assign(shipPhysics,createShipPhysics(100));shipPhysics.distance=origin+(cpu?65:0);updateCraftPose(0);shipPhysics.previousPosition.copy(craft.position);
  opponents.forEach((o,i)=>{Object.assign(o.physics,createShipPhysics(100,o.physics.tuning));o.physics.distance=origin+(cpu?i*12:65+i*65);o.physics.lateralOffset=0;o.targetLane=0;o.targetSpeed=100;o.trafficSpeedLimit=Infinity;o.decisionTimer=100;o.finishTime=null;syncOpponentPose(o,curve,trackWidth);o.physics.previousPosition.copy(o.group.position);});
  combat.reset(true,combatRacers());for(const [id,s] of combat.states){s.aiTimer=cpu?0:999;if(cpu)s.weapon='rocket';} },
 finish(){shipPhysics.distance=curve.getLength()*3-1;shipPhysics.speed=133;updateCraftPose(0);shipPhysics.previousPosition.copy(craft.position);}
};`});
});
try{
  const editor=await context.newPage();await editor.goto(`${base}/editor.html?track=track6`);
  await editor.waitForFunction(()=>document.querySelector('#track-title').textContent==='Gemini');
  await editor.locator('#object-select').selectOption('0');
  await editor.locator('#clone-object-button').click();
  assert.equal(await editor.locator('#object-select option').count(),7); // five originals + clone + placeholder
  await editor.getByRole('spinbutton',{name:'Object opacity',exact:true}).fill('0.25');
  await editor.getByRole('spinbutton',{name:'Object opacity',exact:true}).press('Tab');
  let downloadPromise=editor.waitForEvent('download');await editor.locator('#download-button').click();
  let download=await downloadPromise,file=join(output,'cloned-scenery.json');await download.saveAs(file);
  const cloned=JSON.parse(await readFile(file,'utf8')).track;
  const original=cloned.objects[0],copy=cloned.objects.at(-1);
  assert.notEqual(copy.id,original.id);assert.notDeepEqual(copy.position,original.position);
  for(const field of ['type','rotation','scale','texture','animType','color','emissive'])assert.deepEqual(copy[field],original[field]);
  assert.equal(copy.opacity,0.25);assert.notEqual(original.opacity,0.25);
  await editor.locator('#undo-button').click();await editor.locator('#undo-button').click();assert.equal(await editor.locator('#object-select option').count(),6);
  await editor.locator('#redo-button').click();assert.equal(await editor.locator('#object-select option').count(),7);
  await editor.locator('#save-button').click();await editor.reload();await editor.waitForFunction(()=>document.querySelector('#object-select').options.length===7);
  console.log('PASS: clone identity, independent properties, textures, undo/redo, save/reload and export.');

  await editor.locator('#track-select').selectOption('track13');await editor.locator('#branch-select').selectOption('0');
  const height=await editor.locator('#point-y').inputValue();await editor.locator('#point-y').fill('18');await editor.locator('#point-y').press('Tab');
  await editor.locator('#undo-button').click();assert.equal(await editor.locator('#point-y').inputValue(),height);
  await editor.getByRole('spinbutton',{name:'Route WIDTH',exact:true}).fill('8');await editor.getByRole('spinbutton',{name:'Route WIDTH',exact:true}).press('Tab');
  await editor.getByRole('textbox',{name:'Route NAME',exact:true}).fill('Needle test');await editor.getByRole('textbox',{name:'Route NAME',exact:true}).press('Tab');
  await editor.locator('#top-button').click();await editor.screenshot({path:join(output,'branch-editor.png')});
  downloadPromise=editor.waitForEvent('download');await editor.locator('#download-button').click();download=await downloadPromise;file=join(output,'route-v3.json');await download.saveAs(file);
  const routeJson=JSON.parse(await readFile(file,'utf8'));assert.equal(routeJson.version,3);assert.equal(routeJson.track.branches[0].width,8);
  await editor.locator('#import-file').setInputFiles(file);await editor.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Imported as a new draft'));
  await editor.locator('#branch-select').selectOption('0');assert.equal(await editor.getByRole('textbox',{name:'Route NAME',exact:true}).inputValue(),'Needle test');
  await editor.locator('#save-button').click();
  await editor.locator('#track-select').selectOption('track14');await editor.locator('#add-branch-button').click();
  assert.equal(await editor.locator('#branch-select option').count(),2);await editor.locator('#remove-branch-button').click();assert.equal(await editor.locator('#branch-select option').count(),1);
  console.log('PASS: branch editing, connection creation/removal, undo, v3 import/export.');await editor.close();

  const game=await context.newPage();await game.goto(`${base}/?track=track13`);await game.waitForFunction(()=>!!window.__nextTest);
  assert.equal(await game.locator('#combat-enabled').isChecked(),false);await game.locator('#start-button').click();
  await game.waitForFunction(()=>window.__nextTest.snapshot().state==='racing',null,{timeout:90000});
  await game.evaluate(()=>window.__nextTest.approach());await game.waitForFunction(()=>window.__nextTest.snapshot().entries===1);
  await game.evaluate(()=>window.__nextTest.center());
  assert.equal(await game.locator('.minimap-branch.active').count(),1);assert.match(await game.locator('#route-hint').innerText(),/Needle Shortcut/);
  await game.screenshot({path:join(output,'shortcut-race.png')});
  await game.waitForFunction(()=>window.__nextTest.snapshot().merges===1,null,{timeout:90000});
  assert.equal((await game.evaluate(()=>window.__nextTest.snapshot())).route,null);
  assert.equal(await game.locator('.minimap-branch.active').count(),0);
  console.log('PASS: controlled approach selects shortcut, drives and merges; route HUD/minimap follow.');

  await game.goto(`${base}/?track=track14`);await game.waitForFunction(()=>!!window.__nextTest);
  await game.locator('#combat-enabled').check();await game.locator('#start-button').click();
  await game.waitForFunction(()=>window.__nextTest.snapshot().state==='racing',null,{timeout:90000});
  await game.evaluate(()=>window.__nextTest.arena());await game.keyboard.down('Space');
  await game.waitForFunction(()=>window.__nextTest.snapshot().projectiles.length>0);await game.keyboard.up('Space');
  await game.locator('#btn-pause-toggle').click();const frozen=await game.evaluate(()=>window.__nextTest.snapshot());await game.waitForTimeout(300);
  assert.deepEqual((await game.evaluate(()=>window.__nextTest.snapshot())).projectiles,frozen.projectiles);
  await game.locator('#btn-pause-toggle').click();await game.waitForFunction(()=>window.__nextTest.snapshot().player.hits>0);
  console.log('PASS: real fire key, visible rocket, pause freeze and player hit.');
  await game.evaluate(()=>window.__nextTest.arena());await game.locator('[data-weapon="homing"]').click();
  await game.waitForFunction(()=>window.__nextTest.snapshot().player.lockTime>=0.9,null,{timeout:30000});
  await game.screenshot({path:join(output,'homing-locked.png')});await game.keyboard.down('Space');
  await game.waitForFunction(()=>window.__nextTest.snapshot().player.shots>0);await game.keyboard.up('Space');
  await game.waitForFunction(()=>window.__nextTest.snapshot().player.hits>0);
  await game.evaluate(()=>window.__nextTest.arena());await game.locator('[data-weapon="minigun"]').click();
  const fire=await game.locator('#fire-button').boundingBox();await game.mouse.move(fire.x+fire.width/2,fire.y+fire.height/2);await game.mouse.down();
  await game.waitForFunction(()=>window.__nextTest.snapshot().player.shots>=3);await game.mouse.up();
  await game.screenshot({path:join(output,'minigun-race.png')});
  console.log('PASS: visible homing lock/shot/hit and pointer-held minigun burst.');
  await game.evaluate(()=>window.__nextTest.arena(true));
  await game.waitForFunction(()=>window.__nextTest.snapshot().player.hitsTaken>0,null,{timeout:30000});
  console.log('PASS: CPU fires through the shared system and hits the player.');
  await game.evaluate(()=>window.__nextTest.finish());await game.waitForFunction(()=>window.__nextTest.snapshot().state==='finished');
  assert.equal((await game.evaluate(()=>window.__nextTest.snapshot())).projectiles.length,0);
  await game.locator('#retry-button').click();await game.waitForFunction(()=>window.__nextTest.snapshot().state==='countdown');
  const fresh=await game.evaluate(()=>window.__nextTest.snapshot());assert.equal(fresh.player.shots,0);assert.equal(fresh.player.ammo.rocket,6);assert.equal(fresh.player.hitsTaken,0);
  await game.setViewportSize({width:844,height:390});await game.screenshot({path:join(output,'combat-landscape.png')});
  assert.ok(await game.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  console.log('PASS: finish/retry resets combat; landscape layout fits.');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log(JSON.stringify({output,errors,requests}));
}catch(error){for(const [i,page] of context.pages().entries()){console.error('state',await page.evaluate(()=>window.__nextTest?.snapshot()).catch(()=>null));await page.screenshot({path:join(output,`failure-${i}.png`)}).catch(()=>{});}throw error;}
finally{await browser.close();}

import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),errors=[];
context.setDefaultTimeout(20000);
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__obs={frontEnd,tourBus,renderer};'});});
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__obs,null,{timeout:120000});
 await page.evaluate(()=>['00','01','03','05','06'].forEach(id=>__obs.frontEnd.markZoneIntro(id)));
 await page.locator('[data-go=bus]:visible').click();await page.locator('[data-station=observation]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);
 await page.evaluate(()=>__obs.tourBus.hub.loadAssets()); const fitted=await page.evaluate(async()=>{const T=await import('/node_modules/three/build/three.module.js');return __obs.tourBus.hub.registry.filter(r=>/TB-OBS-(BENCH|CONSOLE|VINE)/.test(r.id)).map(r=>({id:r.id,state:r.group.userData.loadState,minY:new T.Box3().setFromObject(r.group).min.y,ground:r.group.position.y}));});assert.equal(fitted.length,6);for(const p of fitted){assert.equal(p.state,'loaded',p.id);assert.ok(Math.abs(p.minY-p.ground)<.001,p.id);} await page.screenshot({path:'tmp/polish-observation-necros.png'});
 const greenery=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');const hub=__obs.tourBus.hub;
  hub.scene.updateMatrixWorld(true);
  const rows=hub.registry.filter(r=>/TB-OBS-(TREE|FOLIAGE)/.test(r.id));
  const ray=new T.Raycaster(hub.camera.position,hub.camera.getWorldDirection(new T.Vector3()),0,50);
  const meshes=rows.map(r=>r.group.children[0].getObjectByProperty('isMesh',true));
  return {rows:rows.map(r=>{const b=new T.Box3().setFromObject(r.group);return {id:r.id,state:r.group.userData.loadState,min:b.min.toArray(),max:b.max.toArray(),ground:r.group.position.y};}),hits:ray.intersectObjects(rows.map(r=>r.group),true).length,sharedBush:meshes[0].geometry===meshes[1].geometry};
 });
 assert.equal(greenery.rows.length,6);assert.equal(greenery.hits,0);assert.ok(greenery.sharedBush);
 for(const row of greenery.rows){assert.equal(row.state,'loaded');assert.ok(Math.abs(row.min[1]-row.ground)<.001);assert.ok(row.min[2]>-17&&row.max[2]<17);}
 await page.waitForFunction(()=>{const g=__obs.tourBus.hub.scene.getObjectByName('TB-OBS-PLANTER-01');return g.children.some(o=>o.material?.map?.image?.width===2048&&o.material?.roughnessMap?.image?.width===2048);});
 await page.screenshot({path:'tmp/polish-observation-necros.png'});
 assert.equal(await page.evaluate(()=>__obs.tourBus.hub.manifest().filter(r=>r.id.startsWith('TB-OBS-PLANTER')).length),4);
 await page.locator('[data-station=briefing]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);await page.locator('[data-world=vitrum]').click();await page.locator('[data-station=observation]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);await page.screenshot({path:'tmp/polish-observation-vitrum.png'});
 assert.equal(await page.evaluate(()=>__obs.tourBus.hub.scene.getObjectByName('TB-MOON-01').visible),false);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/polish-observation-mobile.png'});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);assert.equal(await page.evaluate(()=>__obs.tourBus.hub.navigation.station),'briefing');
 await page.setViewportSize({width:1440,height:900});
 await page.locator('[data-world=collective]').click();await page.locator('[data-station=observation]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);
 await page.screenshot({path:'tmp/polish-observation-collective.png'});
 const orbit=await page.evaluate(()=>{const h=__obs.tourBus.hub;return {ships:h.registry.filter(r=>r.kind==='orbital-traffic').map(r=>({loaded:r.group.userData.loadState,x:r.group.position.x})),atmosphere:!!h.scene.getObjectByName('tour-atmosphere')};});
 assert.equal(orbit.ships.length,3);for(const ship of orbit.ships){assert.equal(ship.loaded,'loaded');assert.ok(ship.x<-110);}assert.ok(orbit.atmosphere);
 await page.locator('[data-station=briefing]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);await page.locator('[data-world=necros]').click();await page.locator('[data-station=observation]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);
 await page.locator('#bus-view-toggle').click();assert.equal(await page.locator('.bus-panel').isVisible(),false);assert.equal(await page.locator('.bus-restore-view').isVisible(),true);
 await page.screenshot({path:'tmp/polish-observation-quiet.png'});await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>__obs.tourBus.hub.navigation.station),'observation');assert.equal(await page.locator('.bus-panel').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'bus-view-toggle');
 await page.setViewportSize({width:390,height:844});await page.locator('#bus-view-toggle').click();await page.locator('.bus-restore-view').click();assert.ok(await page.locator('.bus-panel').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS: six loaded/shared/grounded greenery props, clear sightline, soil textures, observation architecture, all three worlds, quiet view + focus + mobile return, Back; no page errors');
}finally{await browser.close();}


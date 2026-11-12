import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),errors=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__obs={frontEnd,tourBus,renderer};'});});
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__obs,null,{timeout:120000});
 await page.evaluate(()=>['00','01','03','05','06'].forEach(id=>__obs.frontEnd.markZoneIntro(id)));
 await page.locator('[data-go=bus]:visible').click();await page.locator('[data-station=observation]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);
 await page.evaluate(()=>__obs.tourBus.hub.loadAssets());await page.waitForFunction(()=>{const t=__obs.tourBus.hub.scene.getObjectByName('tour-space-sky').material.map;return t.image?.width===7556&&t.image?.src.endsWith('/space.jpg');}); const fitted=await page.evaluate(async()=>{const T=await import('/node_modules/three/build/three.module.js');return __obs.tourBus.hub.registry.filter(r=>/TB-OBS-(BENCH|CONSOLE|VINE)/.test(r.id)).map(r=>({id:r.id,state:r.group.userData.loadState,minY:new T.Box3().setFromObject(r.group).min.y,ground:r.group.position.y}));});assert.equal(fitted.length,6);for(const p of fitted){assert.equal(p.state,'loaded',p.id);assert.ok(Math.abs(p.minY-p.ground)<.001,p.id);} await page.screenshot({path:'tmp/sky-observation-necros.png'});
 assert.equal(await page.evaluate(()=>__obs.tourBus.hub.manifest().filter(r=>r.id.startsWith('TB-OBS-PLANTER')).length),4);
 await page.locator('[data-station=briefing]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);await page.locator('[data-world=vitrum]').click();await page.locator('[data-station=observation]').click();await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);await page.screenshot({path:'tmp/sky-observation-vitrum.png'});
 assert.equal(await page.evaluate(()=>__obs.tourBus.hub.scene.getObjectByName('TB-MOON-01').visible),false);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/sky-observation-mobile.png'});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!__obs.tourBus.hub.navigation.pending);assert.equal(await page.evaluate(()=>__obs.tourBus.hub.navigation.station),'briefing');
 assert.deepEqual(errors,[]);console.log('PASS: observation architecture, Necros/Vitrum, mobile and Back; no page errors');
}finally{await browser.close();}


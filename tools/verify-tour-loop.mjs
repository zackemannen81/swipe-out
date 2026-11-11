import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'}),errors=[];
await context.route('**/src/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__loop={frontEnd,tourBus,race,finishRace,finishDistance:()=>curve.getLength()*totalLaps};'});});
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const ready=async()=>{await page.waitForFunction(()=>window.__loop,{timeout:120000});await page.evaluate(()=>['00','01','02','03','05','06'].forEach(id=>__loop.frontEnd.markZoneIntro(id)));};
 const settled=()=>page.waitForFunction(()=>!window.__loop.tourBus.hub.navigation.pending);
 const state=()=>page.evaluate(()=>({view:__loop.frontEnd.view,...__loop.frontEnd.tourSession.state}));
 const station=async id=>{await page.locator(`[data-station=${id}]`).click();await settled();};
 const launch=async()=>{await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});await page.locator('#start-button').click();await page.waitForFunction(()=>['intro','countdown','racing'].includes(__loop.race.state));if(await page.locator('#skip-intro').isVisible())await page.locator('#skip-intro').click();await page.waitForFunction(()=>__loop.race.state==='racing',{timeout:30000});};
 await page.goto('http://127.0.0.1:5173');await ready();
 await page.locator('[data-go=bus]:visible').click();await station('briefing');await page.locator('[data-world=vitrum]').click();await station('observation');
 await page.reload();await ready();assert.deepEqual(await state(),{view:'bus',station:'observation',world:'vitrum',location:'bus'});
 await station('briefing');await page.locator('#bus-depart').click();await page.keyboard.press('Escape');assert.equal((await state()).view,'bus');
 await page.locator('#bus-depart').click();await launch();const before=await page.evaluate(()=>JSON.stringify(__loop.frontEnd.profile.trophies));
 await page.keyboard.press('Escape');await page.locator('#pause-menu-button').click();assert.equal((await state()).view,'bus');assert.equal((await state()).station,'hangar');assert.equal(await page.evaluate(()=>JSON.stringify(__loop.frontEnd.profile.trophies)),before);
 await station('briefing');await page.locator('#bus-depart').click();await launch();
 // Controlled finish exercises the real finish handler without a multi-minute lap simulation.
 await page.evaluate(()=>{__loop.race.distance=__loop.finishDistance();__loop.race.elapsed=180;__loop.finishRace();});
 assert.equal(await page.locator('#menu-button').textContent(),'RETURN TO TOUR BUS');
 await page.locator('#retry-button').click();await page.waitForFunction(()=>['intro','countdown','racing'].includes(__loop.race.state));
 assert.equal((await state()).location,'race');
 await page.reload();await ready();assert.equal((await state()).view,'bus');assert.equal((await state()).station,'hangar');
 await station('briefing');await page.locator('#bus-depart').click();await launch();
 await page.evaluate(()=>{__loop.race.distance=__loop.finishDistance();__loop.race.elapsed=180;__loop.finishRace();});await page.locator('#menu-button').click();assert.equal((await state()).view,'bus');assert.equal((await state()).station,'hangar');
 await page.locator('#menu-home').click();await page.reload();await ready();assert.equal((await state()).view,'home');
 await page.locator('[data-event=race]').click();await launch();await page.keyboard.press('Escape');await page.locator('#pause-menu-button').click();assert.equal((await state()).view,'home');
 assert.deepEqual(errors,[]);console.log('PASS: station/world reload, setup Back, abandon without rewards, real result handler, retry origin, race reload, result return, ordinary race isolation.');
}finally{await browser.close();}

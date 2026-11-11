import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Set PLAYWRIGHT_MODULE to the Playwright module path.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const errors=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__tourTest={frontEnd,tourBus,race};'});});
try{
 const page=await context.newPage();
 const settled=()=>page.waitForFunction(()=>document.querySelector('#tour-bus-view').getAttribute('aria-busy')!=='true'&&!window.__tourTest.frontEnd.workshopTransition);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__tourTest,{timeout:120000});await page.evaluate(()=>['00','01','02','03','05','06'].forEach(id=>__tourTest.frontEnd.markZoneIntro(id)));
 await page.locator('[data-go=bus]:visible').click();await page.waitForTimeout(1600);await page.screenshot({path:'tmp/tour-hangar.png'});
 for(const station of ['workshop','briefing','lounge','observation']){await page.locator(`[data-station=${station}]`).click();await settled();await page.screenshot({path:`tmp/tour-${station}.png`});}
 await page.locator('[data-station=briefing]').click();await settled();assert.ok(await page.locator('#bus-depart').isEnabled());
 await page.locator('[data-world=vitrum]').click();await page.locator('#bus-depart').click();assert.equal(await page.locator('#track-select').inputValue(),'track20');
 await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});
 await page.locator('#start-button').click();await page.waitForFunction(()=>['intro','countdown','racing'].includes(window.__tourTest.race.state));
 await page.locator('#skip-intro').click();await page.waitForFunction(()=>window.__tourTest.race.state==='racing',{timeout:15000});
 await page.keyboard.press('Escape');await page.locator('#pause-menu-button').click();
 await page.evaluate(()=>window.__tourTest.frontEnd.show('bus'));await page.locator('[data-station=workshop]').click();await settled();await page.getByRole('button',{name:'OPEN GARAGE'}).click();await settled();assert.equal(await page.evaluate(()=>window.__tourTest.frontEnd.view),'garage');
 await page.keyboard.press('Escape');await settled();assert.equal(await page.evaluate(()=>window.__tourTest.frontEnd.view),'bus');assert.equal(await page.evaluate(()=>window.__tourTest.tourBus.hub.navigation.station),'workshop');
 await page.locator('#menu-back').click();await settled();assert.notEqual(await page.evaluate(()=>window.__tourTest.tourBus.hub.navigation.station),'workshop');
 await page.evaluate(()=>window.__tourTest.frontEnd.show('bus'));await page.setViewportSize({width:390,height:844});await page.locator('[data-station=briefing]').click();await settled();await page.waitForTimeout(1000);await page.screenshot({path:'tmp/tour-mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-station=observation]').click();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>Math.round(window.__tourTest.tourBus.hub.camera.position.z)),10);
 await page.keyboard.press('Escape');await settled();assert.equal(await page.evaluate(()=>window.__tourTest.tourBus.hub.navigation.station),'briefing');
 for(let i=0;i<12&&await page.evaluate(()=>window.__tourTest.frontEnd.view==='bus');i++){await page.keyboard.press('Escape');await settled();}
 assert.equal(await page.evaluate(()=>window.__tourTest.frontEnd.view),'home');
 await page.evaluate(async()=>{const {BUILTIN_TRACKS,saveTrack}=await import('/src/track-library.js');saveTrack(localStorage,'custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386',structuredClone(BUILTIN_TRACKS.track17.data));});
 await page.setViewportSize({width:1440,height:900});await page.reload();await page.waitForFunction(()=>window.__tourTest,{timeout:120000});await page.evaluate(()=>['00','01','02','03','05','06'].forEach(id=>__tourTest.frontEnd.markZoneIntro(id)));
 await page.locator('[data-go=bus]:visible').click();await page.locator('[data-station=briefing]').click();await settled();await page.locator('[data-world=necros]').click();await page.locator('#bus-depart').click();assert.equal(await page.locator('#track-select').inputValue(),'track19');assert.ok(await page.locator('#track-select').isDisabled());
 assert.deepEqual(errors,[]);console.log('Tour Bus browser navigation, garage, Vitrum setup, shipped Necros, mobile, reduced motion, Escape: PASS');
}finally{await browser.close();}

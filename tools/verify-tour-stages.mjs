import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
try {
for (const [world,key] of [['necros','track19'],['vitrum','track20'],['collective','track21']]) {
 const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'}),errors=[];
 await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__stages={frontEnd,tourBus,race,scene,TRACK_CONFIG};'});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__stages,null,{timeout:120000});
 await page.evaluate(()=>['00','01','02','03','05','06'].forEach(id=>__stages.frontEnd.markZoneIntro(id)));
 await page.locator('[data-go=bus]:visible').click();await page.locator('[data-station=briefing]').click();
 await page.waitForFunction(()=>!__stages.tourBus.hub.navigation.pending);
 await page.locator(`[data-world=${world}]`).click();await page.locator('#bus-depart').click();assert.equal(await page.locator('#track-select').inputValue(),key);
 await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});await page.locator('#start-button').click();
 await page.waitForFunction(()=>['intro','countdown','racing'].includes(__stages.race.state),null,{timeout:120000});
 if(await page.locator('#skip-intro').isVisible())await page.locator('#skip-intro').click();
 await page.waitForFunction(()=>__stages.race.state==='racing',null,{timeout:120000}).catch(async e=>{console.log(world,await page.evaluate(()=>({state:__stages.race.state,countdown:__stages.race.countdownTimer})),errors);await page.screenshot({path:'tmp/stage-failure.png'});throw e;});
 await page.waitForFunction(key=>{const g=__stages.scene.getObjectByName('customTrackObjects');return g&&__stages.TRACK_CONFIG[key].data.objects.every((o,i)=>o.type!=='glb'||g.children[i]?.userData.loaded||g.children[i]?.userData.error);},key,{timeout:120000});
 assert.deepEqual(await page.evaluate(()=>__stages.scene.getObjectByName('customTrackObjects').userData.loadErrors),[]);
 await page.screenshot({path:`tmp/stage-${world}.png`});await page.keyboard.press('Escape');await page.locator('#pause-menu-button').click();
 assert.equal(await page.evaluate(()=>__stages.frontEnd.view),'bus');assert.equal(await page.evaluate(()=>__stages.frontEnd.tourSession.state.station),'hangar');
 assert.deepEqual(errors,[]);console.log(`PASS ${world}: ${key}, race, scenery, carrier return`);await context.close();
}
const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/editor.html');
for(const key of ['track19','track20','track21'])await page.locator(`#track-select option[value=${key}]`).waitFor({state:'attached',timeout:120000});
console.log('PASS editor: all three supplied stages available');
} finally {await browser.close();}




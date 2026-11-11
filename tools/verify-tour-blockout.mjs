import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {BLOCKOUT_ROOMS} from '../src/tour-blockout.js';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__block={frontEnd,tourBus};'});});
try{
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ready=async()=>{await page.waitForFunction(()=>window.__block,null,{timeout:120000});await page.evaluate(()=>{for(let i=0;i<=15;i++)__block.frontEnd.markZoneIntro(String(i).padStart(2,'0'));});};
 const settled=()=>page.waitForFunction(()=>!__block.tourBus.hub.navigation.pending&&document.querySelector('#tour-bus-view').getAttribute('aria-busy')!=='true');
 await page.goto('http://127.0.0.1:5173');await ready();await page.locator('[data-go=bus]:visible').click();
 for(const r of BLOCKOUT_ROOMS){await page.locator('.bus-directory').selectOption(r.station);await settled();assert.equal(await page.locator('#bus-station').textContent(),r.label);await page.screenshot({path:`tmp/blockout-${r.station}.png`});}
 await page.reload();await ready();assert.equal(await page.evaluate(()=>__block.frontEnd.tourSession.state.station),'museum');
 // A newly available room must trigger its supplied presentation after arrival.
 await page.evaluate(()=>{delete __block.frontEnd.profile.visitedZoneIntros['09'];});await page.locator('.bus-directory').selectOption('medbay');await settled();await page.locator('.bus-crew:not([hidden])').waitFor();assert.match(await page.locator('.bus-crew h3').textContent(),/MEDBAY/i);await page.keyboard.press('Enter');
 await page.setViewportSize({width:390,height:844});await page.locator('.bus-directory').selectOption('engineering');await settled();await page.screenshot({path:'tmp/blockout-mobile.png'});
 const bounds=await page.locator('.bus-directory').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390);
 await page.keyboard.press('Escape');await settled();assert.equal(await page.evaluate(()=>__block.tourBus.hub.navigation.station),'medbay');
 assert.deepEqual(errors,[]);console.log('PASS: 10 new rooms, reload, Medbay first visit, mobile selector, Back; no page errors');
}finally{await browser.close();}

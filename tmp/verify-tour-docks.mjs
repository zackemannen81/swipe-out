import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Set PLAYWRIGHT_MODULE to the Playwright module path.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const errors=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__tourTest={frontEnd,tourBus,race};'});});
try{const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__tourTest);await page.locator('[data-go=bus]:visible').click();
await page.waitForFunction(()=>['TB-PAD-01','TB-DOCK-01','TB-DOCK-02','TB-DOCK-03','TB-SHUTTLE-01','TB-SHUTTLE-02','TB-SHUTTLE-03','TB-PORT-01'].every(n=>window.__tourTest.tourBus.hub.scene.getObjectByName(n).userData.loadState==='loaded'),null,{timeout:120000});
await page.waitForTimeout(1500);await page.screenshot({path:'tmp/tour-docks.png'});
await page.evaluate(()=>{const h=window.__tourTest.tourBus.hub;h.update=()=>{};h.camera.position.set(4,7,8);h.camera.lookAt(-12,2,-13);});await page.waitForTimeout(300);await page.screenshot({path:'tmp/tour-docks-close.png'});
assert.deepEqual(errors,[]);console.log('PASS all eight imported instances loaded, no page errors');
}finally{await browser.close();}
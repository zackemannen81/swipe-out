import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Set PLAYWRIGHT_MODULE to the Playwright module path.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const errors=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__tourTest={frontEnd,tourBus,race};'});});
try{
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__tourTest,{timeout:120000});
await page.locator('[data-go=bus]:visible').click();await page.locator('[data-station=observation]').click();
await page.waitForFunction(()=>['necros-surface','necros-clouds','tour-space-sky'].every(n=>window.__tourTest.tourBus.hub.scene.getObjectByName(n).material.map?.image?.width>0));
await page.waitForTimeout(1600);await page.screenshot({path:'tmp/tour-necros-textured.png'});
const result=await page.evaluate(()=>{const h=window.__tourTest.tourBus.hub;const c=h.scene.getObjectByName('necros-clouds');const p=h.scene.getObjectByName('necros-surface');const before={opacity:c.material.opacity,cloudRadius:c.geometry.parameters.radius,surfaceRadius:p.geometry.parameters.radius};h.setWorld('vitrum');const vitrum=!c.visible&&p.material.map===null;h.setWorld('necros');return {...before,vitrum,restored:c.visible&&!!p.material.map};});
assert.equal(result.opacity,.25);assert.ok(result.cloudRadius>result.surfaceRadius);assert.ok(result.vitrum&&result.restored);assert.deepEqual(errors,[]);console.log(result);
}finally{await browser.close();}
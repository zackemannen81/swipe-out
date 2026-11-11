import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
try {
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/src/editor-view.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('updateAmbientParticles(road,particleTime);','updateAmbientParticles(road,particleTime); window.__ambientEditor=road?.getObjectByName("AmbientParticles")?.children[0].material.uniforms.time.value;')});});
await page.goto('http://127.0.0.1:5173/editor.html');
await page.waitForFunction(()=>window.__ambientEditor===0,null,{timeout:120000});
await page.locator('#scenery-preview').check();await page.waitForFunction(()=>window.__ambientEditor>0);
await page.locator('#scenery-preview').uncheck();await page.waitForFunction(()=>window.__ambientEditor===0);
assert.deepEqual(errors,[]);console.log('PASS editor particle preview on/off');
}finally{await browser.close();}

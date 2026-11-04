import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Set PLAYWRIGHT_MODULE to the Playwright module path.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const errors=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__tourTest={frontEnd,tourBus,race};'});});
try{const page=await context.newPage();await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__tourTest);await page.locator('[data-go=bus]:visible').click();
for(const file of ['outside-hangar','hangar-port','cargo-shuttle']){
await page.evaluate(async file=>{const T=await import('/node_modules/three/build/three.module.js');const {loadGlb}=await import('/src/glb-scenery.js');const h=window.__tourTest.tourBus.hub;h.update=()=>{};for(const o of h.scene.children)o.visible=!!o.isLight;const m=await loadGlb('/models/tour-bus/'+file+'.glb');const b=new T.Box3().setFromObject(m),c=b.getCenter(new T.Vector3()),sz=b.getSize(new T.Vector3());m.scale.setScalar(10/Math.max(sz.x,sz.y,sz.z));m.position.copy(c).multiplyScalar(-m.scale.x);h.scene.add(m);h.camera.position.set(10,7,12);h.camera.lookAt(0,0,0);document.querySelector('#tour-bus')?.setAttribute('style','opacity:0');},file);
await page.waitForTimeout(500);await page.screenshot({path:'tmp/preview-'+file+'.png'});}
}finally{await browser.close();}
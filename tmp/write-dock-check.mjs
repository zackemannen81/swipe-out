import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('tmp/verify-tour-planet.mjs','utf8').split('try{')[0];
s+=`try{const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__tourTest);await page.locator('[data-go=bus]:visible').click();
await page.waitForFunction(()=>['TB-PAD-01','TB-DOCK-01','TB-DOCK-02','TB-DOCK-03','TB-SHUTTLE-01','TB-SHUTTLE-02','TB-SHUTTLE-03','TB-PORT-01'].every(n=>window.__tourTest.tourBus.hub.scene.getObjectByName(n).userData.loadState==='loaded'),null,{timeout:120000});
await page.waitForTimeout(1500);await page.screenshot({path:'tmp/tour-docks.png'});
await page.evaluate(()=>{const h=window.__tourTest.tourBus.hub;h.update=()=>{};h.camera.position.set(4,7,8);h.camera.lookAt(-12,2,-13);});await page.waitForTimeout(300);await page.screenshot({path:'tmp/tour-docks-close.png'});
assert.deepEqual(errors,[]);console.log('PASS all eight imported instances loaded, no page errors');
}finally{await browser.close();}`;writeFileSync('tmp/verify-tour-docks.mjs',s);

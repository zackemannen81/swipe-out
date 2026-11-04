import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('tmp/verify-tour-planet.mjs','utf8');
s=s.replace("await page.locator('[data-station=observation]').click();", "await page.waitForFunction(()=>window.__tourTest.tourBus.hub.scene.getObjectByName('TB-PAD-01').userData.loadState==='loaded',null,{timeout:90000});await page.locator('[data-station=workshop]').click();await page.waitForTimeout(1600);await page.screenshot({path:'tmp/tour-repair-platform.png'});console.log(await page.evaluate(()=>({pad:window.__tourTest.tourBus.hub.scene.getObjectByName('TB-PAD-01').userData,shipY:window.__tourTest.tourBus.hub.ship.position.y})));await page.locator('[data-station=observation]').click();");
s=s.replace('tour-necros-textured.png','tour-necros-moon.png');
s=s.replace("'tour-space-sky'].every","'tour-space-sky','necros-moon'].every");
writeFileSync('tmp/verify-tour-moon-pad.mjs',s);

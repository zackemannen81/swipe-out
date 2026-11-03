import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__sacrificeTest={frontEnd,race,opponents,craftTemplates,finishRace,get curve(){return curve;}};'});});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/?track=track17');await page.waitForFunction(()=>window.__sacrificeTest,{timeout:90000});
 await page.locator('[data-go=garage]').click();assert.equal(await page.getByRole('button',{name:/^The sacrifice/}).isDisabled(),true);
 await page.locator('#menu-back').click();await page.locator('[data-go=settings]').click();await page.locator('#handling-select').selectOption('swipeout');await page.locator('#assist-select').selectOption('1.0');
 await page.locator('#menu-back').click();await page.locator('[data-event=race]').click();await page.locator('#cpu-difficulty-select').selectOption('rookie');
 await page.evaluate(()=>document.documentElement.requestFullscreen=async()=>{});await page.locator('#start-button').click();await page.locator('#skip-intro').click();await page.waitForFunction(()=>window.__sacrificeTest.race.state==='racing',{timeout:15000});
 // Controlled actual finish path: all four opponents crossed earlier.
 await page.evaluate(()=>{const t=window.__sacrificeTest;t.race.elapsed=150;t.race.distance=t.curve.getLength()*3;t.race.recordLaps=[50,50,50];t.opponents.forEach((o,i)=>{o.finishTime=100+i;o.distance=t.race.distance;});t.finishRace();});
 assert.match(await page.locator('#bonus-result').textContent(),/Unlocked: The sacrifice/);await page.screenshot({path:process.env.TEMP+'/sacrifice-result.png'});
 await page.locator('#menu-button').click();await page.locator('[data-go=garage]').click();await page.getByRole('button',{name:'The sacrifice',exact:true}).click();await page.waitForTimeout(400);await page.screenshot({path:process.env.TEMP+'/sacrifice-garage.png'});
 await page.reload();await page.waitForFunction(()=>window.__sacrificeTest,{timeout:90000});assert.equal(await page.evaluate(()=>window.__sacrificeTest.frontEnd.profile.ship),'the-sacrifice');
 await page.locator('[data-event=race]').click();await page.locator('#start-button').click();await page.waitForTimeout(500);await page.screenshot({path:process.env.TEMP+'/sacrifice-grid.png'});
 assert.deepEqual(errors,[]);console.log('Consolation finish integration, persisted unlock/selection, garage and race model passed.');
}finally{await browser.close();}

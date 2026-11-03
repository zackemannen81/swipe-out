import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Set PLAYWRIGHT_MODULE to the Playwright module path.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
const errors=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__menuTest={frontEnd,race,shipPhysics,finishRace,curve,get audio(){return raceAudio;},get track(){return track;},get activeTopSpeed(){return activeTopSpeed;}};'});});
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?track=track17');await page.waitForFunction(()=>window.__menuTest,{timeout:60000});
 // Empty storage must not silently launch the built-in prototype.
 await page.locator('[data-go=campaign]').click();
 assert.equal(await page.locator('#campaign-enter').isDisabled(),true);
 assert.equal(await page.locator('#world-preview').isDisabled(),true);
 // Seed only this isolated test context; two identical names exercise ID selection.
 await page.evaluate(async()=>{
  const {BUILTIN_TRACKS,saveTrack}=await import('/src/track-library.js');
  const data=structuredClone(BUILTIN_TRACKS.track17.data);data.name='Necros - Prime';
  saveTrack(localStorage,'custom-decoy',data);
  saveTrack(localStorage,'custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386',data);
 });
 await page.reload();await page.waitForFunction(()=>window.__menuTest);
 await page.evaluate(()=>{
  const original=navigator.getGamepads.bind(navigator);let down=false;
  Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:down&&i===13}))}]});
  document.getElementById('menu-home').focus();down=true;window.__menuTest.frontEnd.gamepad();
  if(document.activeElement.dataset.go!=='campaign')throw Error('Gamepad focus navigation failed');
  down=false;window.__menuTest.frontEnd.gamepad();Object.defineProperty(navigator,'getGamepads',{configurable:true,value:original});
 });
 await mkdir(process.env.TEMP+'/swipe-menu',{recursive:true});await page.waitForTimeout(400);await page.screenshot({path:process.env.TEMP+'/swipe-menu/home.png'});
 await page.locator('[data-go=garage]').click();await page.waitForTimeout(400);await page.screenshot({path:process.env.TEMP+'/swipe-menu/garage.png'});
 assert.equal(await page.locator('#garage-ships button:disabled').count(),3);
 await page.locator('#garage-paints button').filter({hasText:'Cyan'}).click();
 await page.locator('#menu-back').click();await page.locator('[data-go=settings]').click();await page.locator('#menu-music').fill('23');await page.locator('#menu-bloom').uncheck();await page.locator('#menu-sfx').fill('35');await page.locator('#menu-glow').fill('150');await page.locator('#menu-mute').check();await page.locator('#menu-musicPulse').uncheck();await page.locator('#menu-mix').selectOption('speakers');
 await page.reload();await page.waitForFunction(()=>window.__menuTest);await page.locator('[data-go=settings]').click();assert.equal(await page.locator('#menu-music').inputValue(),'23');assert.equal(await page.locator('#menu-bloom').isChecked(),false);assert.equal(await page.locator('#menu-sfx').inputValue(),'35');assert.equal(await page.locator('#menu-glow').inputValue(),'150');assert.equal(await page.locator('#menu-mute').isChecked(),true);assert.equal(await page.locator('#menu-mix').inputValue(),'speakers');assert.equal(await page.evaluate(()=>window.__menuTest.audio.audio.volume),0);await page.locator('#menu-mute').uncheck();await page.locator('#menu-bloom').check();await page.screenshot({path:process.env.TEMP+'/swipe-menu/settings.png'});
 await page.locator('#menu-back').click();await page.locator('[data-go=campaign]').click();await page.locator('#world-preview').click();await page.waitForTimeout(1200);assert.equal(await page.locator('#world-preview-overlay').isVisible(),true);await page.keyboard.press('Escape');await page.locator('#campaign-enter').click();await page.screenshot({path:process.env.TEMP+'/swipe-menu/course.png'});assert.equal(await page.locator('#track-select').inputValue(),'custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386');
 // Prevent fullscreen during automated layout checks.
 await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});
 await page.locator('#start-button').click();await page.waitForFunction(()=>window.__menuTest.race.state==='intro'||window.__menuTest.race.state==='countdown');
 await page.locator('#skip-intro').click();await page.waitForFunction(()=>window.__menuTest.race.state==='racing',{timeout:12000});
 // Controlled result exercises reward integration; driving balance is covered separately.
 await page.evaluate(()=>{const t=window.__menuTest;t.race.recordLaps=[40,39,41];t.race.elapsed=120;t.race.distance=t.curve.getLength()*3;t.finishRace();});
 await page.screenshot({path:process.env.TEMP+'/swipe-menu/results.png'});
 assert.match(await page.locator('#result-best-lap').textContent(),/00:39.00/);assert.match(await page.locator('#race-record-result').textContent(),/NEW PERSONAL BEST/);
 await page.locator('#menu-button').click();await page.locator('[data-go=records]').click();assert.match(await page.locator('#race-record-list').textContent(),/Necros/);await page.locator('#menu-back').click();
 await page.locator('[data-go=garage]').click();assert.equal(await page.locator('#garage-ships button:disabled').count(),1);
 await page.locator('#garage-ships button').filter({hasText:'Orca'}).click();await page.locator('#garage-modules button').filter({hasText:'Overdrive'}).click();
 await page.reload();await page.waitForFunction(()=>window.__menuTest);await page.locator('[data-go=garage]').click();assert.equal(await page.locator('#garage-ships button').filter({hasText:'Orca'}).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#garage-modules button').filter({hasText:'Overdrive'}).getAttribute('aria-pressed'),'true');
 await page.locator('#menu-back').click();await page.locator('[data-event=race]').click();await page.locator('#start-button').click();assert.ok((await page.evaluate(()=>window.__menuTest.activeTopSpeed))>151);assert.equal(await page.evaluate(()=>window.__menuTest.audio.preferences.sfx),.35);
 await page.evaluate(()=>{window.__menuTest.race.state='ready';window.__menuTest.frontEnd.open();});
 await page.locator('[data-event=time-attack]').click();await page.locator('#start-button').click();assert.equal(await page.evaluate(()=>window.__menuTest.activeTopSpeed),151);
 await page.evaluate(()=>{window.__menuTest.race.state='ready';window.__menuTest.frontEnd.open();});
 await page.locator('[data-event=cup]').click();await page.locator('#start-button').click();assert.equal(await page.evaluate(()=>window.__menuTest.activeTopSpeed),151);await page.evaluate(()=>{window.__menuTest.race.state='ready';window.__menuTest.frontEnd.open();});
 await page.setViewportSize({width:667,height:375});await page.locator('[data-go=garage]').click();await page.waitForTimeout(400);await page.screenshot({path:process.env.TEMP+'/swipe-menu/small.png'});
 assert.equal(await page.evaluate(()=>document.getElementById('menu-pages').scrollWidth>document.getElementById('menu-pages').clientWidth),false);
 console.log(JSON.stringify({errors,screenshots:process.env.TEMP+'/swipe-menu'}));assert.deepEqual(errors,[]);
}finally{await browser.close();}

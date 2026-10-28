import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const output=join(tmpdir(),'swipe-out-audio002');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};});
await context.route('**/src/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__voice={
 snapshot:()=>({state:race.state,volume:raceAudio.voiceVolume,gain:raceAudio.announcer?.gain.gain.value,current:raceAudio.announcer?.current?.id,queue:raceAudio.announcer?.queue.map(q=>q.id),loaded:raceAudio.announcer?.buffers.size,failed:[...(raceAudio.announcer?.failed??[])],paused:raceAudio.announcer?.paused}),
 say:id=>raceAudio.announce(id),clear:()=>raceAudio.announcer.clear(),finish:()=>finishRace(),
 threat(){const s=combat.states.get('player');s.incoming=true;updateCombatHud();},
};
`});});
await context.route('**/src/audio.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('  playSfx(type) {',"  playSfx(type) { window.__countdowns??=[];if(type.startsWith('countdown'))window.__countdowns.push(type);")});});
try{
 const page=await context.newPage();page.setDefaultTimeout(60000);
 await page.goto('http://127.0.0.1:5173/?track=track14');await page.waitForFunction(()=>!!window.__voice);
 const slider=page.locator('[data-voice-volume]').first();assert.equal(await slider.inputValue(),'35');
 await slider.fill('22');await slider.dispatchEvent('input');await page.reload();await page.waitForFunction(()=>!!window.__voice);assert.equal(await slider.inputValue(),'22');
 await page.locator('#combat-enabled').check();await page.locator('#start-button').click();
 await page.waitForFunction(()=>window.__voice.snapshot().state==='racing'&&window.__voice.snapshot().loaded===21);
 assert.deepEqual(await page.evaluate(()=>window.__voice.snapshot().failed),[]);
 assert.deepEqual(await page.evaluate(()=>window.__countdowns.filter(id=>id!=='countdownFour')),['countdownThree','countdownTwo','countdownOne','countdownGo']);
 assert.ok(Math.abs((await page.evaluate(()=>window.__voice.snapshot())).gain-.132)<.001);
 await page.waitForTimeout(4000);await page.evaluate(()=>{window.__voice.clear();window.__voice.say('minigun_acquired');});
 await page.waitForFunction(()=>window.__voice.snapshot().current==='minigun_acquired');
 await page.evaluate(()=>window.__voice.threat());await page.waitForFunction(()=>window.__voice.snapshot().current==='incoming_missile');
 await page.locator('#btn-pause-toggle').click();assert.equal((await page.evaluate(()=>window.__voice.snapshot())).current,undefined);assert.equal((await page.evaluate(()=>window.__voice.snapshot())).paused,true);
 const pauseSlider=page.locator('[data-voice-volume]').last();await pauseSlider.fill('0');await pauseSlider.dispatchEvent('input');
 await page.screenshot({path:join(output,'pause-volume.png')});
 await page.setViewportSize({width:568,height:320});await page.screenshot({path:join(output,'pause-landscape.png')});await page.setViewportSize({width:1280,height:800});
 await page.locator('#resume-button').click();await page.evaluate(()=>window.__voice.say('final_lap'));assert.equal((await page.evaluate(()=>window.__voice.snapshot())).current,undefined);
 await page.locator('#btn-pause-toggle').click();await pauseSlider.fill('40');await pauseSlider.dispatchEvent('input');await page.locator('#resume-button').click();
 await page.evaluate(()=>window.__voice.finish());await page.waitForFunction(()=>window.__voice.snapshot().current==='race_complete');
 await page.locator('#retry-button').click();await page.waitForFunction(()=>window.__voice.snapshot().state==='countdown');assert.equal((await page.evaluate(()=>window.__voice.snapshot())).volume,.4);assert.equal((await page.evaluate(()=>window.__voice.snapshot())).current,undefined);
 await page.waitForFunction(()=>window.__voice.snapshot().state==='racing');await page.evaluate(()=>window.__voice.finish());await page.locator('#menu-button').click();
 await page.locator('#race-mode-select').selectOption('time-attack');await page.locator('#start-button').click();await page.waitForFunction(()=>window.__voice.snapshot().state==='racing');await page.waitForTimeout(4000);
 await page.evaluate(()=>window.__voice.finish());await page.waitForFunction(()=>window.__voice.snapshot().current==='session_complete');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output}));
}finally{await browser.close();}

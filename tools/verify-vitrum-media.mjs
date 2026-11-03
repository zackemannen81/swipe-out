import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900}}),errors=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`\nwindow.__media={frontEnd,race,togglePause,get audio(){return raceAudio.audio;},get sky(){return panoramaBackdrop.material.map.image;}};`});});
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?track=track18');await page.waitForFunction(()=>window.__media,{timeout:60000});
 await page.waitForFunction(()=>window.__media.sky?.naturalWidth===4096);
 assert.match(await page.evaluate(()=>window.__media.audio.src),/track15.m4a$/);
 const decoded=await page.evaluate(async()=>{const c=new AudioContext();try{const out=[];for(const name of ['track15','track16']){const r=await fetch('/audio/tracks/'+name+'.m4a');if(!r.ok)throw Error('Audio HTTP '+r.status);const b=await c.decodeAudioData(await r.arrayBuffer());out.push({name,duration:b.duration,channels:b.numberOfChannels});}return out;}finally{await c.close();}});console.log('Decoded',decoded);
 await page.locator('[data-go=settings]').click();await page.locator('#menu-soundtrack').selectOption('/audio/tracks/track16.m4a');await page.reload();await page.waitForFunction(()=>window.__media);
 assert.match(await page.evaluate(()=>window.__media.frontEnd.profile.soundtrack),/track16.m4a$/);
 await page.locator('[data-event=race]').click();await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});await page.locator('#start-button').click();
 await page.waitForFunction(()=>window.__media.race.state==='racing',{timeout:45000});assert.match(await page.evaluate(()=>window.__media.audio.src),/track16.m4a$/);await page.waitForFunction(()=>window.__media.audio.currentTime>0&&!window.__media.audio.paused);
 await page.screenshot({path:'C:/code/swipe-out/tmp/vitrum/media-race.png'});
 await page.evaluate(()=>window.__media.togglePause());await page.locator('#music-select').selectOption('/audio/tracks/track15.m4a');await page.reload();await page.waitForFunction(()=>window.__media);
 assert.match(await page.evaluate(()=>window.__media.frontEnd.profile.soundtrack),/track15.m4a$/);
 await page.locator('[data-go=settings]').click();await page.locator('#menu-soundtrack').selectOption('');await page.reload();await page.waitForFunction(()=>window.__media);
 assert.equal(await page.evaluate(()=>window.__media.frontEnd.profile.soundtrack),'');assert.match(await page.evaluate(()=>window.__media.audio.src),/track15.m4a$/);
 assert.deepEqual(errors,[]);console.log('PASS sky decode, both M4A decodes, default, playback, Settings/pause persistence and circuit default reset');
}finally{await context.unrouteAll({behavior:'ignoreErrors'});await browser.close();}

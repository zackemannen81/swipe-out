import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),errors=[],missing=[];
await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__crew={frontEnd,tourBus};'});});
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/audio/tourbus/'))missing.push(r.url());});
 const ready=()=>page.waitForFunction(()=>window.__crew,{timeout:120000});
 const title=title=>page.waitForFunction(t=>document.querySelector('.bus-crew:not([hidden]) h3')?.textContent===t,title);
 const flags=()=>page.evaluate(()=>__crew.frontEnd.profile.visitedZoneIntros);
 await page.goto('http://127.0.0.1:5173');await ready();await page.locator('[data-go=bus]:visible').click();await title('WELCOME ABOARD');
 await page.waitForFunction(()=>!__crew.tourBus.crew.audio.voice.paused&&__crew.tourBus.crew.audio.voice.currentTime>0);
 assert.equal(await page.evaluate(()=>__crew.tourBus.crew.audio.music.volume),.9*.18);await page.screenshot({path:'tmp/tour-crew-welcome.png'});
 await page.keyboard.press('Space');await title('GRAND HANGAR');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.bus-crew').hidden);
 assert.equal((await flags())['01'],true);assert.equal(await page.evaluate(()=>__crew.tourBus.crew.audio.music.volume),.9);
 console.log('first arrival, voice playback, ducking, Space/Enter and flags: PASS');
 await page.locator('[data-station=workshop]').click();await title('WORKSHOP / SERVICE BAY');assert.equal(await page.evaluate(()=>__crew.tourBus.hub.navigation.pending),null);await page.screenshot({path:'tmp/tour-crew-workshop.png'});
 await page.locator('[data-station=lounge]').click();await title("PILOTS' LOUNGE");await page.keyboard.press('Enter');
 await page.locator('.bus-archive-button').click();await page.locator('.bus-crew').getByRole('button',{name:'GRAND HANGAR',exact:true}).focus();await page.keyboard.press('Enter');await title('GRAND HANGAR');assert.equal(await page.locator('.bus-crew small').first().textContent(),'ARCHIVE REPLAY');await page.getByRole('button',{name:'PLAY VOICE',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!__crew.tourBus.crew.audio.voice.paused);await page.keyboard.press('Escape');
 await page.locator('.bus-archive-button').click();assert.equal(await page.getByRole('button',{name:'ENGINEERING CORE',exact:true}).count(),0);
 await page.getByLabel('Shipboard music').selectOption('hymn');assert.ok(await page.evaluate(()=>__crew.tourBus.crew.audio.music.src.includes('hymn.mp3')));await page.getByRole('button',{name:'SHIPWIDE ANNOUNCEMENT',exact:true}).click();await page.waitForFunction(()=>!__crew.tourBus.crew.audio.voice.paused);await page.getByRole('button',{name:'STOP ANNOUNCEMENT'}).click();await page.getByRole('button',{name:'CLOSE ARCHIVE'}).click();
 console.log('navigation cancellation, settled-camera trigger, archive replay and music: PASS');
 await page.reload();await ready();await page.waitForTimeout(600);assert.equal(await page.locator('.bus-crew').isVisible(),false);assert.equal((await flags())['03'],true);
 await page.evaluate(()=>__crew.frontEnd.show('settings'));await page.locator('#menu-mute').check();await page.evaluate(()=>__crew.frontEnd.show('bus'));await page.locator('[data-station=observation]').click();await title('OBSERVATION DECK');assert.equal(await page.evaluate(()=>__crew.tourBus.crew.audio.voice.volume),0);assert.equal(await page.evaluate(()=>__crew.tourBus.crew.audio.music.volume),0);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/tour-crew-mobile.png'});assert.ok(await page.locator('.bus-crew').evaluate(el=>el.getBoundingClientRect().right<=innerWidth));await page.keyboard.press('Enter');
 await page.locator('#menu-home').click();await page.waitForFunction(()=>__crew.tourBus.crew.audio.music.paused&&__crew.tourBus.crew.audio.voice.paused);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('reload persistence, mute, mobile, leaving hub, no page/audio HTTP errors: PASS');
}finally{await browser.close();}

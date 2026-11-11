import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
try{
for(const blocked of [false,true]){
 const context=await browser.newContext({serviceWorkers:'block'}),errors=[];
 await context.addInitScript(blocked=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)throw new DOMException('Simulated full quota','QuotaExceededError');return original.call(this,k,v);};if(blocked)IDBFactory.prototype.open=function(){throw Error('Simulated unavailable database');};},blocked);
 await context.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__save={frontEnd,progressStorage};'});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__save,null,{timeout:120000});
 await page.evaluate(()=>{__save.frontEnd.profile.paint='cyan';__save.frontEnd.saveProfile();__save.frontEnd.begin('track21','storage-test',{laps:3,difficulty:'elite',handling:'wipeout',assist:'high',combat:false});__save.frontEnd.finish(1,225.43,71.06,true);});
 await page.waitForFunction(blocked=>document.querySelector('#race-record-result')?.textContent.includes(blocked?'Record could not be saved':'Saved.'),blocked);
 if(blocked){assert.match(await page.locator('#profile-status').textContent(),/Could not save/);}
 else{await page.reload();await page.waitForFunction(()=>window.__save,null,{timeout:120000});const state=await page.evaluate(async()=>{const {readRaceRecords}=await import('/src/race-records.js');return {paint:__save.frontEnd.profile.paint,rows:readRaceRecords(__save.progressStorage)};});assert.equal(state.paint,'cyan');assert.equal(state.rows[0].time,225.43);assert.equal(state.rows[0].position,1);}
 assert.deepEqual(errors,[]);console.log(blocked?'PASS both-store failure visibly reported':'PASS full localStorage: IndexedDB record/profile survive reload');await context.close();
}
}finally{await browser.close();}

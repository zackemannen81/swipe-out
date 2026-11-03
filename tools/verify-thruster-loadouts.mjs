import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});const c=await b.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
await c.addInitScript(()=>{localStorage.setItem('swipe-out:career:v1',JSON.stringify({version:1,ship:'the-sacrifice',trophies:['sacrifice'],settings:{motion:false}}));});
await c.route('**/src/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__thrustTest={race,frontEnd,playerThrusters,thrusters,opponents,craftTemplates};'});});
try{const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5173/?track=track1');await p.waitForFunction(()=>window.__thrustTest,{timeout:90000});
assert.ok(await p.evaluate(()=>window.__thrustTest.opponents.every(o=>o.thrusters.color.equals(o.craft.color))));
const hullLength=await p.evaluate(async()=>{const THREE=await import('/node_modules/three/build/three.module.js');const size=new THREE.Box3().setFromObject(window.__thrustTest.craftTemplates['necron-crimson-citadel']).getSize(new THREE.Vector3());return Math.max(size.x,size.y,size.z);});assert.ok(Math.abs(hullLength-3.15*1.1)<.01);
for(const [ship,count] of [['the-sacrifice',4],['necron-crimson-citadel',5]]){
 await p.evaluate(id=>{const t=window.__thrustTest;t.race.state='ready';t.frontEnd.open();t.frontEnd.profile.ship=id;document.documentElement.requestFullscreen=async()=>{};},ship);
 await p.locator('[data-event=race]').click();await p.locator('#start-button').click();await p.waitForFunction(()=>window.__thrustTest.race.state==='racing',{timeout:18000});await p.waitForTimeout(1800);
 assert.equal(await p.evaluate(()=>window.__thrustTest.playerThrusters.nozzles.length),count);assert.equal(await p.evaluate(()=>window.__thrustTest.playerThrusters.color.getHex()),0xa80010);assert.ok(await p.evaluate(()=>window.__thrustTest.playerThrusters.nozzles.every(n=>n.geometry.drawRange.count>0)));
 await p.screenshot({path:process.env.TEMP+'/thrusters-'+ship+'.png'});
}assert.deepEqual(errors,[]);console.log('Live four/five blood-red wakes and loadout switching verified.');}finally{await b.close();}

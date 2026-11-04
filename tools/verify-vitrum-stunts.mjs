import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {VITRUM,VITRUM_SECTORS,VITRUM_STUNTS} from '../src/track-vitrum.js';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
const errors=[];context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});});
const output='C:/code/swipe-out/tmp/vitrum';await mkdir(output,{recursive:true});
await context.route('**/src/game.js*',async route=>{
 const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__vitrum={
 snapshot(){const g=scene.getObjectByName('customTrackObjects');return {state:race.state,objects:g?.children.length,loaded:g?.children.filter(o=>o.userData.loaded).length,errors:g?.userData.loadErrors,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
 pose(u){raceIntro.skip();document.querySelector('#race-intro').hidden=true;isPaused=true;race.state='racing';setScreen(startScreen,false);setScreen(pauseScreen,false);Object.assign(shipPhysics,createShipPhysics(140));shipPhysics.distance=u*curve.getLength();updateCraftPose(0);shipPhysics.previousPosition.copy(craft.position);cameraSystem.mode='wipeoutStyle';magneticCamera.reset();cameraSystem.update(craft.position,craft.quaternion,new THREE.Vector3(),0,race.poseFrame);panoramaBackdrop.position.copy(craft.position);renderer.info.autoReset=false;renderer.info.reset();graphics.render();const stats={...renderer.info.render};renderer.info.autoReset=true;return stats;}
};`});});
// Observe the editor's actual loaded scene, rather than only its form fields.
await context.route('**/src/track.js*',async route=>{
 const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('objectGroup.name = \'customTrackObjects\';','objectGroup.name = \'customTrackObjects\'; window.__vitrumObjects = objectGroup;')});
});
try {
 const page=await context.newPage();await page.goto('http://127.0.0.1:5173/?track=track18');await page.locator('[data-event=race]').click();await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});await page.locator('#start-button').click();
 await page.waitForFunction(()=>window.__vitrum?.snapshot().loaded===227,null,{timeout:90000});
 
 for(const [name,u] of [['gap',VITRUM.gaps[0].start-.002],['roll',(VITRUM_STUNTS.rollStart+VITRUM_STUNTS.rollEnd)/2]]){
 await page.evaluate(u=>window.__vitrum.pose(u),u);await page.screenshot({path:output+'/stunt-'+name+'.png'});
 }
 console.log(await page.evaluate(()=>window.__vitrum.snapshot()));assert.deepEqual(errors,[]);
}finally{await context.unrouteAll({behavior:'ignoreErrors'});await browser.close();}



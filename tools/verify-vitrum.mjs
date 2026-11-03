import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {VITRUM,VITRUM_SECTORS} from '../src/track-vitrum.js';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
const errors=[];context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});});
const output='C:/code/swipe-out/tmp/vitrum';await mkdir(output,{recursive:true});
await context.route('**/src/game.js*',async route=>{
 const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__vitrum={
 screen(){const g=scene.getObjectByName('vitrumForestScreen');return g?.children.map(m=>({name:m.name,count:m.count,width:m.material.map.image?.width,height:m.material.map.image?.height,alphaTest:m.material.alphaTest,transparent:m.material.transparent}));},
 curtainAlpha(){const im=scene.getObjectByName('hanging-roots').material.map.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return [[0,0],[750,800],[1200,700],[1000,600],[800,0]].map(([x,y])=>ctx.getImageData(x,y,1,1).data[3]);},
 materials(){const result=new Map();scene.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m?.name.startsWith('Vitrum/'))result.set(m.name,{name:m.name,maps:Object.fromEntries(['map','normalMap','roughnessMap','emissiveMap','envMap'].filter(k=>m[k]).map(k=>[k,{width:m[k].image?.width,height:m[k].image?.height,colorSpace:m[k].colorSpace,anisotropy:m[k].anisotropy}]))});});return [...result.values()];},
 cityView(){this.pose(.0134);const f=getTrackFrame(curve,.0134);camera.up.copy(f.normal);camera.position.copy(f.center).addScaledVector(f.tangent,55).addScaledVector(f.normal,38);camera.lookAt(f.center.clone().addScaledVector(f.right,-60).addScaledVector(f.normal,42));graphics.render();},
 overview(u){this.pose(u);const f=getTrackFrame(curve,u);camera.up.set(0,1,0);camera.position.copy(f.center).addScaledVector(f.tangent,-180).addScaledVector(f.right,125).addScaledVector(f.normal,100);camera.lookAt(f.center.clone().addScaledVector(f.normal,30));graphics.render();},
 snapshot(){const g=scene.getObjectByName('customTrackObjects');return {state:race.state,objects:g?.children.length,loaded:g?.children.filter(o=>o.userData.loaded).length,errors:g?.userData.loadErrors,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
 pose(u){isPaused=true;race.state='racing';setScreen(startScreen,false);setScreen(pauseScreen,false);Object.assign(shipPhysics,createShipPhysics(140));shipPhysics.distance=u*curve.getLength();updateCraftPose(0);shipPhysics.previousPosition.copy(craft.position);cameraSystem.mode='wipeoutStyle';magneticCamera.reset();cameraSystem.update(craft.position,craft.quaternion,new THREE.Vector3(),0,race.poseFrame);panoramaBackdrop.position.copy(craft.position);renderer.info.autoReset=false;renderer.info.reset();graphics.render();const stats={...renderer.info.render};renderer.info.autoReset=true;return stats;}
};`});});
// Observe the editor's actual loaded scene, rather than only its form fields.
await context.route('**/src/track.js*',async route=>{
 const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('objectGroup.name = \'customTrackObjects\';','objectGroup.name = \'customTrackObjects\'; window.__vitrumObjects = objectGroup;')});
});
try {
 const page=await context.newPage();await page.goto('http://127.0.0.1:5173/?track=track18');await page.locator('[data-event=race]').click();await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});await page.locator('#start-button').click();
 await page.waitForFunction(n=>window.__vitrum?.snapshot().loaded===n,VITRUM.objects.filter(o=>o.type==='glb').length,{timeout:90000});
 await page.waitForFunction(()=>window.__vitrum.snapshot().state==='racing',{timeout:30000});
 await page.waitForTimeout(1500);
 console.log('Loaded',await page.evaluate(()=>window.__vitrum.snapshot()));
 await page.waitForFunction(()=>window.__vitrum.screen()?.length===5 && window.__vitrum.screen().every(m=>m.width===1536 && m.height===1024));
 const screen=await page.evaluate(()=>window.__vitrum.screen());assert.equal(screen.reduce((n,m)=>n+m.count,0),1360);
 assert.ok(screen.every(m=>m.alphaTest>0 && !m.transparent));
 assert.ok((await page.evaluate(()=>window.__vitrum.curtainAlpha())).every(alpha=>alpha<8),'curtain gaps must not contain a background matte');
 console.log('PASS all three cutout maps decoded, five instanced layers / 1360 cards, clear curtain alpha');
 await page.waitForFunction(()=>window.__vitrum.materials().find(m=>m.name==='Vitrum/mycelium-deck')?.maps.envMap.width===1024);
 const materials=await page.evaluate(()=>window.__vitrum.materials());
 assert.equal(materials.length,9);
 for(const m of materials){
  for(const key of ['map','normalMap','roughnessMap']){assert.equal(m.maps[key]?.width,512,m.name+' '+key);assert.equal(m.maps[key]?.height,512);assert.equal(m.maps[key].anisotropy,8);}
  assert.equal(m.maps.map.colorSpace,'srgb');assert.equal(m.maps.normalMap.colorSpace,'');assert.equal(m.maps.roughnessMap.colorSpace,'');
 }
 for(const key of ['gills','amber','teal','violet','mycelium-deck'])assert.equal(materials.find(m=>m.name==='Vitrum/'+key)?.maps.emissiveMap.width,512,key+' emission');
 console.log('PASS decoded forest maps, data/color spaces, anisotropy and 1024px sky reflections');
 for(const [name,u] of Object.entries({...VITRUM_SECTORS,'Mycelium interior':.415,'Bloom approach':VITRUM_SECTORS['Neural Bloom']+.022,'Bloom heart':VITRUM_SECTORS['Neural Bloom']+.038,'Ravine bottom':.61,'Grounding canopy':.217,'Grounding ascent':.257,'Grounding return':.787})){const stats=await page.evaluate(u=>window.__vitrum.pose(u+.003),u);console.log(name,stats);await page.screenshot({path:output+'/'+name.replaceAll(' ','-')+'.png'});}
 await page.evaluate(()=>window.__vitrum.overview(.707));await page.screenshot({path:output+'/bloom-overview.png'});
 await page.evaluate(()=>window.__vitrum.cityView());await page.screenshot({path:output+'/city-overview.png'});
 await page.close(); // Release the race's GPU resources before loading the editor.
 const editor=await context.newPage();await editor.goto('http://127.0.0.1:5173/editor.html?track=track18');await editor.waitForFunction(()=>document.querySelector('#track-title').textContent.includes('Neural Ascent'));
 await editor.waitForFunction(n=>window.__vitrumObjects?.children.filter(o=>o.userData.loaded).length===n,VITRUM.objects.filter(o=>o.type==='glb').length,{timeout:90000});
 console.log('PASS editor loaded all GLBs');
 const pending=editor.waitForEvent('download');await editor.locator('#download-button').click();const download=await pending;await download.saveAs(output+'/vitrum.json');const exported=JSON.parse(await readFile(output+'/vitrum.json','utf8'));assert.equal(exported.track.objects.length,VITRUM.objects.length);
 await editor.locator('#save-button').click();await editor.reload();await editor.waitForFunction(()=>document.querySelector('#track-title').textContent.includes('Neural Ascent'));
 await editor.waitForFunction(n=>window.__vitrumObjects?.children.filter(o=>o.userData.loaded).length===n,VITRUM.objects.filter(o=>o.type==='glb').length,{timeout:90000});
 await editor.screenshot({path:output+'/editor.png'});
 assert.equal(await editor.evaluate(()=>window.__vitrumObjects.parent.getObjectByName('vitrumForestScreen')?.userData.cardCount),1360);
 // Exercise a saved Vitrum override with three manual objects in this isolated
 // browser context. Never read or write the user's actual Chrome storage.
 const saved=await editor.evaluate(async track=>{
  const {persistTrack}=await import('/src/track-storage.js');
  for(let i=0;i<3;i++)track.objects.push({...structuredClone(track.objects[0]),id:'screen-check-'+i,position:[300+i*10,-200,300],scale:[2,2,2]});
  return persistTrack(localStorage,'track18',track);
 },exported.track);
 await editor.reload();await editor.waitForFunction(()=>window.__vitrumObjects?.children.length===232 && window.__vitrumObjects.parent.getObjectByName('vitrumForestScreen')?.userData.cardCount===1360,null,{timeout:90000});
 const savedDownload=editor.waitForEvent('download');await editor.locator('#download-button').click();await (await savedDownload).saveAs(output+'/vitrum-saved-override.json');
 const reexported=JSON.parse(await readFile(output+'/vitrum-saved-override.json','utf8'));assert.deepEqual(reexported.track,saved);
 console.log('PASS saved 232-object Vitrum override retains all manual objects and gets the scenery layers');
 assert.deepEqual(errors,[]);console.log('PASS sectors, all GLBs, editor export/save/reload; no page or HTTP errors');
}finally{await context.unrouteAll({behavior:'ignoreErrors'});await browser.close();}


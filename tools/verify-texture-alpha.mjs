// Isolated Chrome: alpha pixels, real file upload, save/export/import and race.
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:5173';
const output=new URL('../tmp/texture-alpha/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];
context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});});
await context.route('**/src/track.js*',async route=>{
 const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll("objectGroup.name = 'customTrackObjects';","objectGroup.name = 'customTrackObjects'; window.__alphaObjects = objectGroup;")});
});
try {
 const page=await context.newPage();await page.goto(base+'/editor.html?track=track6');
 await page.waitForFunction(()=>window.__alphaObjects?.children.length===5);
 const pixels=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {spawnTrackObjects,disposeTrackGroup}=await import('/src/track.js');
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(128,64);
  for(let y=0;y<64;y++)for(let x=0;x<128;x++){const n=(y*128+x)*4;data.data[n]=255;data.data[n+3]=[0,8,128,255][Math.floor(x/32)];}
  ctx.putImageData(data,0,0);
  const renderer=new THREE.WebGLRenderer();renderer.setSize(128,64);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
  const target=new THREE.WebGLRenderTarget(128,64),scene=new THREE.Scene();scene.background=new THREE.Color(0x00ff00);
  const camera=new THREE.OrthographicCamera(-.5,.5,.5,-.5,.1,20);camera.position.z=5;
  // The blue layer draws AFTER cutouts: empty foreground pixels must not write depth.
  const behind=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({color:0x0000ff,transparent:true}));behind.position.z=-1;scene.add(behind);
  const wait=async fn=>{for(let i=0;i<500;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Texture decode timeout');};
  const read=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const bytes=new Uint8Array(128*64*4);renderer.readRenderTargetPixels(target,0,0,128,64,bytes);return [16,48,80,112].map(x=>[...bytes.slice((32*128+x)*4,(32*128+x)*4+3)]);};
  const results={};
  for(const mime of ['image/png','image/webp','image/jpeg']){
   const texture=canvas.toDataURL(mime,1);
   if(!texture.startsWith('data:'+mime))throw new Error('Browser cannot encode '+mime);
   for(const mode of ['cutout','blend']){
    const track={objects:[{type:'box',position:[0,0,0],rotation:[0,0,0],scale:[1,1,.01],texture,textureAlpha:mode,opacity:1,emissive:0xffffff}]};
    spawnTrackObjects(scene,track);const mesh=scene.getObjectByName('customTrackObjects').children[0];
    await wait(()=>mesh.material.map.image?.complete);mesh.material.emissiveIntensity=1;
    results[mime+'/'+mode]=read();
   }
  }
  const texture=canvas.toDataURL('image/png');
  const primitive=type=>({type,position:[0,0,0],rotation:[0,0,0],scale:[1,1,.01],texture,opacity:1});
  const track={objects:[...['box','cylinder','sphere','cone'].map(primitive),{...primitive('box'),textureAlpha:'blend'},{...primitive('box'),textureAlpha:'cutout'},{...primitive('box'),animType:'scroll-x'}]};
  spawnTrackObjects(scene,track);const g=scene.getObjectByName('customTrackObjects'),m=g.children.map(o=>o.material);
  results.materials={defaults:m.slice(0,4).every(v=>v.alphaTest>.05&&!v.transparent&&v.depthWrite&&v.side===THREE.FrontSide),separateModes:m[0]!==m[4]&&m[0]===m[5],sharedMap:m[0].map===m[4].map,scrollIndependent:m[0].map!==m[6].map&&m[6].map.wrapS===THREE.RepeatWrapping,staticClamp:m[0].map.wrapS===THREE.ClampToEdgeWrapping};
  let disposed=0;m[0].map.addEventListener('dispose',()=>disposed++);disposeTrackGroup(g);scene.remove(g);results.disposed=disposed;
  spawnTrackObjects(scene,{objects:[{...primitive('box'),opacity:.05,emissive:0xffffff}]});const faint=scene.getObjectByName('customTrackObjects').children[0];await wait(()=>faint.material.map.image?.complete);faint.material.emissiveIntensity=1;results.faded=read();
  spawnTrackObjects(scene,{objects:[{...primitive('box'),texture:null}]});const solid=scene.getObjectByName('customTrackObjects').children[0].material;results.untextured=!solid.transparent&&solid.depthWrite&&solid.alphaTest===0;
  disposeTrackGroup(scene);target.dispose();renderer.dispose();return results;
 });
 console.log('Pixel samples:',JSON.stringify(pixels));
 const blue=p=>p[2]>240&&p[0]<5&&p[1]<5,red=p=>p[0]>240&&p[2]<5;
 for(const mime of ['image/png','image/webp']){
  const cut=pixels[mime+'/cutout'],blend=pixels[mime+'/blend'];assert.ok(blue(cut[0])&&blue(cut[1])&&red(cut[2])&&red(cut[3]),mime+' cutout/depth');
  assert.ok(blue(blend[0])&&blend[2][0]>50&&blend[2][0]<240&&blend[2][2]>20&&red(blend[3]),mime+' soft alpha');
 }
 assert.ok(red(pixels['image/jpeg/cutout'][3]));assert.ok(pixels.faded[3][0]>5&&pixels.faded[3][2]>200,'low opacity must fade instead of clipping away');
 assert.ok(Object.values(pixels.materials).every(Boolean));assert.equal(pixels.disposed,1);assert.ok(pixels.untextured);
 console.log('PASS PNG/WebP pixel alpha, soft blending, transparent-hole depth, low-opacity fade, all four primitives, material cache and disposal');
 // Reload after isolated renderer checks to observe only the real editor scene.
 await page.reload();await page.waitForFunction(()=>window.__alphaObjects?.children.length===5);
 await page.locator('#object-select').selectOption('0');
 await page.getByLabel('Object opacity',{exact:true}).fill('1');await page.getByLabel('Object opacity',{exact:true}).press('Tab');
 const asset=new URL('../public/images/stage2/parallax/undergrowth-v1.png',import.meta.url);
 await page.getByLabel('Object texture',{exact:true}).setInputFiles(asset.pathname.replace(/^\/(.:)/,'$1'));
 await page.waitForFunction(()=>document.querySelector('.texture-preview')?.complete&&window.__alphaObjects?.children[0].material.map?.image?.complete);
 assert.equal(await page.getByLabel('Texture transparency').inputValue(),'cutout');
 assert.equal(await page.getByLabel('Object opacity',{exact:true}).inputValue(),'1');
 assert.ok(await page.evaluate(()=>getComputedStyle(document.querySelector('.texture-preview')).backgroundImage.includes('conic-gradient')));
 await page.getByLabel('Texture transparency').selectOption('blend');
 await page.locator('#undo-button').click();assert.equal(await page.getByLabel('Texture transparency').inputValue(),'cutout');
 await page.locator('#redo-button').click();assert.equal(await page.getByLabel('Texture transparency').inputValue(),'blend');
 await page.locator('#save-button').click();await page.waitForFunction(()=>document.querySelector('#save-state').textContent==='SAVED');
 await page.reload();await page.locator('#object-select').selectOption('0');assert.equal(await page.getByLabel('Texture transparency').inputValue(),'blend');
 const download=page.waitForEvent('download');await page.locator('#download-button').click();const path=new URL('texture-track.json',output);await (await download).saveAs(path.pathname.replace(/^\/(.:)/,'$1'));
 const exported=JSON.parse(await readFile(path,'utf8'));assert.equal(exported.version,8);assert.equal(exported.track.objects[0].textureAlpha,'blend');
 assert.equal(exported.track.objects[0].texture,'data:image/png;base64,'+(await readFile(asset)).toString('base64'),'upload must preserve original alpha bytes');
 await page.getByLabel('Texture transparency').scrollIntoViewIfNeeded();await page.screenshot({path:new URL('editor.png',output).pathname.replace(/^\/(.:)/,'$1')});
 await page.locator('#import-file').setInputFiles(path.pathname.replace(/^\/(.:)/,'$1'));
 await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Imported as a new draft'));
 const key=await page.locator('#track-select').inputValue();await page.locator('#object-select').selectOption('0');assert.equal(await page.getByLabel('Texture transparency').inputValue(),'blend');
 const opened=context.waitForEvent('page');await page.locator('#test-button').click();const game=await opened;await game.waitForURL('**/?track=**');
 await game.waitForFunction(()=>document.querySelector('[data-event=race]'));await game.locator('[data-event=race]').click();await game.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{};});await game.locator('#start-button').click();
 await game.waitForFunction(()=>window.__alphaObjects?.children[0]?.material?.map?.image?.complete);
 const material=await game.evaluate(()=>{const m=window.__alphaObjects.children[0].material;return {transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,alphaTest:m.alphaTest};});
 assert.deepEqual(material,{transparent:true,opacity:1,depthWrite:false,alphaTest:.001});assert.equal(new URL(game.url()).searchParams.get('track'),key);
 await game.close();assert.deepEqual(errors,[]);
 console.log('PASS actual upload, checkerboard, mode undo/redo, original PNG bytes, IndexedDB reload, v8 export/import and Save & Test race; no page/HTTP errors');
}finally{await context.unrouteAll({behavior:'ignoreErrors'});await browser.close();}

import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
const context=await browser.newContext({viewport:{width:1280,height:850}});
const output=join(tmpdir(),'swipe-out-colors');await mkdir(output,{recursive:true});
const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.route('**/src/editor.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__colors={track:()=>structuredClone(track()),texture:()=>edit(next=>{next.objects[selection.index].texture="/images/textures/tex005.png";})};'});});
try {
 const page=await context.newPage();page.setDefaultTimeout(60000);
 await page.goto('http://127.0.0.1:5173/editor.html?track=track16');await page.waitForFunction(()=>!!window.__colors);
 await page.locator('[data-primitive="box"]').click();
 await page.getByRole('button',{name:'Neon Cyan',exact:true}).click();
 let data=await page.evaluate(()=>window.__colors.track());assert.equal(data.objects.at(-1).emissive,'#00e5ff');
 await page.locator('#object-color').fill('#123456');await page.locator('#object-color').dispatchEvent('change');
 assert.equal((await page.evaluate(()=>window.__colors.track())).objects.at(-1).color,'#123456');
 await page.locator('#undo-button').click();assert.equal((await page.evaluate(()=>window.__colors.track())).objects.at(-1).color,'#00e5ff');
 await page.getByRole('button',{name:'Neon Pink',exact:true}).click();
 await page.locator('#clone-object-button').click();data=await page.evaluate(()=>window.__colors.track());assert.equal(data.objects.at(-1).emissive,'#ff269e');assert.equal(data.objects.at(-2).emissive,'#ff269e');
 await page.evaluate(()=>window.__colors.texture());
 for(const [name,color] of [['Lime','#a3ff12'],['Amber','#ffb020'],['Violet','#9c55ff']]) {
  await page.getByRole('button',{name:'Neon '+name,exact:true}).click();assert.equal((await page.evaluate(()=>window.__colors.track())).objects.at(-1).color,color);
 }
 await page.getByRole('button',{name:'Neon Amber',exact:true}).click();
 const material=await page.evaluate(async()=>{const THREE=await import('/node_modules/three/build/three.module.js');const {spawnTrackObjects,disposeTrackGroup}=await import('/src/track.js');const scene=new THREE.Scene();spawnTrackObjects(scene,window.__colors.track());const group=scene.getObjectByName('customTrackObjects');const m=group.children.at(-1).material;const result={color:m.color.getHexString(),glow:m.emissive.getHexString(),intensity:m.emissiveIntensity,textured:!!m.map};disposeTrackGroup(group);return result;});
 assert.deepEqual(material,{color:'ffb020',glow:'ffb020',intensity:4,textured:true});
 await page.locator('#object-glow-off').click();assert.equal((await page.evaluate(()=>window.__colors.track())).objects.at(-1).emissive,0);
 await page.locator('#undo-button').click();await page.locator('#save-button').click();
 await page.reload();await page.waitForFunction(()=>!!window.__colors);await page.locator('#object-select').selectOption('1');
 assert.equal(await page.locator('#object-emissive').inputValue(),'#ffb020');
 await page.locator('#object-emissive').scrollIntoViewIfNeeded();await page.screenshot({path:join(output,'neon-editor.png')});
 const wait=page.waitForEvent('download');await page.locator('#download-button').click();const download=await wait;const exported=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(exported.track.objects[1].emissive,'#ffb020');assert.equal(exported.track.objects[1].texture,'/images/textures/tex005.png');
 await page.locator('#object-color-reset').click();data=await page.evaluate(()=>window.__colors.track());assert.equal(data.objects[1].emissive,undefined);assert.equal(data.objects[1].color,undefined);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output,material}));
} finally {await browser.close();}

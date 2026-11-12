import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {validateGlb} from '../src/glb-scenery.js';
const root='C:/Users/zakri/Desktop/tourbus/assets/meshyai/';
const names=fs.readdirSync(root);
const prefixes=['Meshy_AI_Braided_Money_Tree_','Meshy_AI_Realistic_Bush_1109','Meshy_AI_fern_3d_','Meshy_AI_sci_fi_sliding_door_','Meshy_AI_panels_1111013319_texture.glb','Meshy_AI_Quantum_Cargo_Pod_1031','Meshy_AI_Cyber_Command_Console_','Meshy_AI_Orbital_Core_Engine_','Meshy_AI_Flatbed_','Meshy_AI_Cattail_Planter_','bio_flora_plant_lowpo.glb','bio_flora_plant_lowpo (1).glb'];
const files=prefixes.map(prefix=>({file:names.find(n=>n.startsWith(prefix))}));
if(files.some(f=>!f.file))throw Error('Missing shortlist model');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});
try{
 const page=await browser.newPage({viewport:{width:720,height:600}});
 await page.route('**/__candidate/*',async r=>{const index=Number(new URL(r.request().url()).pathname.split('/').at(-1));const bytes=fs.readFileSync(root+files[index].file);validateGlb(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length));await r.fulfill({body:bytes,contentType:'model/gltf-binary'});});
 await page.route('**/__asset-preview',r=>r.fulfill({contentType:'text/html',body:`<body style="margin:0"><script type="module">
 import * as T from '/node_modules/three/build/three.module.js';import {loadGlb} from '/src/glb-scenery.js';
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(720,600);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color(0x18232d);scene.add(new T.HemisphereLight(0xffffff,0x647078,3));const light=new T.DirectionalLight(0xffffff,3);light.position.set(3,6,4);scene.add(light);const cam=new T.PerspectiveCamera(42,1.2,.01,1000);let model;
 window.showModel=async index=>{if(model)scene.remove(model);model=await loadGlb('/__candidate/'+index);scene.add(model);const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());model.position.sub(center);const radius=size.length()/2;cam.position.set(radius*1.7,radius*.95,radius*2);cam.lookAt(0,0,0);cam.near=radius/100;cam.far=radius*20;cam.updateProjectionMatrix();renderer.render(scene,cam);return {size:size.toArray(),center:center.toArray()};};
 </script></body>`}));
 await page.goto('http://127.0.0.1:5173/__asset-preview');await page.waitForFunction(()=>window.showModel);
 for(let i=0;i<files.length;i++){files[i].bounds=await page.evaluate(i=>window.showModel(i),i);await page.screenshot({path:`tmp/meshy-model-${i}.png`});console.log(i,files[i].file,files[i].bounds.size);}
 fs.writeFileSync('tmp/meshy-shortlist-review.json',JSON.stringify(files,null,2));
}finally{await browser.close();}


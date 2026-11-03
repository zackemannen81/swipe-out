import * as THREE from 'three';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VITRUM as track,VITRUM_SECTORS as sectors,VITRUM_SUPPORTS} from '../src/track-vitrum.js';
import {normalizeTrack,parseTrack,serializeTrack} from '../src/track-format.js';
import {createTrackCurve,getTrackFrame,canFinishRace} from '../src/track-path.js';
import {createTrack,disposeTrackGroup} from '../src/track.js';
import {createShipPhysics,stepShipPhysics} from '../src/ship-physics.js';
import {createOpponentState,RACER_DEFINITIONS,updateOpponents,resetOpponents} from '../src/opponents.js';
import {validateGlb} from '../src/glb-scenery.js';
import {validatePads} from '../src/track-pads.js';
import {FOREST_SURFACES,forestMap} from '../src/vitrum-materials.js';

test('Vitrum round-trips editor data, ships self-contained models and safe off-centre pads',()=>{
 assert.deepEqual(parseTrack(serializeTrack(track)),normalizeTrack(track));validatePads(track);
 const models=new Set(track.objects.filter(o=>o.type==='glb').map(o=>o.model));assert.equal([...models].filter(p=>!p.includes('/organic/')).length,9);assert.equal(models.size,16);
 for(const path of models){
  const b=readFileSync(new URL('../public'+path,import.meta.url));
  const gltf=validateGlb(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
  if(path.includes('/organic/')){
   // Check delivered bytes, not just generator intent: every supplied family
   // has all three PBR channels and the neural emission mask is embedded.
   const files=Object.keys(FOREST_SURFACES).flatMap(s=>['basecolor','normal_approx','roughness'].map(c=>forestMap(s,c)));
   files.push(forestMap('mycelium','emissive_mask'));
   assert.equal(gltf.images.length,files.length,'shared maps must not be embedded twice');
   for(const file of files){
    const image=gltf.images.find(i=>i.name===file);assert.ok(image,file);
    const view=gltf.bufferViews[image.bufferView],offset=28+b.readUInt32LE(12)+(view.byteOffset??0);
    assert.deepEqual(b.subarray(offset,offset+view.byteLength),readFileSync(new URL('../public'+file,import.meta.url)));
   }
   for(const material of gltf.materials){
    assert.ok(material.pbrMetallicRoughness.baseColorTexture);
    assert.ok(material.pbrMetallicRoughness.metallicRoughnessTexture);
    assert.ok(material.normalTexture);
    assert.equal(material.pbrMetallicRoughness.metallicFactor,0);
   }
  }
 }
 assert.ok(track.pads.some(p=>p.offset<0)&&track.pads.some(p=>p.offset>0));
});
test('Vitrum has seven ordered sectors, an upright smooth road, descent and no road overlap',()=>{
 const c=createTrackCurve(track),l=c.getLength(),frames=[];let minSlope=0,minY=Infinity,maxY=-Infinity;
 assert.equal(Object.keys(sectors).length,7);assert.ok(l>8000&&l<10000);
 for(let d=0;d<l;d+=12){const f=getTrackFrame(c,d/l);frames.push(f);minSlope=Math.min(minSlope,f.tangent.y);minY=Math.min(minY,f.center.y);maxY=Math.max(maxY,f.center.y);assert.ok(f.normal.y>.7);}
 assert.ok(maxY-minY>550);assert.ok(minSlope<-.45);
 for(let i=0;i<frames.length;i++)for(let j=i+1;j<frames.length;j++)if(Math.min(j-i,frames.length-j+i)*12>80)assert.ok(frames[i].center.distanceTo(frames[j].center)>40,`overlap ${i},${j}`);
 assert.ok(getTrackFrame(c,.99999).tangent.dot(getTrackFrame(c,0).tangent)>.999);
});
test('Vitrum CPU field finishes three laps on Rookie, Pilot and Elite without recovery',()=>{
 const {curve,group,boostPads}=createTrack(track);try{for(const difficulty of ['rookie','pilot','elite']){
 const racers=RACER_DEFINITIONS.map(d=>createOpponentState(d));resetOpponents(racers,difficulty);
 for(let i=0;i<60*420&&racers.some(o=>o.finishTime===null);i++)updateOpponents(racers,curve,1/60,(i+1)/60,true,{boostPads,trackWidth:track.width});
 assert.ok(racers.every(o=>o.finishTime!==null),difficulty);assert.ok(racers.every(o=>o.physics.recoveries===0),difficulty);
 }}finally{disposeTrackGroup(group);}
});
test('Vitrum player completes ordered three laps with both handling modes and assistance off',()=>{
 const c=createTrackCurve(track);
 for(const handlingMode of ['swipeout','wipeout'])for(const hz of [30,120]){
 const s=createShipPhysics(140,{handlingMode});s.assistLevel=0;
 for(let i=0;i<hz*420&&!canFinishRace(c,s);i++){
 // Input-only lane controller; no pose/progress edits or physics overrides.
 const steer=handlingMode==='wipeout'?Math.max(-1,Math.min(1,s.yaw*3+s.lateralOffset*.012+s.lateralVelocity*.045)):Math.max(-1,Math.min(1,s.lateralOffset*.06+s.lateralVelocity*.15));
 const pose=stepShipPhysics(s,{steer,thrust:1},1/hz,c,210,track.width);assert.ok(pose.position.toArray().every(Number.isFinite));
 }
 assert.ok(canFinishRace(c,s),handlingMode+' '+hz);assert.equal(s.recoveries,0);
 }
});

// Read actual delivered accessor bounds, independently of authoring estimates.
test('all supplied GLB bounds leave the full racing corridor clear',()=>{
 const c=createTrackCurve(track),road=Array.from({length:900},(_,i)=>getTrackFrame(c,i/900).center);
 for(const o of track.objects.filter(o=>o.type==='glb'&&!o.model.includes('/organic/'))){
  const b=readFileSync(new URL('../public'+o.model,import.meta.url));
  const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
  const box=new THREE.Box3();for(const m of j.meshes)for(const p of m.primitives){const a=j.accessors[p.attributes.POSITION];box.expandByPoint(new THREE.Vector3(...a.min));box.expandByPoint(new THREE.Vector3(...a.max));}
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...o.position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rotation.map(THREE.MathUtils.degToRad))),new THREE.Vector3(...o.scale));box.applyMatrix4(matrix);
  assert.ok(!road.some(p=>p.x>box.min.x-18&&p.x<box.max.x+18&&p.z>box.min.z-18&&p.z<box.max.z+18&&p.y+8>box.min.y&&p.y-2<box.max.y),o.id+' intersects road');
 }
});
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Three's data-URI buffer loader emits browser-shaped progress events.
globalThis.ProgressEvent ??= class ProgressEvent {constructor(type,init){this.type=type;Object.assign(this,init);}};
// Partition the delivered triangles spatially for test-only broad-phase culling.
// Three still intersects the original vertices/triangles; smaller exact bounds
// avoid testing an entire kilometre-long material batch for every ray.
function spatialMeshes(mesh){
 const p=mesh.geometry.getAttribute('position'),ix=mesh.geometry.index,cells=new Map();
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),center=new THREE.Vector3();
 for(let i=0;i<(ix?.count??p.count);i+=3){
  const ids=[0,1,2].map(j=>ix?ix.getX(i+j):i+j);
  a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
  center.copy(a).add(b).add(c).multiplyScalar(1/3).applyMatrix4(mesh.matrixWorld);
  const key=[center.x,center.y,center.z].map(v=>Math.floor(v/120)).join(',');
  let cell=cells.get(key);if(!cell){cell={indices:[],bounds:new THREE.Box3()};cells.set(key,cell);}
  cell.indices.push(...ids);cell.bounds.expandByPoint(a).expandByPoint(b).expandByPoint(c);
 }
 return [...cells.values()].map(cell=>{
  const g=new THREE.BufferGeometry();g.setAttribute('position',p);g.setIndex(cell.indices);
  g.boundingBox=cell.bounds;g.boundingSphere=cell.bounds.getBoundingSphere(new THREE.Sphere());
  const part=new THREE.Mesh(g,mesh.material);part.matrixWorld.copy(mesh.matrixWorld);return part;
 });
}
test('organic passages leave real ship space open inside their enclosing bounds',async()=>{
 const scene=new THREE.Group();
 for(const o of track.objects.filter(o=>o.model?.includes('/organic/'))){
  const b=readFileSync(new URL('../public'+o.model,import.meta.url));
  // Geometry-only parsing in Node: texture bytes are validated by the asset
  // test and decoded in the browser, where image APIs exist.
  const size=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+size));
  for(const m of j.materials){
   delete m.pbrMetallicRoughness.baseColorTexture;
   delete m.pbrMetallicRoughness.metallicRoughnessTexture;
   delete m.normalTexture;delete m.emissiveTexture;
  }
  j.buffers[0].uri='data:application/octet-stream;base64,'+b.subarray(28+size).toString('base64');
  const gltf=await new GLTFLoader().parseAsync(JSON.stringify(j),'');
  gltf.scene.position.set(...o.position);scene.add(gltf.scene);
 }
 scene.updateMatrixWorld(true);const c=createTrackCurve(track),ray=new THREE.Raycaster(),failures=[];
 const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(...spatialMeshes(o));});
 // Cast from actual lowest vertices of every planted GLB after all transforms.
 // This catches floating feet, mismatched slope and a footing left behind when
 // corridor clearance moves a model. The intentionally suspended heart is exempt.
 const feet=new Map(),floating=[];
 for(const o of track.objects.filter(o=>o.type==='glb'&&!o.model.includes('/organic/')&&!o.motion)){
  if(!feet.has(o.model)){
   const b=readFileSync(new URL('../public'+o.model,import.meta.url)),size=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+size));
   const points=[];
   for(const m of j.meshes)for(const primitive of m.primitives){
    const a=j.accessors[primitive.attributes.POSITION],v=j.bufferViews[a.bufferView];
    for(let i=0;i<a.count;i++){
     const offset=28+size+(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??12);
     const p=new THREE.Vector3(b.readFloatLE(offset),b.readFloatLE(offset+4),b.readFloatLE(offset+8));
     if(p.y<a.min[1]+.004)points.push(p);
    }
   }
   // Spread samples around the original foot ring without thousands of duplicates.
   feet.set(o.model,points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/12))===0));
  }
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rotation.map(THREE.MathUtils.degToRad)));
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...o.position),q,new THREE.Vector3(...o.scale));
  const up=new THREE.Vector3(0,1,0).applyQuaternion(q);
  for(const foot of feet.get(o.model)){
   ray.set(foot.clone().applyMatrix4(matrix).addScaledVector(up,2),up.clone().negate());ray.near=0;ray.far=3.2;
   if(!ray.intersectObjects(meshes,false).length){floating.push(o.id);break;}
  }
 }
 assert.equal(VITRUM_SUPPORTS.length,219);
 assert.deepEqual(floating,[],'planted model feet need physical soil/root support');
 for(let i=0;i<1200;i++){
  const f=getTrackFrame(c,i/1200);
  for(const lane of [-12,-6,0,6,12]){
   const origin=f.center.clone().addScaledVector(f.right,lane).addScaledVector(f.normal,.15);
   ray.set(origin,f.normal);ray.near=0;ray.far=9;
   if(ray.intersectObjects(meshes,false).length)failures.push({u:i/1200,lane});
  }
 }
 assert.deepEqual(failures.slice(0,12),[],`${failures.length} obstructed samples`);
});

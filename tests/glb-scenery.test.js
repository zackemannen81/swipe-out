import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { validateGlb, loadGlb } from '../src/glb-scenery.js';
import { normalizeTrack, parseTrack, serializeTrack, decodeTrack } from '../src/track-format.js';
import { COMBAT_LAB } from '../src/track-labs.js';
import { spawnTrackObjects, disposeTrackGroup } from '../src/track.js';
function glb(extra={}) {
 const json=JSON.stringify({asset:{version:'2.0'},scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]}],...extra});
 const bytes=new TextEncoder().encode(json.padEnd(Math.ceil(json.length/4)*4,' ')),buffer=new ArrayBuffer(28+bytes.length+36),v=new DataView(buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,buffer.byteLength,true);v.setUint32(12,bytes.length,true);v.setUint32(16,0x4e4f534a,true);
 new Uint8Array(buffer,20,bytes.length).set(bytes);v.setUint32(20+bytes.length,36,true);v.setUint32(24+bytes.length,0x004e4942,true);
 new Float32Array(buffer,28+bytes.length).set([0,0,0,1,0,0,0,1,0]);return buffer;
}
const source='data:model/gltf-binary;base64,'+Buffer.from(glb()).toString('base64');
const object={type:'glb',model:source,position:[5,6,7],rotation:[0,90,0],scale:[2,3,4]};
test('GLB v6 roundtrip, old v5 compatibility and invalid imports',()=>{
 const t={...COMBAT_LAB,objects:[object]};assert.deepEqual(parseTrack(serializeTrack(t)),normalizeTrack(t));
 assert.throws(()=>decodeTrack({format:'swipe-out-track',version:5,track:t}),/version 6/);
 assert.ok(decodeTrack({format:'swipe-out-track',version:5,track:COMBAT_LAB}));
 assert.throws(()=>validateGlb(new ArrayBuffer(8)),/header/);
 assert.throws(()=>validateGlb(glb({images:[{uri:'missing.png'}]})),/embedded/);
 assert.throws(()=>normalizeTrack({...t,objects:[{...object,model:'javascript:alert(1)'}]}),/GLB/);
});
test('GLB instances load shared geometry with independent editable transforms and dispose',async()=>{
 const model=await loadGlb(source);assert.ok(model.children[0].isMesh);disposeTrackGroup(model);
 const scene=new THREE.Scene();spawnTrackObjects(scene,{horizontalScale:2,objects:[object,{...object,position:[9,6,7]}]});
 const group=scene.getObjectByName('customTrackObjects');
 for(let i=0;i<100&&!group.children.every(c=>c.userData.loaded);i++)await new Promise(r=>setTimeout(r,5));
 assert.ok(group.children.every(c=>c.userData.loaded));const [a,b]=group.children;
 assert.deepEqual(a.position.toArray(),[10,6,14]);assert.deepEqual(a.scale.toArray(),[2,3,4]);assert.equal(a.rotation.y,Math.PI/2);
 assert.equal(a.children[0].children[0].geometry,b.children[0].children[0].geometry);
 let disposed=0;a.children[0].children[0].geometry.addEventListener('dispose',()=>disposed++);disposeTrackGroup(group);assert.equal(disposed,1);
 spawnTrackObjects(scene,{objects:[object]});const pending=scene.getObjectByName('customTrackObjects');spawnTrackObjects(scene,{objects:[]});
 await new Promise(r=>setTimeout(r,30));assert.equal(pending.children[0].children.length,0);
});

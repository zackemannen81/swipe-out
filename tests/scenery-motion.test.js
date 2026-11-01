import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {normalizeTrack,serializeTrack,parseTrack,decodeTrack} from '../src/track-format.js';
import {COMBAT_LAB} from '../src/track-labs.js';
import {spawnTrackObjects,disposeTrackGroup,createTrack} from '../src/track.js';
import {updateScenery} from '../src/scenery-motion.js';
const light={type:'light',position:[2,3,4],color:'#a80010',lightIntensity:400,lightRange:80,motion:{type:'shuttle',axis:'x',period:20,distance:50}};
test('lights and motion roundtrip, legacy reading and malformed limits',()=>{
 const t={...COMBAT_LAB,objects:[light]};assert.deepEqual(parseTrack(serializeTrack(t)),normalizeTrack(t));
 assert.ok(decodeTrack({format:'swipe-out-track',version:6,track:COMBAT_LAB}));
 assert.throws(()=>decodeTrack({format:'swipe-out-track',version:6,track:t}),/version 7/);
 for(const bad of [{...light,lightIntensity:-1},{...light,motion:{...light.motion,period:0}},{...light,motion:{...light.motion,axis:'w'}}])assert.throws(()=>normalizeTrack({...t,objects:[bad]}));
 assert.throws(()=>normalizeTrack({...t,objects:Array(17).fill(light)}),/16 point lights/);
});
test('light illumination, world-space motion, reset and transform reuse',()=>{
 const scene=new THREE.Scene(),data=normalizeTrack({...COMBAT_LAB,horizontalScale:2,objects:[light]});spawnTrackObjects(scene,data);
 const holder=scene.getObjectByName('customTrackObjects').children[0];assert.ok(holder.userData.light.isPointLight);
 assert.equal(holder.userData.light.intensity,400);assert.equal(holder.userData.light.distance,80);
 updateScenery(scene,5);assert.equal(holder.position.x,54);assert.equal(holder.position.z,8);assert.equal(holder.userData.marker.visible,false);
 updateScenery(scene,5,{preview:false,helpers:true});assert.equal(holder.position.x,4);assert.equal(holder.userData.marker.visible,true);
 data.objects[0].position[0]=10;spawnTrackObjects(scene,data);assert.equal(scene.getObjectByName('customTrackObjects').children[0],holder);
 updateScenery(scene,5);assert.equal(holder.position.x,70);disposeTrackGroup(scene);
});
test('spin and orbit retain authored pose at zero and loop without drift',()=>{
 for(const type of ['spin','orbit']){
 const scene=new THREE.Scene();spawnTrackObjects(scene,normalizeTrack({...COMBAT_LAB,objects:[{...light,motion:{...light.motion,type}}]}));
 const o=scene.getObjectByName('customTrackObjects').children[0],p=o.position.clone();updateScenery(scene,5);assert.ok(type==='spin'?o.rotation.x>1:o.position.distanceTo(p)>1);
 updateScenery(scene,20);assert.ok(o.position.distanceTo(p)<1e-8);updateScenery(scene,0);assert.equal(o.rotation.x,0);disposeTrackGroup(scene);
 }
});
test('Necros rail materials use blood red while other tracks retain cyan',()=>{
 for(const necros of [true,false]){const {group}=createTrack({...COMBAT_LAB,name:necros?'Necros - Dark PRIME':'Other'});const colors=[];group.traverse(o=>{if(o.material?.emissive)colors.push(o.material.emissive.getHex());});assert.equal(colors.includes(0x23dace),!necros);assert.equal(colors.includes(0xa80010),necros);disposeTrackGroup(group);}
});

test('embedded GLB clip loops independently and mixer is released on disposal',async()=>{
 const json=JSON.stringify({asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{}],buffers:[{byteLength:32}],bufferViews:[{buffer:0,byteOffset:0,byteLength:8},{buffer:0,byteOffset:8,byteLength:24}],accessors:[{bufferView:0,componentType:5126,count:2,type:'SCALAR',min:[0],max:[1]},{bufferView:1,componentType:5126,count:2,type:'VEC3'}],animations:[{samplers:[{input:0,output:1}],channels:[{sampler:0,target:{node:0,path:'translation'}}]}]});
 const bytes=new TextEncoder().encode(json.padEnd(Math.ceil(json.length/4)*4,' ')),buffer=new ArrayBuffer(28+bytes.length+32),v=new DataView(buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,buffer.byteLength,true);v.setUint32(12,bytes.length,true);v.setUint32(16,0x4e4f534a,true);new Uint8Array(buffer,20,bytes.length).set(bytes);v.setUint32(20+bytes.length,32,true);v.setUint32(24+bytes.length,0x004e4942,true);new Float32Array(buffer,28+bytes.length).set([0,1,0,0,0,10,0,0]);
 const model='data:model/gltf-binary;base64,'+Buffer.from(buffer).toString('base64');
 const scene=new THREE.Scene();spawnTrackObjects(scene,normalizeTrack({...COMBAT_LAB,objects:[{type:'glb',model,position:[0,0,0],playClip:true}]}));
 const o=scene.getObjectByName('customTrackObjects').children[0];for(let i=0;i<100&&!o.userData.loaded;i++)await new Promise(r=>setTimeout(r,5));assert.ok(o.userData.mixer);
 updateScenery(scene,.5);assert.equal(o.children[0].children[0].position.x,5);
 updateScenery(scene,1.5);assert.equal(o.children[0].children[0].position.x,5);
 updateScenery(scene,0,{preview:false});assert.equal(o.children[0].children[0].position.x,0);
 disposeTrackGroup(scene);assert.equal(o.userData.mixer,undefined);
});

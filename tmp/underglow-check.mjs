import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createCraft} from '../src/craft.js';
GLTFLoader.prototype.load=function(url,done){const scene=new THREE.Group();scene.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,3),new THREE.MeshBasicMaterial()));done({scene});};
const craft=await createCraft({accentColor:0xff397b});
const glow=craft.group.getObjectByName('vehicleUnderglow');
assert.equal(glow.children.length,4);
for(const light of glow.children){assert.ok(light.isPointLight);assert.equal(light.color.getHex(),0xff397b);assert.equal(light.castShadow,false);assert.equal(light.distance,5.5);}
for(const roll of [-.76,0,.76]){
 craft.group.position.y=.62;craft.group.rotation.z=roll;craft.group.updateMatrixWorld(true);
 for(const light of glow.children)assert.ok(light.getWorldPosition(new THREE.Vector3()).y>0,'emitter stays above road during normal bank');
}
console.log('Underglow: four accent lights, no shadows, normal banking clearance verified.');

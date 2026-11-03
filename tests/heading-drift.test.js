import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createShipPhysics} from '../src/ship-physics.js';
import {stepClassicAttitude,stepClassicMomentum} from '../src/classic-handling.js';

test('mirrored bend drift cannot rotate or reverse a held inward heading',()=>{
 for(const side of [-1,1]){
  const ship=createShipPhysics(140,{handlingMode:'wipeout'});
  ship.yaw=-side*.15;ship.previousTangent=new THREE.Vector3(0,0,1);
  for(let i=1;i<=120;i++){
   const angle=-side*i*.025,q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle);
   const frame={tangent:new THREE.Vector3(0,0,1).applyQuaternion(q),right:new THREE.Vector3(1,0,0).applyQuaternion(q)};
   stepClassicAttitude(ship,{steer:side*.1},1/120);
   const commanded=ship.yaw;
   stepClassicMomentum(ship,frame,1/120);
   assert.equal(ship.yaw,commanded,'curvature must not change pilot heading');
   assert.equal(Math.sign(ship.yaw),-side);
  }
 }
});

test('with neutral nose, curvature still pushes the whole ship outward',()=>{
 for(const side of [-1,1]){
  const ship=createShipPhysics(140,{handlingMode:'wipeout'});ship.previousTangent=new THREE.Vector3(0,0,1);
  const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-side*.02);
  stepClassicMomentum(ship,{tangent:new THREE.Vector3(0,0,1).applyQuaternion(q),right:new THREE.Vector3(1,0,0).applyQuaternion(q)},1/120);
  assert.equal(ship.yaw,0);assert.equal(Math.sign(ship.lateralVelocity),side);assert.equal(Math.sign(ship.lateralOffset),side);
 }
});

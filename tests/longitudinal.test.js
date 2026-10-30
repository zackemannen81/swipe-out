import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { createOpponentState, RACER_DEFINITIONS, updateOpponents, resetOpponents } from '../src/opponents.js';

function road(slope) {
 const tangent = new THREE.Vector3(0, slope, Math.sqrt(1-slope*slope));
 return {getLength:()=>100000, getPointAt:u=>tangent.clone().multiplyScalar(u*100000), getTangentAt:()=>tangent.clone()};
}
function run(slope, mode, hz, speed=140, input={thrust:0}, seconds=10) {
 const ship=createShipPhysics(speed,{handlingMode:mode});ship.previousSlope=slope;
 const curve=road(slope);
 for(let i=0;i<hz*seconds;i++)stepShipPhysics(ship,input,1/hz,curve,140,24);
 return ship;
}
test('both handling modes gain downhill momentum, lose uphill speed and coast on flat',()=>{
 for(const mode of ['swipeout','wipeout']) {
 const flat=run(0,mode,120), down=run(-.5,mode,120),up=run(.5,mode,120);
 assert.ok(flat.speed>130 && flat.speed<140);
 assert.ok(down.speed>240);assert.ok(up.speed<40);
 assert.ok(run(.2,mode,120,140,{thrust:1}).speed>run(.2,mode,120).speed);
 const results=[30,60,120].map(hz=>run(-.5,mode,hz).speed);
 assert.ok(Math.max(...results)-Math.min(...results)<.2);
 }
});
test('engine has a limit, momentum does not; brakes and expired boost do not teleport speed',()=>{
 for(const mode of ['swipeout','wipeout']){
 assert.ok(run(0,mode,120,80,{thrust:1},60).speed<=140.001);
 const coast=run(0,mode,120,300,{},1),gas=run(0,mode,120,300,{thrust:1},1);
 assert.equal(coast.speed,gas.speed);assert.ok(coast.speed>295);
 assert.ok(run(0,mode,120,300,{brakeLeft:true,brakeRight:true},1).speed<coast.speed-15);
 const s=createShipPhysics(220,{handlingMode:mode});s.boostTimer=.001;
 stepShipPhysics(s,{thrust:1},1/60,road(0),140,24);assert.ok(s.speed>219);
 const before=s.speed;stepShipPhysics(s,{},0,road(-.5),140,24);assert.equal(s.speed,before);
 }
});
test('CPU keeps downhill overspeed on clear straights under the shared physics',()=>{
 for(const difficulty of ['rookie','pilot','elite']) {
 const o=createOpponentState(RACER_DEFINITIONS[0]);resetOpponents([o],difficulty);o.physics.previousSlope=-.5;
 for(let i=0;i<600;i++)updateOpponents([o],road(-.5),1/60,(i+1)/60,true,{trackWidth:24});
 assert.ok(o.physics.speed>o.topSpeed+60);assert.equal(o.input.brakeLeft,false);
 }
});

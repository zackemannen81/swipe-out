import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrackCurve} from '../src/track-path.js';
import {createShipPhysics,stepShipPhysics} from '../src/ship-physics.js';
test('magnetic adhesion does not eliminate unassisted outward drift',()=>{
 const centerline=Array.from({length:24},(_,i)=>[500*Math.cos(i/24*Math.PI*2),0,500*Math.sin(i/24*Math.PI*2)]);
 const curve=createTrackCurve({id:'drift',name:'Drift',width:100,horizontalScale:1,magnetic:true,centerline});
 const run=assist=>{const ship=createShipPhysics(140);ship.assistLevel=assist;for(let i=0;i<120;i++)stepShipPhysics(ship,{steer:0,thrust:1},1/120,curve,140,100);return ship;};
 const free=run(0),assisted=run(1);
 assert.ok(Math.abs(free.lateralOffset)>1,'unsteered craft must drift outward');
 assert.ok(Math.abs(free.lateralOffset)>Math.abs(assisted.lateralOffset)+1);
 assert.equal(free.verticalOffset,0);assert.equal(free.airborne,false);
});

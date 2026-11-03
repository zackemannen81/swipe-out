import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrackCurve} from '../src/track-path.js';
import {createShipPhysics,stepShipPhysics} from '../src/ship-physics.js';

const curve=createTrackCurve({id:'bank-test',name:'Bank test',width:100,magnetic:true,
 centerline:Array.from({length:24},(_,i)=>[500*Math.cos(i*Math.PI/12),0,500*Math.sin(i*Math.PI/12)])});
for(const handlingMode of ['swipeout','wipeout']){
 test(`${handlingMode}: banking follows steering regardless of sideslip direction`,()=>{
  for(const steer of [-1,0,1]){
   const ships=[-12,12].map(lateralVelocity=>{
    const s=createShipPhysics(140,{handlingMode});s.assistLevel=0;s.lateralVelocity=lateralVelocity;
    for(let i=0;i<20;i++)stepShipPhysics(s,{steer,thrust:1},1/120,curve,140,100);
    return s;
   });
   assert.ok(Math.abs(ships[0].roll-ships[1].roll)<1e-10,'opposing drift cannot change bank');
   if(steer===0)assert.ok(Math.abs(ships[0].roll)<1e-10,'drift alone must not bank');
   else assert.equal(Math.sign(ships[0].roll),steer,'bank must follow steering');
  }
 });
}

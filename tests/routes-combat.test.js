import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ROUTE_LAB, COMBAT_LAB, GAP_LAB } from '../src/track-labs.js';
import { normalizeTrack, parseTrack, serializeTrack } from '../src/track-format.js';
import { createTrackCurve, getTrackFrame, getRacerFrame, advanceRouteDistance, canFinishRace } from '../src/track-path.js';
import { createTrack, disposeTrackGroup } from '../src/track.js';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { createOpponentState, RACER_DEFINITIONS, updateOpponents, resetOpponents } from '../src/opponents.js';
import { collectBoostPad, createCollisionState, resolveRacerCollisions } from '../src/race-interactions.js';
import { createCombat, WEAPONS, COMBAT } from '../src/combat.js';
import { updateCatchUp } from '../src/catch-up.js';
import { recoverBeforeGap } from '../src/gap-flight.js';

test('v3 branch round-trip, v1/v2 compatibility and invalid topology rejection',()=>{
  assert.equal(JSON.parse(serializeTrack(ROUTE_LAB)).version,4);
  assert.deepEqual(parseTrack(serializeTrack(ROUTE_LAB)),normalizeTrack(ROUTE_LAB));
  assert.deepEqual(parseTrack(JSON.stringify({format:'swipe-out-track',version:2,track:GAP_LAB})),normalizeTrack(GAP_LAB));
  assert.throws(()=>parseTrack(JSON.stringify({format:'swipe-out-track',version:2,track:ROUTE_LAB})),/version 3/);
  for(const mutate of [t=>t.branches[0].end=0.1,t=>t.branches[0].side=0,t=>t.branches[0].width=200,
    t=>t.branches[0].points=[],t=>t.branches.push({...t.branches[0],id:'second'}),
    t=>t.gaps=[{start:0.2,end:0.25}],t=>t.magnetic=false]) {
    const track=structuredClone(ROUTE_LAB);mutate(track);assert.throws(()=>normalizeTrack(track));
  }
});

test('branch endpoints/frames join main road and shorter distance gives a real time saving',()=>{
  const curve=createTrackCurve(ROUTE_LAB),b=curve.track.branches[0],length=curve.getLength();
  for(const u of [0,1]) {
    const a=b.frame(u),main=getTrackFrame(curve,u?b.end:b.start);
    assert.ok(a.center.distanceTo(main.center)<1e-8);assert.ok(a.tangent.dot(main.tangent)>0.99999);assert.ok(a.normal.dot(main.normal)>0.99999);
  }
  let previous=b.frame(0);
  for(let i=1;i<=2048;i++){const f=b.frame(i/2048);assert.ok(f.normal.dot(previous.normal)>0.995);assert.ok(f.tangent.dot(previous.tangent)>0.99);previous=f;}
  assert.ok(b.length<b.span*0.85);
  for(const hz of [30,60,120]) {
    const shortcut=createShipPhysics(100),main=createShipPhysics(100);
    shortcut.distance=main.distance=b.start*length;shortcut.lateralOffset=6;main.lateralOffset=-4;
    let shortTime=0,mainTime=0;
    while(shortcut.distance<b.end*length){advanceRouteDistance(curve,shortcut,100/hz);shortTime+=1/hz;}
    while(main.distance<b.end*length){advanceRouteDistance(curve,main,100/hz);mainTime+=1/hz;}
    assert.equal(shortcut.routeEntries,1);assert.equal(shortcut.routeMerges,1);assert.equal(main.routeEntries,0);
    assert.ok(Math.abs(shortTime-b.length/100)<1/hz+1e-7);assert.ok(shortTime<mainTime-1);
  }
});

test('pads belong to a route, ordered gates reject skipped sectors and state resets',()=>{
  const curve=createTrackCurve(ROUTE_LAB),ship=createShipPhysics(100),b=curve.track.branches[0];
  ship.route={id:b.id,lap:0};ship.distance=(b.start+0.05)*curve.getLength();ship.previousDistance=ship.distance-10;
  assert.equal(collectBoostPad(ship,[{d:ship.distance,offset:0}],curve.getLength(),133),false);
  assert.equal(collectBoostPad(ship,[{d:ship.distance,offset:0,routeId:b.id}],curve.getLength(),133),true);
  const cheated=createShipPhysics(100);cheated.distance=curve.getLength()*3-1;
  stepShipPhysics(cheated,{thrust:1},0.05,curve,133,20);
  assert.equal(canFinishRace(curve,cheated),false);
  const racer=createOpponentState(RACER_DEFINITIONS[0]);racer.physics.route={id:b.id,lap:1};racer.physics.completedLaps=2;
  resetOpponents([racer]);assert.equal(racer.physics.route,null);assert.equal(racer.physics.completedLaps,0);
});

test('all CPUs race both routes and finish three validated laps with contacts and pads',()=>{
  const {curve,group,boostPads}=createTrack(ROUTE_LAB),rs=RACER_DEFINITIONS.map(d=>createOpponentState(d)),state=createCollisionState();
  for(let i=0;i<120*140;i++){
    updateOpponents(rs,curve,1/120,(i+1)/120,true,{boostPads,trackWidth:20});
    resolveRacerCollisions(rs.map(o=>({id:o.name,physics:o.physics,group:o.group,finished:o.finishTime!==null})),curve,1/120,state);
    if(rs.every(o=>o.finishTime!==null))break;
  }
  for(const o of rs){assert.ok(o.finishTime!==null,o.name);assert.equal(o.physics.completedLaps,3);assert.ok(o.physics.routeEntries>0&&o.physics.routeEntries<3,o.name);assert.equal(o.physics.routeMerges,o.physics.routeEntries);assert.ok(o.physics.boostCount>0);}
  disposeTrackGroup(group);
});

test('equal section progress gets equal catch-up; recovery after a fork uses the shared merge',()=>{
  const curve=createTrackCurve(ROUTE_LAB),length=curve.getLength(),branch=curve.track.branches[0];
  const racers=[0.5,0.25,0.25].map((u,i)=>({topSpeed:133,physics:createShipPhysics(100),id:String(i)}));
  racers.forEach((r,i)=>r.physics.distance=[0.5,0.25,0.25][i]*length);
  racers[2].physics.route={id:branch.id,lap:0};
  assert.ok(getRacerFrame(curve,racers[1].physics).center.distanceTo(getRacerFrame(curve,racers[2].physics).center)>50);
  updateCatchUp(racers,2,length*3,true);assert.equal(racers[1].physics.catchUpBonus,racers[2].physics.catchUpBonus);
  const ship=createShipPhysics(100),gapStart=(branch.end+0.02)*length;
  ship.flight={gap:{start:gapStart,end:gapStart+80}};
  recoverBeforeGap(ship,curve,133);
  assert.ok(ship.distance>branch.end*length&&ship.distance<gapStart);assert.equal(ship.route,null);
});

function arena(distance=50,lane=0) {
  const curve=createTrackCurve(COMBAT_LAB),origin=curve.getLength()*0.16;
  const racers=[0,1].map(i=>{
    const physics=createShipPhysics(100);physics.distance=origin+i*distance;physics.lateralOffset=i?lane:0;
    const frame=getRacerFrame(curve,physics),group=new THREE.Group();
    group.position.copy(frame.center).addScaledVector(frame.normal,0.62).addScaledVector(frame.right,physics.lateralOffset);physics.previousPosition.copy(group.position);
    return {id:i?'cpu':'player',player:i===0,physics,group};
  });
  const combat=createCombat();combat.reset(true,racers);combat.states.get('cpu').aiTimer=999;
  return {curve,racers,combat};
}
function run(a,seconds,options={},hz=120){for(let i=0;i<seconds*hz;i++)a.combat.step(1/hz,a.racers,a.curve,options);}

test('rockets hit swept hulls at 30/60/120 Hz; damage persists and moving aside dodges',()=>{
  for(const hz of [30,60,120]) {
    const a=arena();a.combat.step(1/hz,a.racers,a.curve,{fire:true});run(a,0.4,{},hz);
    assert.equal(a.combat.states.get('player').hits,1);assert.equal(a.racers[1].physics.speed,84);
    stepShipPhysics(a.racers[1].physics,{thrust:1},1/hz,a.curve,133,24);assert.ok(a.racers[1].physics.speed<86);
  }
  const miss=arena(50,15);miss.combat.step(1/120,miss.racers,miss.curve,{fire:true});run(miss,3);
  assert.equal(miss.combat.states.get('player').hits,0);
  const shield=arena();run(shield,1,{fire:true,blocked:()=>true});assert.equal(shield.combat.states.get('cpu').hitsTaken,0);
});

test('homing requires continuous visible lock, warns its target and can lose sight',()=>{
  const a=arena(90);a.combat.select('player','homing');run(a,0.5,{fire:true});
  assert.equal(a.combat.states.get('player').shots,0);assert.equal(a.combat.states.get('cpu').targeted,true);
  run(a,0.1,{fire:true,blocked:()=>true});assert.equal(a.combat.states.get('player').lockTime,0);
  run(a,0.8,{fire:true});assert.equal(a.combat.states.get('player').shots,0);
  run(a,0.15,{fire:true});assert.equal(a.combat.states.get('player').shots,1);assert.ok(a.combat.states.get('cpu').incoming);
  run(a,0.5);assert.equal(a.combat.states.get('player').hits,1);
});

test('clip/reload, rate limits, shared hit protection and bounded projectile/effect resources',()=>{
  const a=arena(200,50);a.combat.select('player','minigun');run(a,0.5,{fire:true});
  assert.ok(a.combat.states.get('player').shots<=5);
  const s=a.combat.states.get('player');s.ammo.minigun=1;s.cooldown=0;
  run(a,0.02,{fire:true});assert.equal(s.ammo.minigun,0);assert.ok(s.reload.minigun>0);
  run(a,3,{fire:true});assert.equal(s.ammo.minigun,0);run(a,1.1);assert.equal(s.ammo.minigun,WEAPONS.minigun.clip);
  const hit={owner:'player',type:'rocket',velocity:new THREE.Vector3(20,0,200)};
  a.combat.hit(hit,a.racers[1],a.curve);const speed=a.racers[1].physics.speed;
  a.combat.hit(hit,a.racers[1],a.curve);assert.equal(a.racers[1].physics.speed,speed);
  run(a,8,{fire:true});assert.ok(a.combat.projectiles.length<=COMBAT.maxProjectiles);assert.ok(a.combat.effects.length<=COMBAT.maxEffects);
});

test('combat off, pause, finish/retry and airborne knockback preserve lifecycle rules',()=>{
  const a=arena();a.combat.reset(false,a.racers);run(a,1,{fire:true});assert.equal(a.combat.projectiles.length,0);
  a.combat.reset(true,a.racers);a.combat.states.get('cpu').aiTimer=999;
  a.combat.step(1/120,a.racers,a.curve,{fire:true});const snapshot=JSON.stringify([...a.combat.states]);const p=a.combat.projectiles[0].position.clone();
  a.combat.step(0,a.racers,a.curve,{fire:true});assert.equal(JSON.stringify([...a.combat.states]),snapshot);assert.deepEqual(a.combat.projectiles[0].position,p);
  const target=a.racers[1].physics;target.flight={velocity:new THREE.Vector3(0,0,100)};
  a.combat.hit({owner:'player',type:'rocket',velocity:new THREE.Vector3(20,0,200)},a.racers[1],a.curve);assert.ok(target.flight.velocity.z<100);assert.ok(target.lateralVelocity!==0);
  a.combat.step(0.1,a.racers,a.curve,{active:false});assert.equal(a.combat.projectiles.length,0);
  a.combat.reset(true,a.racers);assert.equal(a.combat.states.get('player').shots,0);assert.equal(a.combat.states.get('player').ammo.rocket,WEAPONS.rocket.clip);
});

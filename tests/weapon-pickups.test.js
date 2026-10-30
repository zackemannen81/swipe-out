import {RACER_DEFINITIONS,createOpponentState,updateOpponents} from '../src/opponents.js';
import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createCombat,WEAPONS} from '../src/combat.js';
import {pickupSnapshot,pickupCrossing} from '../src/weapon-pickups.js';
import {createTrackCurve} from '../src/track-path.js';import {ROUTE_LAB,COMBAT_LAB} from '../src/track-labs.js';
import {createShipPhysics} from '../src/ship-physics.js';import {createTrack,disposeTrackGroup} from '../src/track.js';
import {automaticWeaponPads,updateWeaponPads} from '../src/weapon-pads.js';
import {normalizeTrack,serializeTrack,parseTrack} from '../src/track-format.js';import {BUILTIN_TRACKS} from '../src/track-library.js';
function racer(id='player',player=true){return {id,player,physics:createShipPhysics(100),group:new THREE.Group()};}
function setup(pads=[{id:'a',d:50,offset:0,type:'weapon',weapon:'rocket'}]){const curve=createTrackCurve(COMBAT_LAB),r=racer(),combat=createCombat();combat.reset(true,[r],pads);return {r,curve,combat,s:combat.states.get(r.id)};}
function cross(a,from=40,to=65){a.r.physics.distance=from;a.combat.capture([a.r]);a.r.physics.distance=to;a.combat.step(1/60,[a.r],a.curve);}
test('empty start; pickup is a single replacing slot, no free ammo or reload',()=>{
 const a=setup();assert.equal(a.s.weapon,null);a.combat.step(.5,[a.r],a.curve,{fire:true});assert.equal(a.s.shots,0);
 cross(a);assert.equal(a.s.weapon,'rocket');assert.equal(a.s.ammo.rocket,3);assert.equal(a.s.pickups,1);
 a.combat.weaponPads.push({id:'b',d:90,offset:0,type:'weapon',weapon:'minigun'});cross(a,80,100);
 assert.equal(a.s.ammo.rocket,0);assert.equal(a.s.ammo.minigun,30);
 for(let i=0;i<600;i++)a.combat.step(1/60,[a.r],a.curve,{fire:true});
 assert.equal(a.s.shots,30);assert.equal(a.s.weapon,null);assert.equal(a.s.ammo.minigun,0);
});
test('swept pickups match 30/60/120 Hz; side miss, airborne and recovery rejected',()=>{
 for(const hz of [30,60,120]){const a=setup();for(let i=0;i<hz;i++){a.combat.capture([a.r]);a.r.physics.distance+=200/hz;a.combat.step(1/hz,[a.r],a.curve);}assert.equal(a.s.pickups,1);}
 for(const mode of ['lane','flight','recovery','respawn']){const a=setup();a.r.physics.distance=40;
 if(mode==='lane')a.r.physics.lateralOffset=3;
 if(mode==='flight')a.r.physics.flight={up:new THREE.Vector3(0,1,0),velocity:new THREE.Vector3(0,0,100)};
 if(mode==='recovery')a.r.physics.recoveryTimer=1;
 a.combat.capture([a.r]);a.r.physics.distance=65;if(mode==='respawn')a.r.physics.respawnSerial++;
 a.combat.step(1/60,[a.r],a.curve);assert.equal(a.s.pickups,0,mode);}
});
test('shared eight-second cooldown awards first crossing independent of racer order',()=>{
 const a=setup(),cpu=racer('cpu',false);a.combat.reset(true,[cpu,a.r],a.combat.weaponPads);
 cpu.physics.distance=20;a.r.physics.distance=40;a.combat.capture([cpu,a.r]);cpu.physics.distance=a.r.physics.distance=65;
 a.combat.step(1/60,[cpu,a.r],a.curve);assert.equal(a.combat.states.get('player').pickups,1);assert.equal(a.combat.states.get('cpu').pickups,0);assert.equal(a.combat.padReady('a'),false);
 const time=a.combat.time;a.combat.step(0,[cpu,a.r],a.curve);assert.equal(a.combat.time,time);
 for(let i=0;i<480;i++){a.combat.capture([cpu,a.r]);a.combat.step(1/60,[cpu,a.r],a.curve);}assert.equal(a.combat.padReady('a'),true);
 const length=a.curve.getLength();cpu.physics.distance=length+40;a.combat.capture([cpu,a.r]);cpu.physics.distance=length+65;a.combat.step(1/60,[cpu,a.r],a.curve);assert.equal(a.combat.states.get('cpu').pickups,1);
});
test('fork and merge sweeps use correct route and physical pad length',()=>{
 const curve=createTrackCurve(ROUTE_LAB),b=curve.track.branches[0],length=curve.getLength(),ship=createShipPhysics(100);
 const pad={id:'route',d:(b.start+b.end)/2*length,offset:0,routeId:b.id,metric:b.span/b.length};
 ship.distance=pad.d-6*pad.metric;ship.route={id:b.id,lap:0};const before=pickupSnapshot(ship);ship.distance=pad.d-4*pad.metric;
 assert.ok(pickupCrossing(ship,before,pad,curve));assert.equal(pickupCrossing(ship,before,{...pad,routeId:undefined},curve),null);
 ship.route=null;ship.distance=b.start*length-5;const fork=pickupSnapshot(ship);ship.route={id:b.id,lap:0};ship.distance=b.start*length+15;
 assert.equal(pickupCrossing(ship,fork,{d:b.start*length+10,offset:0},curve),null);
 assert.ok(pickupCrossing(ship,fork,{d:b.start*length+10,offset:0,routeId:b.id,metric:1},curve));
});
test('v5 weapon metadata round-trips and old versions reject new fields; fallback validates on all tracks',()=>{
 const data={...COMBAT_LAB,pads:[{id:'weapon',type:'weapon',weapon:'homing',progress:.1,offset:0}]};
 assert.equal(JSON.parse(serializeTrack(data)).version,6);assert.deepEqual(parseTrack(serializeTrack(data)).pads,data.pads);
 assert.throws(()=>parseTrack(JSON.stringify({format:'swipe-out-track',version:4,track:data})),/version 5/);
 assert.throws(()=>normalizeTrack({...data,pads:[{...data.pads[0],weapon:'laser'}]}),/choose rocket/);
 for(const {data} of Object.values(BUILTIN_TRACKS)){const assets=createTrack(data);try{const pads=automaticWeaponPads(assets.curve,assets.boostPads);normalizeTrack({...data,pads});assert.ok(pads.length>0,data.name);}finally{disposeTrackGroup(assets.group);}}
});
test('weapon pads are hidden outside combat, dim on pickup and reset on retry',()=>{
 const assets=createTrack(COMBAT_LAB),a=setup(assets.weaponPads),data=assets.group.userData.weaponPads;
 updateWeaponPads(assets.group,0,a.combat);assert.equal(data.visual.visible,true);
 const first=assets.weaponPads[0];a.r.physics.lateralOffset=first.offset;cross(a,first.d-10,first.d+5);updateWeaponPads(assets.group,a.combat.time,a.combat);
 const matrix=new THREE.Matrix4();data.tokens[first.weapon].getMatrixAt(data.tokenIndices[0],matrix);assert.equal(matrix.determinant(),0);
 a.combat.reset(false,[a.r],assets.weaponPads);updateWeaponPads(assets.group,0,a.combat);assert.equal(data.visual.visible,false);assert.equal(a.combat.weaponPads.length,0);
 a.combat.reset(true,[a.r],assets.weaponPads);assert.equal(a.combat.padReady(first.id),true);assert.equal(a.combat.states.get(a.r.id).weapon,null);
 disposeTrackGroup(assets.group);
});

test('CPU races seek, collect and fire finite weapons through the production update path',()=>{
 const assets=createTrack(COMBAT_LAB),opponents=RACER_DEFINITIONS.map(d=>createOpponentState(d)),combat=createCombat();
 const racers=()=>opponents.map(o=>({id:o.name,physics:o.physics,group:o.group,finished:o.finishTime!==null}));
 combat.reset(true,racers(),assets.weaponPads);
 for(let i=0;i<60*180;i++){
  combat.capture(racers());
  const ready=new Set(assets.weaponPads.filter(p=>combat.padReady(p.id)).map(p=>p.id));
  for(const o of opponents)o.weaponPadIds=combat.states.get(o.name).weapon?null:ready;
  updateOpponents(opponents,assets.curve,1/60,(i+1)/60,true,{boostPads:[...assets.boostPads,...assets.weaponPads],trackWidth:COMBAT_LAB.width});
  combat.step(1/60,racers(),assets.curve);
  if(opponents.every(o=>o.finishTime!==null))break;
 }
 assert.ok(opponents.every(o=>o.finishTime!==null));const states=[...combat.states.values()];
 assert.ok(states.some(s=>s.pickups>0), 'scarce shared pads do not guarantee every racer a pickup');assert.ok(states.reduce((n,s)=>n+s.shots,0)>0);disposeTrackGroup(assets.group);
});

test('same equipped weapon is ignored without ammo refill, cooldown or announcer event',()=>{
 for(const weapon of Object.keys(WEAPONS)) {
  const a=setup([{id:'same',d:50,offset:0,type:'weapon',weapon}]);
  a.combat.equip(a.r.id,weapon);a.s.ammo[weapon]=1;cross(a);
  assert.equal(a.s.ammo[weapon],1);assert.equal(a.s.pickups,0);
  assert.equal(a.combat.events.filter(e=>e.kind==='pickup').length,0);assert.equal(a.combat.padReady('same'),true);
  const cpu=racer('cpu',false);a.combat.states.set(cpu.id,structuredClone(a.s));
  a.combat.states.get(cpu.id).weapon=null;a.combat.states.get(cpu.id).padPassages={};
  cpu.physics.distance=40;a.combat.capture([cpu]);cpu.physics.distance=65;
  a.combat.step(1/60,[cpu],a.curve);assert.equal(a.combat.states.get(cpu.id).pickups,1);
 }
});
test('automatic weapon stations are single pads at doubled spacing',()=>{
 const c=createTrackCurve(COMBAT_LAB),pads=automaticWeaponPads(c);
 assert.ok(pads.every(p=>p.offset===0));
 for(let i=1;i<pads.length;i++)assert.ok((pads[i].progress-pads[i-1].progress)*c.getLength()>=459.99);
});

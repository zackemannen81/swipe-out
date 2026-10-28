import test from 'node:test';
import assert from 'node:assert/strict';
import { RACEWAY_LAB } from '../src/track-workshop.js';
import { GAP_LAB, ROUTE_LAB } from '../src/track-labs.js';
import { normalizeTrack, parseTrack, serializeTrack } from '../src/track-format.js';
import { createTrackCurve, getTrackWidth, getRacerWidth, progressAtControlPoint, getTrackFrame } from '../src/track-path.js';
import { createTrack, disposeTrackGroup } from '../src/track.js';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { collectBoostPad } from '../src/race-interactions.js';
import { suggestBoostPads, updateTrackPresentation } from '../src/track-pads.js';
import { measureCpuRace } from '../tools/measure-cpu-difficulty.mjs';

const copy=()=>structuredClone(RACEWAY_LAB);
test('v4 round trips widths, authored pads and style; v3 keeps legacy semantics',()=>{
  assert.deepEqual(parseTrack(serializeTrack(RACEWAY_LAB)),normalizeTrack(RACEWAY_LAB));
  const old=parseTrack(JSON.stringify({format:'swipe-out-track',version:3,track:ROUTE_LAB}));
  for(const key of ['pointWidths','pads','roadStyle'])assert.equal(Object.hasOwn(old,key),false);
  assert.throws(()=>parseTrack(JSON.stringify({format:'swipe-out-track',version:3,track:RACEWAY_LAB})),/version 4/);
  assert.throws(()=>normalizeTrack({...copy(),pointWidths:[10]}),/one width/);
  assert.throws(()=>normalizeTrack({...copy(),pads:[{id:'x',type:'brake',progress:0.1,offset:48}]}),/inside the road/);
  assert.throws(()=>normalizeTrack({...GAP_LAB,pads:[{id:'x',type:'boost',progress:(GAP_LAB.gaps[0].start+GAP_LAB.gaps[0].end)/2,offset:0}]}),/gap/);
});
test('width interpolates at control points and closes smoothly; branch endpoints match main road',()=>{
  const data=copy();data.pointWidths[2]=null;
  const curve=createTrackCurve(data);
  data.pointWidths.forEach((w,i)=>assert.ok(Math.abs(getTrackWidth(curve,progressAtControlPoint(curve,i))-(w??data.width))<0.002));
  assert.ok(Math.abs(getTrackWidth(curve,1-1e-7)-getTrackWidth(curve,1e-7))<0.001);
  const b=curve.track.branches[0];
  assert.equal(b.widthAt(0),getTrackWidth(curve,b.start));assert.equal(b.widthAt(1),getTrackWidth(curve,b.end));
  const ship={distance:curve.getLength()*0.7};assert.equal(getRacerWidth(curve,ship),getTrackWidth(curve,0.7));
});
test('mesh width matches physics at samples and narrowing walls actually collide',()=>{
  const {group,curve}=createTrack(RACEWAY_LAB);
  try {
    const a=group.children[0].geometry.attributes.position;
    for(let i=0;i<=900;i+=50) {
      const width=Math.hypot(a.getX(i*2)-a.getX(i*2+1),a.getY(i*2)-a.getY(i*2+1),a.getZ(i*2)-a.getZ(i*2+1));
      assert.ok(Math.abs(width-getTrackWidth(curve,i/900))<0.001);
    }
    const ship=createShipPhysics(100,{handlingMode:'wipeout'});
    ship.distance=progressAtControlPoint(curve,12)*curve.getLength();ship.lateralOffset=7;ship.lateralVelocity=2;
    ship.previousTangent=getTrackFrame(curve,ship.distance/curve.getLength()).tangent;
    stepShipPhysics(ship,{},1/120,curve,140,RACEWAY_LAB.width);assert.equal(ship.wallHits,1);
  } finally {disposeTrackGroup(group);}
});
test('brakes are swept once per crossing at 30/60/120 Hz, can be missed, reset next lap',()=>{
  for(const hz of [30,60,120]) {
    const ship=createShipPhysics(200), pads=[{d:50,offset:0,type:'brake'}];
    for(let i=0;i<hz;i++) {ship.previousDistance=ship.distance;ship.distance+=200/hz;collectBoostPad(ship,pads,1000,140);}
    assert.equal(ship.brakePadCount,1);assert.equal(ship.speed,144);
    ship.previousDistance=1040;ship.distance=1060;collectBoostPad(ship,pads,1000,140);assert.equal(ship.brakePadCount,2);
    const miss=createShipPhysics(200);Object.assign(miss,{previousDistance:40,distance:65,previousLateralOffset:3,lateralOffset:3});
    collectBoostPad(miss,pads,1000,140);assert.equal(miss.speed,200);
  }
});
test('route pad footprint uses physical metres and ignores the main road',()=>{
  const ship=createShipPhysics(200), pad={d:100,offset:0,type:'brake',routeId:'shortcut',metric:2};
  Object.assign(ship,{previousDistance:89,distance:91});collectBoostPad(ship,[pad],1000,140);assert.equal(ship.brakePadCount,0);
  ship.route={id:'shortcut',lap:0};collectBoostPad(ship,[pad],1000,140);assert.equal(ship.brakePadCount,1);
  collectBoostPad(ship,[pad],1000,140);assert.equal(ship.brakePadCount,1);
});
test('suggestions validate and remain opt-in; animation changes no hitboxes',()=>{
  const data=copy();data.pads=[];data.pads=suggestBoostPads(data);assert.ok(data.pads.length>0);normalizeTrack(data);
  const {group,boostPads}=createTrack(data), before=JSON.stringify(boostPads);
  updateTrackPresentation(group,1);const intensity=group.userData.padMaterials[0].emissiveIntensity;
  updateTrackPresentation(group,2);assert.notEqual(group.userData.padMaterials[0].emissiveIntensity,intensity);
  assert.equal(JSON.stringify(boostPads),before);disposeTrackGroup(group);
  const empty=createTrack({...data,pads:[]});assert.equal(empty.boostPads.length,0);disposeTrackGroup(empty.group);
});
test('all CPU levels finish three laps of variable-width workshop with branch/pads',()=>{
  for(const difficulty of ['rookie','pilot','elite']) {
    const rows=measureCpuRace(RACEWAY_LAB,difficulty);
    assert.ok(rows.every(r=>r.time!==null && r.recoveries===0),JSON.stringify({difficulty,rows}));
  }
});

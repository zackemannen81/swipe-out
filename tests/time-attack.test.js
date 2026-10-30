import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TIME_ATTACK, TimeAttackSession, recordKey, loadRecord, validRecord, saveRecord, ghostPose, deltaAtProgress } from '../src/time-attack.js';
import { createRacingGuide, createGuideView } from '../src/racing-guide.js';
import { createLapGhost } from '../src/lap-ghost.js';
import { createTrackCurve, getTrackFrame } from '../src/track-path.js';
import { ION_FOUNDRY } from '../src/track-foundry.js';
import { createTrack, disposeTrackGroup } from '../src/track.js';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { getRacerFrame, nextBranch } from '../src/track-path.js';
import { CLASSIC_HANDLING } from '../src/classic-handling.js';

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
const key='test-record';
const point=(time,distance=time*100,extra={})=>({time,distance,position:new THREE.Vector3(Math.sin(time),time*2,distance),
  quaternion:new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),time*.1),recoveries:0,flight:false,completedLaps:Math.floor(distance/1000),...extra});
function run(hz=60,storage=memory(),extra={}) {
  const session=new TimeAttackSession({length:1000,key,storage,...extra});
  for(let i=0;i<=Math.ceil(40.1*hz);i++)session.advance(point(i/hz));
  return session;
}

test('out lap is unranked; three flying laps have interpolated identical timing/replay at 30/60/120 Hz',()=>{
  for(const hz of [30,60,120]){
    const s=run(hz);assert.equal(s.done,true);assert.equal(s.completed.length,3);
    assert.ok(s.completed.every(l=>l.valid&&Math.abs(l.duration-10)<1e-9));
    assert.deepEqual(s.best.sectors.map(n=>+n.toFixed(6)),[3.3,3.3,3.4]);
    assert.ok(validRecord(s.best,key));assert.equal(s.best.samples.length,201);
    assert.equal(s.best.samples[0][0],0);assert.equal(s.best.samples.at(-1)[1],1);
    assert.ok(Math.abs(ghostPose(s.best,5).position.z-1500)<1e-6);
    assert.ok(Math.abs(deltaAtProgress(s.best,.4,3.76)+.24)<1e-7);
    assert.equal(ghostPose(s.best,11),null);
  }
});

test('recovery invalidates only that lap; failed gates, discontinuities and a long lap cannot save',()=>{
  const storage=memory(),s=new TimeAttackSession({length:1000,key,storage});
  for(let i=0;i<=4000;i++)s.advance(point(i/100,undefined,{recoveries:i>=1500?1:0}));
  assert.equal(s.completed[0].valid,false);assert.ok(s.completed[0].reason.includes('Recovery'));
  assert.equal(s.completed[1].valid,true);assert.ok(s.best);
  const invalidGates=new TimeAttackSession({length:1000,key,storage:memory(),requiresGates:true});
  for(let i=0;i<=4000;i++)invalidGates.advance(point(i/100,undefined,{completedLaps:0}));
  assert.ok(invalidGates.completed.every(l=>!l.valid));assert.equal(invalidGates.best,null);
  const long=new TimeAttackSession({length:1000,key,storage:memory()});
  for(let i=0;i<=1000;i++)long.advance(point(i/100));
  for(let i=1;i<=6100;i++)long.advance(point(10+i/10,1000+i*.01));
  assert.ok(long.invalid.includes('10 minutes'));assert.ok(long.samples.length<=TIME_ATTACK.maxSamples);
});

test('off-frame sector/finish crossings and quaternion interpolation do not quantize to render frames',()=>{
  for(const hz of [30,60,120]){
    const s=new TimeAttackSession({length:1003,key,storage:memory()});
    for(let i=0;i<=Math.ceil(40.2*hz);i++)s.advance(point(i/hz));
    assert.ok(s.done);assert.ok(Math.abs(s.best.duration-10.03)<1e-8);
    assert.ok(Math.abs(s.best.sectors[0]-3.3099)<1e-8);
    assert.ok(Math.abs(ghostPose(s.best,.025).position.z-1005.5)<1e-6);
  }
});

test('pause repeats no samples, saved PB survives retry; slower lap never overwrites faster lap',()=>{
  const store=memory(),s=run(60,store),raw=store.getItem(key);
  const again=new TimeAttackSession({length:1000,key,storage:store});
  assert.equal(again.best.duration,s.best.duration);
  for(let i=0;i<=600;i++)again.advance(point(i/30,i/30*50));
  const count=again.samples.length;
  for(let i=0;i<100;i++)again.advance(point(20,1000));
  assert.equal(again.samples.length,count);
  for(let i=601;i<=2401;i++)again.advance(point(i/30,i/30*50));
  assert.equal(store.getItem(key),raw);assert.equal(again.completed.length,3);
});

test('record keys isolate geometry, handling, effective assist, ship and speed; camera is irrelevant',()=>{
  const config={track:{width:10,centerline:[[1,2,3],[4,5,6]]},ship:'racer',speedClass:'standard',topSpeed:143,handling:'swipeout',assist:1};
  const base=recordKey(config);
  // Gravity changes lap performance; retain old storage but use a new identity.
  assert.notEqual(base,'swipe-out:lap:v1:1c0fcd20-afef0848', 'old pre-gravity records stay isolated');
  assert.equal(base,'swipe-out:lap:v1:8a9bc869-2df95b53');
  assert.notEqual(recordKey({...config,handling:'wipeout'}),'swipe-out:lap:v1:bfedcd1a-316b6070');
  for(const change of [{track:{...config.track,width:11}},{ship:'other'},{speedClass:'elite'},{topSpeed:144},{handling:'wipeout'},{assist:0}])assert.notEqual(recordKey({...config,...change}),base);
  assert.equal(recordKey({...config,camera:'wipeout'}),base);
  assert.equal(recordKey({...config,handling:'wipeout',assist:1}),recordKey({...config,handling:'wipeout',assist:0}));
  assert.equal(base,recordKey({...config,track:{centerline:config.track.centerline,width:10}}));
});

test('malformed/quota/unavailable storage is contained; in-memory best remains available',()=>{
  const broken={getItem:()=>'{no',setItem:()=>{throw Error('quota');}};
  assert.equal(loadRecord(broken,key).record,null);
  assert.ok(loadRecord(null,key).warning);
  const s=run(30,broken);assert.ok(s.best);assert.ok(s.warning.includes('session only'));
  assert.equal(saveRecord(broken,s.best),false);
  for(const mutate of [r=>r.samples.reverse(),r=>r.samples[1][0]=-1,r=>r.samples[1][5]=99,r=>r.sectors[0]=-1,r=>r.key='different',r=>r.duration=Infinity]){
    const r=structuredClone(s.best);mutate(r);assert.equal(validRecord(r,key),false);
  }
});

test('ghost slerps recorded orientation, fades on overlap, shares only geometry and never enters racer simulation',()=>{
  const record=run().best,scene=new THREE.Scene(),craft=new THREE.Group(),original=new THREE.MeshBasicMaterial();
  const geometry=new THREE.BoxGeometry();craft.add(new THREE.Mesh(geometry,original));
  const view=createLapGhost(scene,craft);view.update(record,4,new THREE.Vector3(999,0,0),true);
  assert.ok(view.group.visible);assert.equal(view.group.children[0].geometry,geometry);
  assert.notEqual(view.group.children[0].material,original);assert.equal(original.transparent,false);
  const expected=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),1.4);
  assert.ok(view.group.quaternion.angleTo(expected)<1e-6);
  view.update(record,4,view.group.position.clone(),true);assert.equal(view.group.children[0].material.opacity,0);
  view.update(record,4,craft.position,false);assert.equal(view.group.visible,false);
  let geometryDisposals=0;geometry.addEventListener('dispose',()=>geometryDisposals++);view.dispose();assert.equal(geometryDisposals,0);
  geometry.dispose();original.dispose();
});

test('guide respects margins, transported surfaces, gaps and connected shortcut; bounded geometry releases resources',()=>{
  const {curve,group,boostPads}=createTrack(ION_FOUNDRY),guide=createRacingGuide(curve,boostPads);
  const length=curve.getLength();assert.equal(guide.branches.size,1);
  assert.equal([...guide.branches.values()][0].recommended,true);
  for(const node of guide.main.nodes)assert.ok(Math.abs(node.lane)<=node.edge+1e-8);
  for(let i=1;i<guide.main.nodes.length;i++)assert.ok(Math.abs(guide.main.nodes[i].lane-guide.main.nodes[i-1].lane)<=guide.main.step*.14+1e-8);
  for(const u of [.01,.15,.3,.5,.7,.85,.99]){
    const points=guide.ahead({distance:u*length,lateralOffset:0,route:null});
    assert.equal(points.length,65);
    for(const p of points){assert.ok(p.position.toArray().every(Number.isFinite));assert.ok(Math.abs(p.position.clone().sub(p.frame.center).dot(p.frame.normal)-.17)<1e-6);}
  }
  const b=curve.track.branches[0],points=guide.ahead({distance:(b.start-.01)*length,lateralOffset:0,route:null});
  assert.ok(points.some(p=>p.routeId===b.id));
  const gap=curve.track.gaps[0],gapPoints=guide.ahead({distance:gap.start*length-20,lateralOffset:0,route:null});
  assert.equal(guide.warning(gapPoints,140).kind,'gap');
  const scene=new THREE.Scene(),view=createGuideView(scene);view.update(gapPoints,140,true);
  assert.ok(view.mesh.geometry.drawRange.count<64*6);assert.ok(view.mesh.geometry.drawRange.count>0);
  const capacity=view.mesh.geometry.attributes.position.count;view.update(points,200,true);assert.equal(view.mesh.geometry.attributes.position.count,capacity);
  view.dispose();assert.equal(scene.children.length,0);disposeTrackGroup(group);
});

test('turn warning uses local signed curvature and pad guidance approaches a reachable pad',()=>{
  const definition={width:20,magnetic:true,centerline:Array.from({length:32},(_,i)=>[100*Math.sin(i/32*Math.PI*2),0,100*Math.cos(i/32*Math.PI*2)])};
  const curve=createTrackCurve(definition),guide=createRacingGuide(curve,[{d:curve.getLength()*.25,offset:3}]);
  const p=guide.main.at(.25);assert.ok(p.lane>1);
  const points=guide.ahead({distance:10,lateralOffset:0,route:null});
  assert.ok(guide.warning(points,140));assert.equal(guide.warning(points,140).kind,'brake');
  assert.ok(getTrackFrame(curve,.25).normal.length()>0.99);
});

test('real classic physics records four Foundry laps with branches, gates, flight and a reloadable world-pose replay',()=>{
  const curve=createTrackCurve(ION_FOUNDRY),length=curve.getLength(),storage=memory();
  const s=createShipPhysics(140,{handlingMode:'wipeout'}),session=new TimeAttackSession({length,key,storage,requiresGates:true});
  let time=0,pose=stepShipPhysics(s,{},0,curve,140,22);
  const sample=()=>session.advance({time,distance:s.distance,position:pose.position,quaternion:pose.orientation,
    recoveries:s.recoveries,flight:!!s.flight,completedLaps:s.completedLaps});
  sample();
  for(let i=0;i<120*400&&!session.done;i++){
    const f=getRacerFrame(curve,s),ahead=getRacerFrame(curve,s,(s.distance+6)/length);
    const curvature=Math.atan2(ahead.tangent.dot(f.right),ahead.tangent.dot(f.tangent))/6;
    const fork=nextBranch(curve,s.distance),lane=fork&&fork.distance-s.distance<200&&!s.route?5:0;
    const targetYaw=Math.atan2((lane-s.lateralOffset)*2-s.lateralVelocity*1.8,s.speed);
    const steer=-THREE.MathUtils.clamp((curvature*s.speed+(targetYaw-s.yaw)*8)/CLASSIC_HANDLING.turnRate,-1,1);
    const brake=s.speed>Math.max(55,Math.min(140,.85/Math.max(.001,Math.abs(curvature))))+8;
    pose=stepShipPhysics(s,{steer,thrust:brake?0:1,brakeLeft:brake,brakeRight:brake},1/120,curve,140,22);
    time+=1/120;sample();
  }
  assert.ok(session.done);assert.equal(s.recoveries,0);assert.equal(s.landings,8);assert.equal(s.routeEntries,4);
  assert.ok(session.completed.every(l=>l.valid));assert.ok(validRecord(loadRecord(storage,key).record,key));
  const branch=curve.track.branches[0];
  const sampleOnBranch=session.best.samples.find(p=>p[1]>branch.start+.015&&p[1]<branch.end-.015);
  const expected=branch.frame((sampleOnBranch[1]-branch.start)/(branch.end-branch.start)).center;
  assert.ok(new THREE.Vector3(...sampleOnBranch.slice(2,5)).distanceTo(expected)<15);
});

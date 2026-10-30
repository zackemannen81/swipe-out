import test from 'node:test';
import assert from 'node:assert/strict';
import { NECROS as track, NECROS_SECTORS as sectors } from '../src/track-necros.js';
import { normalizeTrack, parseTrack, serializeTrack } from '../src/track-format.js';
import { createTrackCurve, getTrackFrame, canFinishRace } from '../src/track-path.js';
import { createTrack, disposeTrackGroup } from '../src/track.js';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { createOpponentState, RACER_DEFINITIONS, updateOpponents, resetOpponents } from '../src/opponents.js';

test('Necros is an object-free continuous ordered route with a steep dive', () => {
  assert.deepEqual(parseTrack(serializeTrack(track)), normalizeTrack(track));
  assert.equal(track.objects.length, 0); assert.equal(track.gaps.length, 0); assert.equal(track.branches.length, 0);
  const c = createTrackCurve(track), l = c.getLength(), frames = [];
  let previous = -1, steepest = 0;
  for (const u of Object.values(sectors)) { assert.ok(u > previous); previous = u; }
  for (let d = 0; d < l; d += 8) {
    const f = getTrackFrame(c, d / l); assert.ok(f.normal.y > .05); frames.push(f);
    steepest = Math.min(steepest, f.tangent.y);
  }
  assert.ok(steepest < -.94);
  for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++)
    if (Math.min(j-i, frames.length-j+i)*8 > 65)
      assert.ok(frames[i].center.distanceTo(frames[j].center) > 28, `road overlap ${i},${j}`);
});
test('Necros CPU field finishes three laps at each difficulty',()=>{
 const {curve,group,boostPads}=createTrack(track);try{for(const difficulty of ['rookie','pilot','elite']){
 const racers=RACER_DEFINITIONS.map(d=>createOpponentState(d));resetOpponents(racers,difficulty);
 for(let i=0;i<60*360&&racers.some(o=>o.finishTime===null);i++)updateOpponents(racers,curve,1/60,(i+1)/60,true,{boostPads,trackWidth:track.width});
 assert.ok(racers.every(o=>o.finishTime!==null),difficulty);assert.ok(racers.every(o=>o.physics.recoveries===0),difficulty+' recovery');
 }}finally{disposeTrackGroup(group);}
});


test('Necros player traverses the dive and completes three ordered laps', () => {
  const { curve, group } = createTrack(track);
  try { for (const hz of [30, 120]) {
    const ship = createShipPhysics(100); ship.assistLevel = 0;
    for (let i=0; i<hz*420 && !canFinishRace(curve, ship); i++) {
      const pose = stepShipPhysics(ship, {steer:0, thrust:1}, 1/hz, curve, 210, track.width);
      assert.ok(pose.position.toArray().every(Number.isFinite));
    }
    assert.ok(canFinishRace(curve, ship)); assert.ok(ship.distance >= curve.getLength()*3);
    assert.equal(ship.recoveries, 0); assert.equal(ship.landings, 0);
  }} finally { disposeTrackGroup(group); }
});

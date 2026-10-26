import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GAP_LAB, LOOP_LAB } from '../src/track-labs.js';
import { createTrackCurve, getTrackFrame, hasSurface } from '../src/track-path.js';
import { createTrack, disposeTrackGroup } from '../src/track.js';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { createOpponentState, RACER_DEFINITIONS, updateOpponents, resetOpponents } from '../src/opponents.js';
import { createCollisionState, resolveRacerCollisions, resolveWallImpact, collectBoostPad } from '../src/race-interactions.js';
import { parseTrack, serializeTrack, normalizeTrack } from '../src/track-format.js';
import { createTrackCamera } from '../src/track-camera.js';
import { NEON_CAUSEWAY } from '../src/track-data.js';

const gapCurve = createTrackCurve(GAP_LAB), loopCurve = createTrackCurve(LOOP_LAB);
const gapStart = GAP_LAB.gaps[0].start * gapCurve.getLength();
const input = { steer: 0, thrust: 0 };
function jumper(speed = 140, lane = 0) {
  const ship = createShipPhysics(speed);
  ship.distance = gapStart - 2; ship.lateralOffset = lane; ship.assistLevel = 0;
  return ship;
}
function simulateJump(ship, hz = 120, steer = 0) {
  for (let i = 0; i < hz * 8; i++) {
    stepShipPhysics(ship, { ...input, steer }, 1 / hz, gapCurve, 220, GAP_LAB.width);
    if (ship.landings || ship.recoveries) return ship;
  }
  assert.fail('flight did not land or recover within eight seconds');
}

test('v2 round-trips gaps/magnetic/banks, v1 and legacy remain non-magnetic', () => {
  for (const definition of [GAP_LAB, LOOP_LAB]) assert.deepEqual(parseTrack(serializeTrack(definition)), normalizeTrack(definition));
  const legacy = structuredClone(NEON_CAUSEWAY); legacy.centerline[0].push(90);
  const migrated = parseTrack(JSON.stringify({ format: 'swipe-out-track', version: 1, track: legacy }));
  assert.equal(migrated.magnetic, undefined);
  assert.deepEqual(createTrackCurve(migrated).getPointAt(0.25), createTrackCurve(legacy).getPointAt(0.25));
  assert.throws(() => normalizeTrack({ ...GAP_LAB, magnetic: false }), /enable magnetic/);
  assert.throws(() => normalizeTrack({ ...GAP_LAB, gaps: [{ start: 0.1, end: 0.15 }, { start: 0.14, end: 0.2 }] }), /between gaps/);
  assert.throws(() => normalizeTrack({ ...GAP_LAB, gaps: [{ start: 0.01, end: 0.05 }] }), /start/);
  assert.throws(() => normalizeTrack({ ...GAP_LAB, gaps: [{ start: 0.3, end: 0.1 }] }), /end after start/);
});

test('transported frames remain orthonormal/continuous at verticals, inversion, roll and lap seam', () => {
  let previous = getTrackFrame(loopCurve, 0), inverted = false, vertical = false;
  for (let i = 1; i <= 8192; i++) {
    const frame = getTrackFrame(loopCurve, i / 8192);
    for (const axis of [frame.right, frame.normal, frame.tangent]) assert.ok(Math.abs(axis.length() - 1) < 1e-8);
    assert.ok(Math.abs(frame.normal.dot(frame.tangent)) < 1e-8);
    assert.ok(Math.abs(frame.right.dot(frame.tangent)) < 1e-8);
    assert.ok(frame.right.clone().cross(frame.normal).dot(frame.tangent) > 0.99999);
    assert.ok(frame.normal.dot(previous.normal) > 0.995, `orientation jump at ${i / 8192}`);
    inverted ||= frame.normal.y < -0.99; vertical ||= Math.abs(frame.tangent.y) > 0.99;
    previous = frame;
  }
  assert.ok(inverted && vertical);
  assert.ok(getTrackFrame(loopCurve, 1 - 1e-7).normal.dot(getTrackFrame(loopCurve, 1e-7).normal) > 0.99999);
});

test('gap cuts exact road mesh boundaries and removes fixtures/pads throughout the opening', () => {
  const assets = createTrack(GAP_LAB), { curve, group, length } = assets;
  const stops = [...new Set([...Array.from({ length: 901 }, (_, i) => i / 900), ...GAP_LAB.gaps.flatMap(g => [g.start, g.end])])].sort((a, b) => a - b);
  const mesh = group.children.find(object => object.isMesh && !object.isInstancedMesh);
  for (let i = 0; i < mesh.geometry.index.count; i += 3) {
    const samples = [0, 1, 2].map(j => Math.floor(mesh.geometry.index.array[i + j] / 2));
    const middle = (stops[Math.min(...samples)] + stops[Math.max(...samples)]) * 0.5;
    assert.ok(hasSurface(curve, middle * length), 'no triangle bridges the gap');
  }
  assert.ok(mesh.geometry.index.count < 900 * 6);
  for (const pad of assets.boostPads) assert.ok(hasSurface(curve, pad.d, 6));
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3();
  group.traverse(object => {
    if (!object.isInstancedMesh) return;
    for (let i = 0; i < object.count; i++) {
      object.getMatrixAt(i, matrix); position.setFromMatrixPosition(matrix);
      assert.ok(!(Math.abs(position.x) < 15 && position.z > 107 && position.z < 193), 'no floating rail/marker remains in opening');
    }
  });
  disposeTrackGroup(group);
});

test('real launch momentum and world gravity are independent of the invisible gap centerline', () => {
  const ship = jumper();
  while (!ship.flight) stepShipPhysics(ship, input, 1 / 120, gapCurve, 220, GAP_LAB.width);
  const start = ship.flight.position.clone(), velocity = ship.flight.velocity.clone();
  for (let i = 0; i < 24; i++) stepShipPhysics(ship, input, 1 / 120, gapCurve, 220, GAP_LAB.width);
  const expected = start.addScaledVector(velocity, 0.2).add(new THREE.Vector3(0, -0.5 * 24 * 0.2 ** 2, 0));
  assert.ok(ship.flight.position.distanceTo(expected) < 1e-7);
  assert.ok(Math.abs(ship.flight.velocity.y - (velocity.y - 24 * 0.2)) < 1e-7);
  const before = JSON.stringify(ship);
  stepShipPhysics(ship, input, 0, gapCurve, 220, GAP_LAB.width);
  assert.equal(JSON.stringify(ship), before, 'paused pose updates cannot advance flight');
  assert.equal(resolveWallImpact(ship, 4), false);
  assert.equal(collectBoostPad(ship, [{ d: ship.distance, offset: ship.lateralOffset }], gapCurve.getLength(), 220), false);
});

test('normal/boosted jumps land; low-speed and sideways misses recover before the gap without phantom sweeps', () => {
  for (const speed of [100, 129, 140, 210]) {
    const ship = simulateJump(jumper(speed));
    assert.equal(ship.landings, 1, `speed ${speed}`); assert.equal(ship.recoveries, 0);
    assert.ok(ship.distance > GAP_LAB.gaps[0].end * gapCurve.getLength());
    assert.equal(ship.airborne, false);
  }
  for (const ship of [jumper(40), jumper(140)]) {
    const sideMiss = ship.speed > 100;
    while (!ship.flight) stepShipPhysics(ship, input, 1 / 120, gapCurve, 220, GAP_LAB.width);
    if (sideMiss) ship.flight.velocity.x = 40;
    simulateJump(ship);
    assert.equal(ship.recoveries, 1); assert.equal(ship.landings, 0);
    assert.equal(ship.flight, null); assert.ok(ship.recoveryTimer > 0);
    assert.equal(ship.previousDistance, ship.distance); assert.ok(ship.distance < gapStart);
    const position = stepShipPhysics(ship, input, 0, gapCurve, 220, GAP_LAB.width).position;
    assert.ok(position.distanceTo(ship.previousPosition) < 1e-8);
    const held = ship.distance;
    stepShipPhysics(ship, input, 0.1, gapCurve, 220, GAP_LAB.width);
    assert.equal(ship.distance, held, 'recovery holds before returning control');
  }
});

test('30/60/120 Hz agree on free flight, landing and magnetic loop traversal', () => {
  const results = [30, 60, 120].map(hz => {
    const ship = jumper();
    for (let i = 0; i < hz * 2; i++) stepShipPhysics(ship, input, 1 / hz, gapCurve, 220, GAP_LAB.width);
    return ship;
  });
  for (const ship of results) {
    assert.equal(ship.landings, 1); assert.equal(ship.recoveries, 0);
    assert.ok(Math.abs(ship.distance - results[0].distance) < 0.02);
  }
  const laps = [30, 60, 120].map(hz => {
    const ship = createShipPhysics(140);
    for (let i = 0; i < hz * 40; i++) {
      const pose = stepShipPhysics(ship, { steer: 0, thrust: 1 }, 1 / hz, loopCurve, 140, LOOP_LAB.width);
      assert.equal(ship.airborne, false);
      assert.ok(Math.abs(pose.position.distanceTo(pose.frame.center) - 0.62) < 1e-7);
    }
    return ship.distance;
  });
  for (const distance of laps) assert.ok(Math.abs(distance - laps[0]) < 0.02);
});

test('airborne collision impulses change real flight velocity and recovery craft are excluded', () => {
  const racers = [jumper(140), jumper(140)].map((physics, i) => {
    while (!physics.flight) stepShipPhysics(physics, input, 1 / 120, gapCurve, 220, GAP_LAB.width);
    physics.flight.position.x = i === 0 ? -0.7 : 0.7;
    physics.flight.velocity.x = i === 0 ? 8 : -8;
    const group = new THREE.Group(); group.position.copy(stepShipPhysics(physics, input, 0, gapCurve, 220, GAP_LAB.width).position);
    physics.previousPosition.copy(group.position);
    return { id: String(i), physics, group };
  });
  resolveRacerCollisions(racers, gapCurve, 1 / 60, createCollisionState());
  assert.ok(racers[0].physics.flight.velocity.x < 0);
  assert.ok(racers[1].physics.flight.velocity.x > 0);
  const old = racers[0].physics.flight.velocity.x;
  stepShipPhysics(racers[0].physics, input, 1 / 120, gapCurve, 220, GAP_LAB.width);
  assert.equal(racers[0].physics.flight.velocity.x, old);
  racers[0].physics.recoveryTimer = 0.5;
  const hits = racers[1].physics.craftHits;
  resolveRacerCollisions(racers, gapCurve, 1 / 60, createCollisionState());
  assert.equal(racers[1].physics.craftHits, hits);
});

test('all CPU profiles complete three laps on both feature tracks with real pads and contacts', () => {
  for (const definition of [GAP_LAB, LOOP_LAB]) {
    const { curve, boostPads, group } = createTrack(definition);
    const rivals = RACER_DEFINITIONS.map(d => createOpponentState(d));
    const state = createCollisionState();
    for (let i = 0; i < 120 * 140; i++) {
      updateOpponents(rivals, curve, 1 / 120, (i + 1) / 120, true, { boostPads, trackWidth: definition.width });
      resolveRacerCollisions(rivals.map(o => ({ id: o.name, physics: o.physics, group: o.group, finished: o.finishTime !== null })), curve, 1 / 120, state);
      if (rivals.every(o => o.finishTime !== null)) break;
    }
    for (const rival of rivals) {
      assert.ok(rival.finishTime !== null, `${definition.name}: ${rival.name} must finish`);
      if (definition === GAP_LAB) assert.ok(rival.physics.landings >= 3);
      assert.ok(rival.physics.boostCount > 0);
    }
    resetOpponents(rivals);
    for (const rival of rivals) {
      assert.equal(rival.physics.flight, null); assert.equal(rival.physics.recoveryTimer, 0);
      assert.equal(rival.physics.launches, 0); assert.equal(rival.physics.respawnSerial, 0);
    }
    disposeTrackGroup(group);
  }
});

test('magnetic chase camera follows the local up direction through loops/rolls and snaps safely on recovery', () => {
  const camera = new THREE.PerspectiveCamera(), follow = createTrackCamera();
  let previous = null;
  for (let d = 0; d < loopCurve.getLength(); d += 140 / 120) {
    const frame = getTrackFrame(loopCurve, d / loopCurve.getLength());
    const position = frame.center.clone().addScaledVector(frame.normal, 0.62);
    follow.update(camera, position, frame, 1 / 120);
    assert.ok(camera.up.dot(frame.normal) > 0.99999);
    assert.ok(camera.position.distanceTo(position) < 8);
    assert.ok(camera.position.clone().sub(position).dot(frame.normal) > 1);
    if (previous) assert.ok(Math.abs(previous.dot(camera.quaternion)) > 0.99);
    previous = camera.quaternion.clone();
  }
  const frame = getTrackFrame(gapCurve, 0.1);
  follow.update(camera, frame.center, frame, 1 / 120, 'external', 1);
  assert.ok(camera.position.clone().sub(frame.center).dot(frame.normal) > 3);
});

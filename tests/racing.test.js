import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { collectBoostPad, resolveWallImpact, createCollisionState, resolveRacerCollisions } from '../src/race-interactions.js';
import { RACER_DEFINITIONS, createOpponentState, updateOpponents, resetOpponents, getPlayerPosition, syncOpponentPose } from '../src/opponents.js';
import { NEON_CAUSEWAY } from '../src/track-data.js';

// A straight local track makes the expected impulse direction unambiguous.
const straight = {
  getLength: () => 10000,
  getPointAt: u => new THREE.Vector3(0, 0, u * 10000),
  getTangentAt: () => new THREE.Vector3(0, 0, 1),
};
const neutral = { steer: 0, thrust: 0 };
function body(id, distance, lane, speed, lateralVelocity = 0, mass = 1) {
  const physics = createShipPhysics(speed, { mass });
  physics.distance = distance;
  physics.lateralOffset = lane;
  physics.lateralVelocity = lateralVelocity;
  physics.assistLevel = 0;
  const group = new THREE.Group();
  group.position.copy(stepShipPhysics(physics, neutral, 0, straight, 140).position);
  physics.previousPosition.copy(group.position);
  return { id, physics, group };
}

test('CPU profiles accelerate gradually to their own caps without player-distance rubber-banding', () => {
  const speeds = [];
  for (const profile of RACER_DEFINITIONS) {
    const rival = createOpponentState(profile);
    rival.currentSpeed = 30;
    const startSpeed = rival.currentSpeed;
    updateOpponents([rival], straight, 1 / 30, 1 / 30, true);
    assert.ok(rival.currentSpeed < startSpeed + 2, 'no speed teleport');
    for (let i = 1; i < 30 * 30; i++) updateOpponents([rival], straight, 1 / 30, (i + 1) / 30, true);
    assert.ok(rival.currentSpeed <= profile.topSpeed);
    assert.ok(rival.currentSpeed > profile.topSpeed * 0.98);
    speeds.push(rival.currentSpeed);
  }
  assert.equal(new Set(speeds.map(Math.round)).size, 4);
  const run = playerDistance => {
    const rival = createOpponentState(RACER_DEFINITIONS[0]);
    const player = { physics: createShipPhysics(133) };
    player.physics.distance = playerDistance;
    for (let i = 0; i < 120; i++) updateOpponents([rival], straight, 1 / 60, (i + 1) / 60, true, { player });
    return rival.currentSpeed;
  };
  assert.equal(run(2000), run(-2000));
});

test('shared boost pads require lane/height contact, sweep fast crossings and reset per lap', () => {
  for (const topSpeed of [133, ...RACER_DEFINITIONS.map(d => d.topSpeed)]) {
    const ship = createShipPhysics(80);
    Object.assign(ship, { previousDistance: 40, distance: 65, previousLateralOffset: 2.5, lateralOffset: 2.5 });
    const pads = [{ d: 50, offset: 2.5 }];
    assert.equal(collectBoostPad(ship, pads, 1000, topSpeed), true);
    assert.equal(ship.speed, topSpeed * 1.3);
    assert.equal(ship.boostTimer, 1);
    assert.equal(collectBoostPad(ship, pads, 1000, topSpeed), false);
    ship.previousDistance += 1000;
    ship.distance += 1000;
    assert.equal(collectBoostPad(ship, pads, 1000, topSpeed), true);
    assert.equal(ship.boostCount, 2);
  }
  const miss = createShipPhysics(133);
  Object.assign(miss, { previousDistance: 40, distance: 65 });
  assert.equal(collectBoostPad(miss, [{ d: 50, offset: 2.5 }], 1000, 133), false);
  miss.previousVerticalOffset = miss.verticalOffset = 3;
  assert.equal(collectBoostPad(miss, [{ d: 50, offset: 0 }], 1000, 133), false);
});

test('wall contact bounces and slows both types, honors width and avoids repeated damage', () => {
  for (const width of [8, 10, 14]) {
    for (const topSpeed of [133, 126]) {
      const ship = createShipPhysics(topSpeed);
      ship.lateralOffset = width / 2;
      ship.lateralVelocity = 9;
      assert.equal(resolveWallImpact(ship, width), true);
      assert.ok(ship.speed < topSpeed * 0.8);
      assert.ok(ship.lateralVelocity < 0);
      assert.equal(ship.lateralOffset, width / 2 - 0.85);
      assert.equal(ship.impactSerial, 1);
      const speed = ship.speed;
      ship.lateralOffset += 1;
      resolveWallImpact(ship, width);
      assert.equal(ship.speed, speed);
      assert.equal(ship.impactSerial, 1);
    }
  }
});

test('rear impact transfers speed to both racers and persists into the next physics tick', () => {
  const a = body('player', 100, 0, 150);
  const b = body('cpu', 102, 0, 90);
  resolveRacerCollisions([a, b], straight, 1 / 60, createCollisionState());
  assert.ok(a.physics.speed < 130);
  assert.ok(b.physics.speed > 90);
  assert.equal(a.physics.craftHits, 1);
  assert.equal(b.physics.craftHits, 1);
  assert.ok(b.physics.distance - a.physics.distance >= 2.19);
  const speed = a.physics.speed;
  stepShipPhysics(a.physics, neutral, 1 / 60, straight, 150);
  assert.ok(Math.abs(a.physics.speed - speed) < 1);
});

test('side contact respects mass, CPU/CPU collisions and separating contact has no extra impact', () => {
  const a = body('cpu-light', 100, -1, 120, 5, 0.9);
  const b = body('cpu-heavy', 100, 1, 120, -5, 1.3);
  const state = createCollisionState();
  resolveRacerCollisions([a, b], straight, 1 / 60, state);
  assert.ok(a.physics.lateralVelocity < 0);
  assert.ok(b.physics.lateralVelocity > 0);
  assert.ok(Math.abs(a.physics.lateralVelocity) > Math.abs(b.physics.lateralVelocity));
  assert.equal(a.physics.impactSerial, 1);
  resolveRacerCollisions([a, b], straight, 1 / 60, state);
  assert.equal(a.physics.impactSerial, 1);
  assert.equal(b.physics.impactSerial, 1);
});

test('swept collision catches a fast pass-through, but vertically separated craft do not collide', () => {
  const a = body('player', 104, 0, 200);
  const b = body('cpu', 100, 0, 50);
  a.physics.previousPosition.z = 96;
  resolveRacerCollisions([a, b], straight, 0.05, createCollisionState());
  assert.equal(a.physics.craftHits, 1);
  assert.ok(a.physics.distance < b.physics.distance);
  const overlap = body('overlap', 101, 0, 200);
  const slow = body('slow', 100, 0, 50);
  overlap.physics.previousPosition.z = 96;
  resolveRacerCollisions([overlap, slow], straight, 0.05, createCollisionState());
  assert.equal(overlap.physics.craftHits, 1);
  assert.ok(overlap.physics.distance < slow.physics.distance);
  const above = body('airborne', 100, 0, 150);
  above.group.position.y += 5;
  above.physics.previousPosition.copy(above.group.position);
  const below = body('ground', 100, 0, 50);
  resolveRacerCollisions([above, below], straight, 1 / 30, createCollisionState());
  assert.equal(above.physics.craftHits, 0);
});

test('CPU 30/60/120 Hz simulation stays consistent; pause/finish/reset are complete', () => {
  const snapshots = [30, 60, 120].map(fps => {
    const rival = createOpponentState(RACER_DEFINITIONS[0]);
    for (let i = 0; i < fps * 8; i++) updateOpponents([rival], straight, 1 / fps, (i + 1) / fps, true);
    return rival.distance;
  });
  assert.ok(Math.max(...snapshots) - Math.min(...snapshots) < 0.02);
  const rivals = RACER_DEFINITIONS.map(d => createOpponentState(d));
  const old = rivals[0].distance;
  updateOpponents(rivals, straight, 1, 1, false);
  assert.equal(rivals[0].distance, old);
  rivals[0].distance = 30000 - 0.1;
  updateOpponents(rivals, straight, 1 / 60, 10, true);
  assert.ok(rivals[0].finishTime <= 10 && rivals[0].finishTime > 9.98);
  assert.equal(rivals[0].distance, 30000);
  assert.equal(rivals[0].currentSpeed, 0);
  assert.equal(getPlayerPosition(rivals, 30000, 10), 2);
  resetOpponents(rivals);
  for (const rival of rivals) {
    assert.equal(rival.finishTime, null);
    assert.equal(rival.physics.boostCount, 0);
    assert.equal(rival.physics.impactSerial, 0);
    assert.equal(rival.physics.boostTimer, 0);
    assert.equal(rival.distance, rival.gridDistance);
    assert.equal(rival.currentSpeed, rival.topSpeed * 0.8);
  }
});

test('on the real Neon Causeway all CPU racers collect pads, recover from walls and finish', () => {
  const d = NEON_CAUSEWAY;
  const curve = new THREE.CatmullRomCurve3(d.centerline.map(([x, y, z]) =>
    new THREE.Vector3(x * d.horizontalScale, y, z * d.horizontalScale)), true, 'catmullrom', 0.42);
  curve.arcLengthDivisions = 1800;
  const length = curve.getLength();
  const pads = [];
  for (let distance = 50, i = 0; distance < length; distance += 150, i++) {
    pads.push({ d: distance, offset: i % 3 === 0 ? 0 : i % 3 === 1 ? -2.5 : 2.5 });
  }
  const rivals = RACER_DEFINITIONS.map(d => createOpponentState(d));
  const collisions = createCollisionState();
  for (let i = 0; i < 30 * 180; i++) {
    updateOpponents(rivals, curve, 1 / 30, (i + 1) / 30, true, { boostPads: pads });
    resolveRacerCollisions(rivals.map(r => ({ id: r.name, physics: r.physics, group: r.group, finished: r.finishTime !== null })), curve, 1 / 30, collisions);
    for (const rival of rivals) {
      if (rival.finishTime === null) resolveWallImpact(rival.physics);
      syncOpponentPose(rival, curve);
    }
  }
  assert.ok(rivals.reduce((sum, r) => sum + r.physics.wallHits, 0) > 0);
  assert.ok(rivals.reduce((sum, r) => sum + r.physics.craftHits, 0) > 0);
  for (const rival of rivals) {
    assert.ok(rival.physics.boostCount > 10, `${rival.name} never found pads`);
    assert.ok(Number.isFinite(rival.finishTime), `${rival.name} did not finish`);
    assert.ok(rival.group.position.toArray().every(Number.isFinite));
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CATCH_UP, catchUpTarget, getRacerTopSpeed, updateCatchUp } from '../src/catch-up.js';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { RACER_DEFINITIONS, createOpponentState, updateOpponents, resetOpponents } from '../src/opponents.js';
import { collectBoostPad, resolveWallImpact } from '../src/race-interactions.js';

const straight = {
  getLength: () => 20000,
  getPointAt: u => new THREE.Vector3(0, 0, u * 20000),
  getTangentAt: () => new THREE.Vector3(0, 0, 1),
};
function racer(distance, topSpeed = 133) {
  const physics = createShipPhysics(topSpeed);
  physics.distance = distance;
  return { physics, topSpeed, finished: false };
}

test('2/8-second thresholds and smooth target stay inside the agreed 0–8% range', () => {
  assert.equal(catchUpTarget(0), 0);
  assert.equal(catchUpTarget(2), 0);
  assert.equal(catchUpTarget(5), 0.04);
  assert.equal(catchUpTarget(8), 0.08);
  assert.equal(catchUpTarget(100), 0.08);
  let previous = 0;
  for (let gap = 0; gap < 10; gap += 0.01) {
    const bonus = catchUpTarget(gap);
    assert.ok(bonus >= previous && bonus <= 0.08);
    previous = bonus;
  }
});

test('player and all CPU slots receive identical help at identical gaps; leader stays unchanged', () => {
  for (let leaderIndex = 0; leaderIndex < 5; leaderIndex++) {
    const racers = Array.from({ length: 5 }, () => racer(1000));
    racers[leaderIndex].physics.distance = 1000 + 8 * 133;
    updateCatchUp(racers, 1, 60000, true);
    const bonuses = racers.filter((_, i) => i !== leaderIndex).map(r => r.physics.catchUpBonus);
    assert.ok(bonuses.every(b => b === bonuses[0] && b > 0 && b < 0.08));
    assert.equal(racers[leaderIndex].physics.catchUpBonus, 0);
    assert.equal(racers[leaderIndex].physics.speed, 133);
  }
});

test('smoothing matches at 30/60/120 Hz, fades out gradually and pauses without changing state', () => {
  const results = [30, 60, 120].map(fps => {
    const leader = racer(3000), follower = racer(1000);
    for (let i = 0; i < fps * 3; i++) updateCatchUp([leader, follower], 1 / fps, 60000, true);
    return follower.physics.catchUpBonus;
  });
  assert.ok(Math.max(...results) - Math.min(...results) < 1e-9);
  const leader = racer(3000), follower = racer(1000);
  follower.physics.catchUpBonus = results[0];
  updateCatchUp([leader, follower], 0, 60000, true);
  assert.equal(follower.physics.catchUpBonus, results[0]);
  follower.physics.distance = 3000;
  updateCatchUp([leader, follower], 1 / 60, 60000, true);
  assert.ok(follower.physics.catchUpBonus > 0 && follower.physics.catchUpBonus < results[0]);
  for (let i = 0; i < 30; i++) updateCatchUp([leader, follower], 1, 60000, false);
  assert.equal(follower.physics.catchUpBonus, 0);
});

test('gap includes laps, ignores leader boost/crash speed, and clamps finished victory laps', () => {
  const leader = racer(5000), follower = racer(5000 - 133 * 5);
  leader.physics.speed = 12;
  updateCatchUp([leader, follower], 1, 60000, true);
  assert.equal(follower.physics.catchUpGap, 5);
  const bonus = follower.physics.catchUpBonus;
  follower.physics.catchUpBonus = 0;
  leader.physics.speed = 220;
  updateCatchUp([leader, follower], 1, 60000, true);
  assert.equal(follower.physics.catchUpBonus, bonus);
  // A lapped racer must not appear close just because it has the same local progress.
  follower.physics.distance = leader.physics.distance - straight.getLength();
  updateCatchUp([leader, follower], 1, 60000, true);
  assert.ok(follower.physics.catchUpGap > 8);
  leader.finished = true;
  leader.physics.distance = 80000;
  follower.physics.distance = 59900;
  updateCatchUp([leader, follower], 1, 60000, true);
  assert.ok(follower.physics.catchUpGap < 2);
  assert.equal(leader.physics.catchUpBonus, 0);
});

test('extra speed is attainable for player and CPU through acceleration, with braking and wall loss intact', () => {
  const player = racer(0);
  const cpu = createOpponentState(RACER_DEFINITIONS[0]);
  const leader = racer(18000);
  const racers = [leader, player, cpu];
  const initial = player.physics.speed;
  updateCatchUp(racers, 1 / 60, 60000, true);
  assert.equal(player.physics.speed, initial, 'catch-up must never assign actual speed');
  for (let i = 0; i < 60 * 30; i++) {
    updateCatchUp(racers, 1 / 60, 60000, true);
    stepShipPhysics(player.physics, { steer: 0, thrust: 1 }, 1 / 60, straight, 133);
    updateOpponents([cpu], straight, 1 / 60, (i + 1) / 60, true);
  }
  assert.ok(player.physics.speed > 133 * 1.075 && player.physics.speed <= 133 * 1.08);
  assert.ok(cpu.currentSpeed > cpu.topSpeed * 1.075 && cpu.currentSpeed <= cpu.topSpeed * 1.08);
  const speed = player.physics.speed;
  stepShipPhysics(player.physics, { steer: 0, thrust: 0, brakeLeft: true, brakeRight: true }, 0.05, straight, 133);
  assert.ok(player.physics.speed < speed);
  player.physics.lateralOffset = 5;
  player.physics.lateralVelocity = 8;
  resolveWallImpact(player.physics, 10);
  assert.ok(player.physics.speed < speed * 0.8);
  resetOpponents([cpu]);
  assert.equal(cpu.physics.catchUpBonus, 0);
  assert.equal(createShipPhysics(133).catchUpBonus, 0);
});

test('physical pads combine multiplicatively with catch-up for both player and CPU', () => {
  for (const topSpeed of [133, ...RACER_DEFINITIONS.map(d => d.topSpeed)]) {
    const ship = createShipPhysics(topSpeed);
    Object.assign(ship, { catchUpBonus: CATCH_UP.maxBonus, previousDistance: 40, distance: 60 });
    assert.equal(collectBoostPad(ship, [{ d: 50, offset: 0 }], 20000, topSpeed), true);
    assert.ok(Math.abs(ship.speed - topSpeed * 1.08 * 1.3) < 1e-9);
    ship.speed = 1000;
    stepShipPhysics(ship, { steer: 0, thrust: 1 }, 1 / 60, straight, topSpeed);
    assert.ok(Math.abs(ship.speed - getRacerTopSpeed(ship, topSpeed) * 1.5) < 1e-9);
  }
});

test('CPU catch-up respects braking for nearby traffic', () => {
  const cpu = createOpponentState(RACER_DEFINITIONS[0]);
  cpu.currentLane = 0;
  cpu.currentSpeed = 130;
  cpu.physics.catchUpBonus = 0.08;
  const blocker = racer(cpu.distance + 4);
  blocker.physics.speed = 50;
  updateOpponents([cpu], straight, 1 / 60, 1 / 60, true, { player: blocker });
  assert.ok(cpu.input.brakeLeft && cpu.input.brakeRight);
  assert.equal(cpu.trafficSpeedLimit, 47);
});

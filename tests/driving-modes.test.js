import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { createTrackCurve, getTrackFrame, getRacerFrame, canFinishRace, nextBranch } from '../src/track-path.js';
import { createTrack, disposeTrackGroup } from '../src/track.js';
import { ION_FOUNDRY } from '../src/track-foundry.js';
import { LOOP_LAB } from '../src/track-labs.js';
import { CLASSIC_HANDLING, stepClassicAttitude } from '../src/classic-handling.js';
import { createClassicCamera } from '../src/classic-camera.js';
import { createCombat } from '../src/combat.js';
import { loadDrivingSettings, saveDrivingSettings, cameraProfile, readClassicGamepad } from '../src/driving-settings.js';
import { resolveWallImpact } from '../src/race-interactions.js';

const straight = createTrackCurve({ width: 100, horizontalScale: 1, magnetic: true,
  centerline: [[0,0,-2000],[0,0,-1000],[0,0,0],[0,0,1000],[0,0,2000],[2000,0,2500],[2000,0,-2500]] });
function ship(mode = 'wipeout') {
  const s = createShipPhysics(140, { handlingMode: mode });
  s.distance = 2200; s.previousTangent = getTrackFrame(straight, s.distance / straight.getLength()).tangent;
  return s;
}
function drive(s, seconds, input = {}, hz = 120) {
  for (let i = 0; i < Math.round(seconds * hz); i++) stepShipPhysics(s, input, 1 / hz, straight, 140, 100);
}

test('Swipeout remains default; classic keeps an offset and heading instead of centering', () => {
  assert.equal(createShipPhysics(140).handlingMode, 'swipeout');
  const classic = ship(), assisted = ship('swipeout');
  classic.lateralOffset = assisted.lateralOffset = 3;
  drive(classic, 1); drive(assisted, 1);
  assert.ok(Math.abs(classic.lateralOffset - 3) < 0.001);
  assert.ok(Math.abs(assisted.lateralOffset) < 0.1);
  drive(classic, 0.2, { steer: -1 });
  const heading = classic.yaw, lane = classic.lateralOffset;
  drive(classic, 0.4);
  assert.equal(classic.yawVelocity, 0);
  assert.ok(classic.yaw >= heading && classic.lateralOffset > lane);
  assert.ok(Math.abs(Math.atan2(classic.lateralVelocity * 2, classic.speed) - classic.yaw) < 0.06);
});

test('classic rail impact cannot start an uncommanded wall-to-wall oscillation, on either side or at 30/60/120 Hz', () => {
  for (const width of [7,10,22]) for (const side of [-1,1]) {
    const results=[];
    for (const hz of [30,60,120]) {
      const s=ship();
      Object.assign(s,{speed:143,lateralOffset:side*(width/2-.9),lateralVelocity:side*12,yaw:side*.4,yawVelocity:side*.8});
      stepShipPhysics(s,{},1/120,straight,143,width);
      assert.equal(s.wallHits,1);assert.ok(s.speed<100);assert.equal(s.yaw,0);assert.equal(s.yawVelocity,0);
      for(let i=0;i<6*hz;i++)stepShipPhysics(s,{thrust:1},1/hz,straight,143,width);
      assert.equal(s.wallHits,1);assert.ok(s.lateralOffset*side>width/2-1.8);
      results.push(s);
    }
    for(const s of results)assert.ok(Math.abs(s.lateralOffset-results[0].lateralOffset)<1e-7);
  }
});

test('classic contact preserves deliberate escape steering and cooldown contact stops only outward motion', () => {
  for(const side of [-1,1]) {
    const s=ship();Object.assign(s,{lateralOffset:side*5,lateralVelocity:-side*2,yaw:-side*.1,yawVelocity:-side*.3});
    resolveWallImpact(s,10);
    assert.equal(s.lateralVelocity,-side*2);assert.equal(s.yaw,-side*.1);assert.equal(s.yawVelocity,-side*.3);
    assert.equal(s.impactSerial,1);assert.ok(s.speed<140);
    const speed=s.speed;
    Object.assign(s,{lateralOffset:side*5,lateralVelocity:side*4,yaw:side*.2,yawVelocity:side*.3});
    resolveWallImpact(s,10);
    assert.equal(s.lateralVelocity,0);assert.equal(s.yaw,0);assert.equal(s.yawVelocity,0);
    assert.equal(s.speed,speed);assert.equal(s.impactSerial,1);
  }
});

test('after a classic wall hit a short steer-away followed by straightening is controllable without another hit', () => {
  for(const side of [-1,1]){
    const s=ship();Object.assign(s,{speed:143,lateralOffset:side*4.1,lateralVelocity:side*12,yaw:side*.4,yawVelocity:side*.8});
    stepShipPhysics(s,{},1/120,straight,143,10);
    for(let i=0;i<720;i++) {
      // Input-only correction: steer away briefly, then countersteer to parallel.
      const steer=i<12?side:i<28?-side:0;
      stepShipPhysics(s,{steer,thrust:1},1/120,straight,143,10);
    }
    assert.equal(s.wallHits,1);assert.ok(Math.abs(s.yaw)<.002);assert.ok(s.lateralOffset*side>0);
  }
});

test('countersteer decelerates rotation faster; analog steering and airbrakes are independent', () => {
  const released = ship(), reversed = ship();
  released.yawVelocity = reversed.yawVelocity = 1;
  stepClassicAttitude(released, {}, 0.1); stepClassicAttitude(reversed, { steer: 1 }, 0.1);
  assert.ok(reversed.yawVelocity < released.yawVelocity);
  const half = ship(); for (let i = 0; i < 120; i++) stepClassicAttitude(half, { steer: -0.5 }, 1 / 120);
  assert.ok(Math.abs(half.yawVelocity - CLASSIC_HANDLING.turnRate * 0.5) < 1e-8);
  const left = ship(), right = ship(), both = ship();
  drive(left, 0.35, { brakeLeft: 0.5 }); drive(right, 0.35, { brakeRight: 0.5 }); drive(both, 0.35, { brakeLeft: 1, brakeRight: 1 });
  assert.ok(left.yaw > 0 && right.yaw < 0); assert.ok(Math.abs(left.yaw + right.yaw) < 1e-7);
  assert.ok(Math.abs(both.yaw) < 1e-7); assert.ok(both.speed < left.speed);
  assert.equal(left.brakeLeft, 0.5); assert.equal(left.brakeRight, 0);
});

test('classic dynamics agree at 30/60/120 Hz, pause freezes, recovery resets transient state', () => {
  const states = [30, 60, 120].map(hz => {
    const s = ship(); drive(s, 0.3, { steer: -0.6, thrust: 1 }, hz);
    drive(s, 0.2, { steer: 0.6, brakeRight: 0.35 }, hz); drive(s, 0.5, {}, hz);
    return s;
  });
  for (const s of states) for (const key of ['distance', 'lateralOffset', 'lateralVelocity', 'speed', 'yaw', 'yawVelocity', 'roll'])
    assert.ok(Math.abs(s[key] - states[0][key]) < 1e-7, key);
  const s = states[0], snapshot = JSON.stringify(s);
  stepShipPhysics(s, { steer: 1, thrust: 1 }, 0, straight, 140, 100);
  assert.equal(JSON.stringify(s), snapshot);
  const curve = createTrackCurve(ION_FOUNDRY); Object.assign(s, createShipPhysics(40, { handlingMode: 'wipeout' }));
  s.distance = ION_FOUNDRY.gaps[0].start * curve.getLength() - 1; s.classicRollVelocity = 1;
  for (let i = 0; i < 120 * 8 && !s.recoveries; i++) stepShipPhysics(s, {}, 1 / 120, curve, 140, 22);
  assert.equal(s.recoveries, 1); assert.equal(s.yaw, 0); assert.equal(s.classicRollVelocity, 0); assert.equal(s.handlingMode, 'wipeout');
});

test('classic player launches and lands both Foundry gaps at normal and boosted speed', () => {
  const curve = createTrackCurve(ION_FOUNDRY);
  for (const gap of ION_FOUNDRY.gaps) for (const speed of [100, 140, 210]) {
    const s = createShipPhysics(speed, { handlingMode: 'wipeout' }); s.distance = gap.start * curve.getLength() - 1;
    for (let i = 0; i < 120 * 8 && !s.landings && !s.recoveries; i++) stepShipPhysics(s, {}, 1 / 120, curve, 220, 22);
    assert.equal(s.landings, 1); assert.equal(s.recoveries, 0);
    assert.ok(Math.abs(s.yaw - Math.atan2(s.lateralVelocity * 2, s.speed)) < 0.01);
  }
});

test('classic input-driven lap retains gates, branches, walls, gaps and reset integration', () => {
  const { curve, group } = createTrack(ION_FOUNDRY), length = curve.getLength();
  const s = createShipPhysics(140, { handlingMode: 'wipeout' });
  // A deliberately simple test driver supplies inputs only. This verifies
  // completion with consequences, not optimal lines or human handling quality.
  for (let i = 0; i < 120 * 300 && !canFinishRace(curve, s); i++) {
    const f = getRacerFrame(curve, s), ahead = getRacerFrame(curve, s, (s.distance + 6) / length);
    const curvature = Math.atan2(ahead.tangent.dot(f.right), ahead.tangent.dot(f.tangent)) / 6;
    const fork = nextBranch(curve, s.distance);
    const lane = fork && fork.distance - s.distance < 200 && !s.route ? 5 : 0;
    const targetYaw = Math.atan2((lane - s.lateralOffset) * 2 - s.lateralVelocity * 1.8, s.speed);
    const steer = -THREE.MathUtils.clamp((curvature * s.speed + (targetYaw - s.yaw) * 8) / CLASSIC_HANDLING.turnRate, -1, 1);
    const brake = s.speed > Math.max(55, Math.min(140, 0.85 / Math.max(0.001, Math.abs(curvature)))) + 8;
    stepShipPhysics(s, { steer, thrust: brake ? 0 : 1, brakeLeft: brake, brakeRight: brake }, 1 / 120, curve, 140, 22);
  }
  assert.ok(canFinishRace(curve, s)); assert.equal(s.completedLaps, 3); assert.equal(s.landings, 6);
  assert.equal(s.recoveries, 0); assert.ok(s.wallHits > 0); assert.ok(s.routeEntries > 0);
  assert.equal(s.routeEntries, s.routeMerges); disposeTrackGroup(group);
});

test('classic chase/cockpit follow heading, exclude hull roll from chase, and stay local through loops', () => {
  const curve = createTrackCurve(LOOP_LAB), camera = new THREE.PerspectiveCamera(), follow = createClassicCamera(), s = ship();
  for (let d = 0; d < curve.getLength(); d += 2) {
    const frame = getTrackFrame(curve, d / curve.getLength()), position = frame.center.clone().addScaledVector(frame.normal, 0.62);
    s.yaw = 0.1; s.roll = 0.25;
    follow.update(camera, position, frame, s, 1 / 60);
    const expected = frame.tangent.clone().multiplyScalar(Math.cos(s.yaw)).addScaledVector(frame.right, Math.sin(s.yaw));
    assert.ok(camera.getWorldDirection(new THREE.Vector3()).dot(expected) > 0.99999);
    assert.ok(camera.up.dot(frame.normal) > 0.99999);
    assert.ok(camera.position.distanceTo(position) < 9);
    assert.ok(camera.position.clone().sub(frame.center).dot(frame.normal) >= 1);
  }
  const frame = getTrackFrame(curve, 0.2), position = frame.center.clone();
  follow.update(camera, position, frame, s, 0, 'internal', 2);
  assert.ok(camera.position.distanceTo(position) < 1);
  follow.update(camera, position, frame, s, 0, 'external', 3);
  assert.ok(camera.position.distanceTo(position) > 6);
  camera.updateMatrixWorld();
  follow.update(camera, position, frame, s, 0, 'external', 3); camera.updateMatrixWorld();
  const frozen = camera.position.clone(); follow.update(camera, position, frame, s, 0, 'external', 3);
  assert.ok(camera.position.distanceTo(frozen) < 1e-8);
  const results = [30, 60, 120].map(hz => {
    const cam = new THREE.PerspectiveCamera(), c = createClassicCamera();
    for (let i = 0; i < hz * 4; i++) c.update(cam, position, frame, s, 1 / hz);
    return cam.position;
  });
  for (const p of results) assert.ok(p.distanceTo(results[0]) < 1e-8);
});

test('preferences are independent and safe with malformed/unavailable storage; R2 never accelerates classic', () => {
  const store = { value: null, getItem() { return this.value; }, setItem(k, value) { this.value = value; } };
  assert.deepEqual(loadDrivingSettings(store), { handling: 'swipeout', camera: 'auto', assist: 1 });
  assert.ok(saveDrivingSettings(store, { handling: 'wipeout', camera: 'swipeout', assist: 0.5 }));
  assert.equal(cameraProfile(loadDrivingSettings(store)), 'swipeout');
  assert.equal(cameraProfile({ handling: 'wipeout', camera: 'auto' }), 'wipeout');
  store.value = '{broken'; assert.equal(loadDrivingSettings(store).handling, 'swipeout');
  assert.equal(saveDrivingSettings({ setItem() { throw Error('quota'); } }, {}), false);
  const gp = { axes: [0.56, 0.8], buttons: Array.from({ length: 16 }, () => ({ value: 0 })) };
  gp.buttons[7].value = 0.65;
  const input = readClassicGamepad(gp);
  assert.equal(input.thrust, 0); assert.equal(input.brakeRight, 0.65); assert.ok(input.steer > 0 && input.steer < 1);
  gp.buttons[0].value = 1; assert.equal(readClassicGamepad(gp).thrust, 1);
  assert.deepEqual(readClassicGamepad(null), { steer: 0, pitch: 0, thrust: 0, brakeLeft: 0, brakeRight: 0 });
});

test('classic weapons follow the nose while Swipeout keeps its existing track-forward aim', () => {
  for (const mode of ['wipeout', 'swipeout']) {
    const physics = ship(mode); physics.yaw = 0.3;
    const pose = stepShipPhysics(physics, {}, 0, straight, 140, 100);
    const group = new THREE.Group(); group.position.copy(pose.position); group.quaternion.copy(pose.orientation);
    const racer = { id: 'player', player: true, physics, group }, combat = createCombat();
    combat.reset(true, [racer]); combat.step(1 / 120, [racer], straight, { fire: true });
    assert.equal(combat.projectiles.length, 1);
    const expected = mode === 'wipeout' ? new THREE.Vector3(0, 0, 1).applyQuaternion(pose.orientation) : pose.frame.tangent;
    assert.ok(combat.projectiles[0].velocity.clone().normalize().dot(expected) > 0.999999);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRaceIntro, INTRO_DURATION } from '../src/race-intro.js';

test('intro restores chase pose, converges without a cut and ends once at 30/60/120 Hz', () => {
  for (const hz of [30, 60, 120]) {
    const intro = createRaceIntro();
    const camera = new THREE.PerspectiveCamera();
    const frame = { right: new THREE.Vector3(1, 0, 0), tangent: new THREE.Vector3(0, 0, 1), normal: new THREE.Vector3(0, 1, 0) };
    const ship = new THREE.Vector3(100, 20, 30);
    const destination = ship.clone().add(new THREE.Vector3(0, 3, -7));
    camera.position.copy(destination); camera.lookAt(ship);
    const orientation = camera.quaternion.clone();
    intro.start();
    let done = false, frames = 0, previous = camera.position.clone();
    while (!done && frames < hz * 4) {
      previous.copy(camera.position);
      intro.restore(camera);
      assert.ok(camera.position.distanceTo(destination) < 1e-8);
      assert.ok(camera.quaternion.angleTo(orientation) < 1e-7);
      done = intro.update(camera, ship, frame, 1 / hz);
      frames++;
    }
    assert.ok(done);
    assert.ok(Math.abs(frames / hz - INTRO_DURATION) <= 1 / hz + 1e-8);
    assert.ok(camera.position.distanceTo(destination) < 1e-8);
    assert.ok(previous.distanceTo(destination) < 0.02);
    assert.equal(intro.update(camera, ship, frame, 1), false);
  }
});

test('skip and reduced motion end at supplied chase pose; restart clears skip', () => {
  const intro = createRaceIntro(), camera = new THREE.PerspectiveCamera();
  const frame = { right: new THREE.Vector3(1, 0, 0), tangent: new THREE.Vector3(0, 0, 1), normal: new THREE.Vector3(0, -1, 0) };
  intro.start();
  intro.update(camera, new THREE.Vector3(), frame, 0.5);
  intro.restore(camera); intro.skip();
  assert.equal(intro.update(camera, new THREE.Vector3(), frame, 0), true);
  intro.start();
  assert.equal(intro.update(camera, new THREE.Vector3(), frame, 0), false);
  assert.equal(intro.elapsed, 0);
  intro.restore(camera); intro.start(true);
  assert.equal(intro.update(camera, new THREE.Vector3(), frame, 0), true);
});

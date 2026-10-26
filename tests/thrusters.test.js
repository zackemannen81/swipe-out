import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ThrusterSystem } from '../src/thrusters.js';

function setup(count = 1) {
  const scene = new THREE.Scene();
  const system = new ThrusterSystem(scene, { random: () => 0.1 });
  const emitters = Array.from({ length: count }, () => system.addCraft(new THREE.Group()));
  const camera = new THREE.PerspectiveCamera(46, 1.6, 0.1, 512);
  camera.position.set(3, 2, -5);
  return { system, emitters, camera, scene };
}

function step(env, dt, throttle = 1, active = true, boost = false) {
  for (const emitter of env.emitters) env.system.updateCraft(emitter, dt, throttle, boost, active);
  env.system.update(dt, env.camera, 900);
}

function liveSamples(nozzle) {
  return nozzle.samples.filter(s => s.age < s.lifetime).sort((a, b) => a.age - b.age);
}

test('30/60/120 Hz produce the same world-space wake and evenly staggered ages', () => {
  const snapshots = [30, 60, 120].map(fps => {
    const env = setup();
    for (let i = 0; i < fps * 2; i++) {
      env.emitters[0].craft.position.z = (i + 1) / fps * 150;
      step(env, 1 / fps);
    }
    const samples = liveSamples(env.emitters[0].nozzles[0]);
    for (let i = 1; i < samples.length; i++) {
      assert.ok(Math.abs(samples[i].age - samples[i - 1].age - 1 / 240) < 1e-8);
      const gap = samples[i - 1].position.z - samples[i].position.z;
      assert.ok(Math.abs(gap - 150 / 240) < 1e-7, `uneven birth spacing: ${gap}`);
    }
    const result = samples.map(s => s.position.z + s.velocity.z * s.age);
    env.system.dispose();
    return result;
  });
  for (const result of snapshots.slice(1)) {
    assert.equal(result.length, snapshots[0].length);
    result.forEach((z, i) => assert.ok(Math.abs(z - snapshots[0][i]) < 1e-7));
  }
});

test('idle stays visible; throttle and boost grow and decay smoothly', () => {
  const env = setup();
  for (let i = 0; i < 60; i++) step(env, 1 / 60, 0);
  const emitter = env.emitters[0];
  const idle = emitter.power;
  assert.ok(idle > 0);
  assert.ok(emitter.nozzles[0].geometry.drawRange.count > 0);
  step(env, 1 / 60, 1);
  assert.ok(emitter.power > idle && emitter.power < 1);
  for (let i = 0; i < 60; i++) step(env, 1 / 60);
  assert.ok(emitter.power > 0.99);
  step(env, 1 / 60, 1, true, true);
  assert.ok(emitter.power > 1 && emitter.power < 1.25);
  const boosted = emitter.power;
  step(env, 1 / 60, 0);
  assert.ok(emitter.power < boosted && emitter.power > idle);
  env.system.dispose();
});

test('five ships fade after shutoff, reset without ghost trails, and release resources', () => {
  const env = setup(5);
  for (let i = 0; i < 60; i++) {
    env.emitters.forEach((e, index) => e.craft.position.set(index * 4, 0, i * 2));
    step(env, 1 / 60);
  }
  for (const emitter of env.emitters) for (const nozzle of emitter.nozzles) {
    assert.ok(nozzle.geometry.drawRange.count > 0);
  }
  step(env, 1 / 60, 0, false);
  assert.ok(env.emitters[0].nozzles[0].geometry.drawRange.count > 0, 'existing wake should linger');
  for (let i = 0; i < 60; i++) step(env, 1 / 60, 0, false);
  assert.equal(env.system.sparkGeometry.drawRange.count, 0);
  for (const e of env.emitters) assert.equal(e.nozzles[0].geometry.drawRange.count, 0);
  step(env, 1 / 60);
  env.system.reset();
  assert.equal(env.system.sparkGeometry.drawRange.count, 0);
  for (const e of env.emitters) assert.equal(e.nozzles[0].count, 0);
  env.system.dispose();
  assert.equal(env.scene.children.length, 0);
});

test('turns, teleports, camera along exhaust, and long runs keep geometry finite and bounded', () => {
  const env = setup(5);
  const resources = env.scene.children.map(mesh => mesh.geometry);
  for (let i = 0; i < 600; i++) {
    env.emitters.forEach((e, n) => {
      const t = i / 30;
      e.craft.position.set(Math.sin(t) * 30, n, Math.cos(t) * 30);
      e.craft.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t);
    });
    step(env, 1 / 30, (i % 100) / 100);
  }
  const emitter = env.emitters[0];
  emitter.craft.position.set(1000, 0, 0);
  env.camera.position.set(1000, 0, -10);
  step(env, 1 / 30);
  assert.ok(emitter.nozzles[0].count <= 8, 'teleport must discard old history');
  for (const sample of liveSamples(emitter.nozzles[0])) assert.ok(sample.position.x > 990);
  env.scene.children.forEach((mesh, i) => {
    assert.equal(mesh.geometry, resources[i]);
    assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite));
  });
  assert.equal(env.system.sparks.length, 2048);
  assert.equal(emitter.nozzles[0].samples.length, 128);
  env.system.dispose();
});

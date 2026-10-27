import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import * as THREE from 'three';
import { ION_FOUNDRY as track, FOUNDRY_SECTORS } from '../src/track-foundry.js';
import { normalizeTrack, parseTrack, serializeTrack } from '../src/track-format.js';
import { createTrackCurve, getTrackFrame, hasSurface, canFinishRace } from '../src/track-path.js';
import { createTrack, spawnTrackObjects, disposeTrackGroup } from '../src/track.js';
import { createShipPhysics, stepShipPhysics } from '../src/ship-physics.js';
import { createOpponentState, RACER_DEFINITIONS, updateOpponents } from '../src/opponents.js';
import { collectBoostPad, createCollisionState, resolveRacerCollisions } from '../src/race-interactions.js';

test('Foundry is portable v3 content with compact local delivery assets and a useful shortcut', () => {
  assert.deepEqual(parseTrack(serializeTrack(track)), normalizeTrack(track));
  const curve = createTrackCurve(track), branch = curve.track.branches[0];
  assert.equal(track.gaps.length, 2);
  assert.ok(branch.length < branch.span * 0.8 && branch.width < track.width / 2);
  assert.ok(getTrackFrame(curve, FOUNDRY_SECTORS.inverted).normal.y < -0.99);
  assert.ok(track.objects.length > 200 && track.objects.length < 800);
  const urls = new Set(track.objects.map(o => o.texture).filter(Boolean));
  let total = 0;
  for (const url of urls) {
    assert.match(url, /^\/images\/textures\/optimized\/.*\.webp$/);
    total += statSync(new URL(`../public${url}`, import.meta.url)).size;
  }
  assert.ok(total < 1024 * 1024);
  const manifest = JSON.parse(readFileSync(new URL('../public/images/textures/optimized/manifest.json', import.meta.url)));
  assert.equal(manifest.length, 12);
  for (const asset of manifest) assert.deepEqual(asset.size, [512, 512]);
});

test('both jumps land from normal race to boosted speed, and a slow miss recovers safely', () => {
  const curve = createTrackCurve(track), length = curve.getLength();
  for (const gap of track.gaps) for (const hz of [30, 120]) for (const speed of [40, 100, 140, 210]) {
    const ship = createShipPhysics(speed); ship.distance = gap.start * length - 2;
    for (let i = 0; i < hz * 8 && !ship.landings && !ship.recoveries; i++)
      stepShipPhysics(ship, { steer: 0, thrust: 0 }, 1 / hz, curve, 220, track.width);
    assert.equal(ship.landings, speed === 40 ? 0 : 1, `${gap.start}, ${speed}, ${hz}`);
    assert.equal(ship.recoveries, speed === 40 ? 1 : 0);
    if (speed === 40) assert.ok(ship.distance < gap.start * length);
  }
});

test('player physics completes main and shortcut races with all six landings and ordered laps', () => {
  const { curve, boostPads, group } = createTrack(track), length = curve.getLength();
  for (const shortcut of [false, true]) {
    const ship = createShipPhysics(100); ship.assistLevel = 0;
    for (let i = 0; i < 120 * 180 && !canFinishRace(curve, ship); i++) {
      const u = (ship.distance % length) / length, b = curve.track.branches[0];
      // Set up the chosen approach lane. All travel/flight/gates use player physics.
      if (!ship.flight && !ship.route && u > b.start - 0.004 && u < b.start) ship.lateralOffset = shortcut ? 5 : -4;
      if (ship.route) ship.lateralOffset *= 0.95;
      const pose = stepShipPhysics(ship, { steer: 0, thrust: 1 }, 1 / 120, curve, 140, track.width);
      assert.ok(pose.position.toArray().every(Number.isFinite));
      collectBoostPad(ship, boostPads, length, 140);
    }
    assert.ok(canFinishRace(curve, ship));
    assert.equal(ship.completedLaps, 3); assert.equal(ship.landings, 6); assert.equal(ship.recoveries, 0);
    assert.equal(ship.routeEntries, shortcut ? 3 : 0); assert.equal(ship.routeMerges, ship.routeEntries);
  }
  disposeTrackGroup(group);
});

test('all four CPU profiles finish Foundry using both paths, real boosts and contacts', () => {
  const { curve, boostPads, group } = createTrack(track);
  const rivals = RACER_DEFINITIONS.map(d => createOpponentState(d)), collisions = createCollisionState();
  for (let i = 0; i < 120 * 200; i++) {
    updateOpponents(rivals, curve, 1 / 120, (i + 1) / 120, true, { boostPads, trackWidth: track.width });
    resolveRacerCollisions(rivals.map(o => ({ id: o.name, physics: o.physics, group: o.group, finished: o.finishTime !== null })), curve, 1 / 120, collisions);
    if (rivals.every(o => o.finishTime !== null)) break;
  }
  for (const o of rivals) {
    assert.ok(o.finishTime !== null, o.name); assert.equal(o.physics.completedLaps, 3);
    assert.equal(o.physics.landings, 6); assert.equal(o.physics.recoveries, 0);
    assert.ok(o.physics.routeEntries > 0 && o.physics.routeEntries < 3);
    assert.equal(o.physics.routeMerges, o.physics.routeEntries); assert.ok(o.physics.boostCount > 0);
  }
  disposeTrackGroup(group);
});

test('scenery clears the entire racing deck and camera-height envelope on both paths', () => {
  const curve = createTrackCurve(track), length = curve.getLength();
  // Conservative oriented boxes also enclose the cylinders, spheres and cones.
  const bounds = track.objects.map(o => ({ id: o.id, inverse: new THREE.Matrix4().compose(
    new THREE.Vector3(...o.position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rotation.map(THREE.MathUtils.degToRad))),
    new THREE.Vector3(...o.scale)).invert() }));
  function clear(frame, width) {
    for (const lane of [-width / 2 + 1, 0, width / 2 - 1]) for (const height of [0.8, 3.5]) {
      const p = frame.center.clone().addScaledVector(frame.right, lane).addScaledVector(frame.normal, height);
      for (const { id, inverse } of bounds) {
        const q = p.clone().applyMatrix4(inverse);
        assert.ok(Math.abs(q.x) >= 0.52 || Math.abs(q.y) >= 0.52 || Math.abs(q.z) >= 0.52, id);
      }
    }
  }
  for (let d = 0; d < length; d += 4) if (hasSurface(curve, d)) clear(getTrackFrame(curve, d / length), track.width);
  for (const b of curve.track.branches) for (let d = 0; d < b.length; d += 4) clear(b.frame(d / b.length), b.widthAt(d / b.length));
});

test('scenery shares static GPU assets, isolates scrolling and disposes once on rebuild', () => {
  const original = THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load = () => new THREE.Texture();
  try {
    const scene = new THREE.Scene(); spawnTrackObjects(scene, track);
    const group = scene.getObjectByName('customTrackObjects');
    assert.equal(new Set(group.children.map(m => m.geometry)).size, 4);
    assert.equal(new Set(group.children.map(m => m.material.map).filter(Boolean)).size,
      new Set(track.objects.map(o => o.texture).filter(Boolean)).size);
    const disposals = new Map();
    for (const resource of new Set(group.children.flatMap(m => [m.geometry, m.material, m.material.map]).filter(Boolean))) {
      disposals.set(resource, 0); resource.addEventListener('dispose', () => disposals.set(resource, disposals.get(resource) + 1));
    }
    const source = track.objects.find(o => o.texture);
    spawnTrackObjects(scene, { ...track, objects: [source, source, { ...source, animType: 'scroll-x' }, { ...source, animType: 'scroll-x' }] });
    assert.ok([...disposals.values()].every(count => count === 1));
    const [a, b, c, d] = scene.getObjectByName('customTrackObjects').children;
    assert.equal(a.material, b.material); assert.notEqual(a.material.map, c.material.map); assert.notEqual(c.material.map, d.material.map);
    c.material.map.offset.x = 0.5; assert.equal(a.material.map.offset.x, 0); assert.equal(d.material.map.offset.x, 0);
    disposeTrackGroup(scene.getObjectByName('customTrackObjects'));
  } finally { THREE.TextureLoader.prototype.load = original; }
});

import * as THREE from 'three';
import { createTrackCurve, getTrackFrame, progressAtControlPoint, hasSurface } from './track-path.js';

// Authored control points and primitive transforms become ordinary editable v3
// track data. Helpers only build the initial definition, never a saved draft.
const points = [], anchors = {};
function point(name, x, y, z, bank = 0) {
  if (name) anchors[name] = points.length;
  points.push([x, y, z, bank]);
}
point('start', 0, 20, -300);
point(null, 0, 20, -150);
point('launchApproach', 0, 20, 0);
point('jump1', 0, 27, 100);
point(null, 0, 30, 140);
point('land1', 0, 20, 200);
point(null, 0, 20, 400);
point('bank', 40, 22, 600, -12);
point(null, 180, 35, 720, -30);
point(null, 360, 45, 680, -30);
point(null, 440, 45, 530, -12);
point('fork', 440, 45, 420);
point(null, 620, 45, 310, 25);
point(null, 710, 45, 180, -25);
point(null, 620, 45, 40, -25);
point('merge', 440, 45, -60);
point('technical', 440, 45, -180);
point(null, 390, 40, -290, -22);
point(null, 470, 35, -400, 28);
point(null, 380, 30, -510, -28);
point(null, 440, 25, -620, 18);
point('jump2Approach', 440, 20, -740);
point('jump2', 440, 27, -840);
point(null, 440, 30, -880);
point('land2', 440, 20, -940);
point(null, 440, 20, -1140);
point(null, 440, 20, -1340);
point(null, 360, 20, -1460, -25);
point(null, 180, 20, -1500, -30);
point(null, 0, 20, -1410, -25);
point(null, 0, 20, -1180);
point('loopApproach', 0, 20, -980);
point(null, 0, 20, -900);
point(null, 0, 20, -875);
for (let i = 0; i <= 24; i++) {
  const t = i / 24, a = t * Math.PI * 2;
  point(i === 0 ? 'loop' : i === 12 ? 'inverted' : null,
    45 * t * t * (3 - 2 * t), 20 + 70 * (1 - Math.cos(a)), -850 + 70 * Math.sin(a));
}
point(null, 45, 20, -825);
point(null, 45, 20, -800);
point(null, 45, 20, -740);
point(null, 0, 20, -610, 12);
point(null, 0, 20, -450);

export const ION_FOUNDRY = {
  id: 'ion-foundry', name: 'Ion Foundry', width: 22, horizontalScale: 1,
  magnetic: true, centerline: points, objects: [], gaps: [], branches: [],
};
const baseCurve = createTrackCurve(ION_FOUNDRY);
export const FOUNDRY_SECTORS = Object.fromEntries(Object.entries(anchors)
  .map(([name, index]) => [name, progressAtControlPoint(baseCurve, index)]));
// Parallel transport accumulates roll on a non-planar circuit. Compensate that
// at the authored anchors so "flat" launches really are level in world space,
// and the requested corner bank is measured from the natural local horizon.
const unbanked = createTrackCurve({ ...ION_FOUNDRY, centerline: points.map(p => p.slice(0, 3)) });
for (let i = 0; i < points.length; i++) {
  const f = getTrackFrame(unbanked, progressAtControlPoint(unbanked, i));
  const a = (i - anchors.loop) / 24 * Math.PI * 2;
  const up = i >= anchors.loop && i <= anchors.loop + 24
    ? new THREE.Vector3(0, Math.cos(a), -Math.sin(a)) : new THREE.Vector3(0, 1, 0);
  up.addScaledVector(f.tangent, -up.dot(f.tangent)).normalize();
  const correction = Math.atan2(f.tangent.dot(f.normal.clone().cross(up)), f.normal.dot(up));
  points[i][3] += THREE.MathUtils.radToDeg(correction);
}
ION_FOUNDRY.gaps = [1, 2].map(i => ({ start: FOUNDRY_SECTORS[`jump${i}`], end: FOUNDRY_SECTORS[`land${i}`] }));
ION_FOUNDRY.branches = [{
  id: 'needle', name: 'Needle Skyway', start: FOUNDRY_SECTORS.fork,
  end: FOUNDRY_SECTORS.merge, side: 1, width: 8,
  points: [[390, 63, 310], [375, 80, 190], [395, 63, 70]],
}];

const curve = createTrackCurve(ION_FOUNDRY), length = curve.getLength();
const texture = name => `/images/textures/optimized/${name}.webp`;
const cyan = 0x45dcef, amber = 0xffa53c, pink = 0xff547f;
function object(id, type, position, scale, surface, rotation = [0, 0, 0], neon) {
  ION_FOUNDRY.objects.push({ id, type, position, scale, rotation,
    ...(typeof surface === 'string' ? { texture: texture(surface) } : { color: surface }),
    ...(neon !== undefined ? { emissive: neon } : {}), animType: 'none', opacity: 1 });
}
const box = (id, p, s, surface, r, neon) => object(id, 'box', p, s, surface, r, neon);
function rotation(frame) {
  const e = new THREE.Euler().setFromQuaternion(frame.rotation);
  return [e.x, e.y, e.z].map(value => THREE.MathUtils.radToDeg(value) || 0);
}
function at(frame, x, y, z = 0) {
  return frame.center.clone().addScaledVector(frame.right, x)
    .addScaledVector(frame.normal, y).addScaledVector(frame.tangent, z).toArray();
}
function gantry(name, progress, sign, color = cyan) {
  const f = getTrackFrame(curve, progress), r = rotation(f);
  for (const side of [-1, 1]) {
    box(`${name}-leg-${side}`, at(f, side * 17, 7), [2, 22, 3], 'tex005', r);
    box(`${name}-light-${side}`, at(f, side * 15.8, 8, -1.6), [0.3, 12, 0.25], color, r, color);
  }
  box(`${name}-beam`, at(f, 0, 18), [38, 3, 4], 'tex001', r);
  // Box front is +Z: turn toward approaching racers so lettering is readable.
  const face = f.rotation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
  box(`${name}-sign`, at(f, 0, 14.5, -2.1), [28, 7, 0.15], `sign-${sign}`, rotation({ rotation: face }));
}

gantry('district', 90 / length, 'foundry');
gantry('jump-a', FOUNDRY_SECTORS.jump1 - 70 / length, 'jump', amber);
gantry('needle', FOUNDRY_SECTORS.fork - 100 / length, 'shortcut', amber);
gantry('switchback', FOUNDRY_SECTORS.technical - 50 / length, 'technical', pink);
gantry('jump-b', FOUNDRY_SECTORS.jump2 - 80 / length, 'jump', amber);
gantry('core', FOUNDRY_SECTORS.loopApproach, 'loop');

// Launch district: layered tiled platforms, container stacks and bright portals.
for (let row = 0; row < 8; row++) {
  const z = -360 + row * 56;
  for (const side of [-1, 1]) {
    const x = side * (48 + (row % 2) * 6), height = 32 + (row % 3) * 14;
    box(`district-plinth-${row}-${side}`, [side * 54, -2, z], [64, 12, 52], 'tex001');
    box(`district-block-${row}-${side}`, [x, height / 2 + 4, z], [30, height, 38], row % 2 ? 'tex007' : 'tex005');
    box(`district-crown-${row}-${side}`, [x, height + 5, z], [32, 2, 40], 'tex009');
    for (let level = 0; level < 3; level++)
      box(`district-band-${row}-${side}-${level}`, [x - side * 15.2, 15 + level * 10, z], [0.4, 0.55, 32], cyan, undefined, cyan);
    box(`district-screen-${row}-${side}`, [x - side * 15.3, 24, z], [0.4, 12, 19], 'tex004');
  }
}

// Cooling shafts lie well below the missing deck: never a fake bridge/floor.
for (const [i, z, x] of [[1, 150, 0], [2, -890, 440]]) {
  box(`shaft-${i}`, [x, -42, z], [135, 4, 145], 'tex011');
  for (const side of [-1, 1]) {
    box(`shaft-wall-${i}-${side}`, [x + side * 65, -4, z], [12, 80, 150], 'tex001');
    box(`shaft-rim-${i}-${side}`, [x + side * 58, 36, z], [2, 2, 150], amber, undefined, amber);
    object(`coolant-${i}-${side}`, 'cylinder', [x + side * 95, 22, z], [34, 100, 34], 'tex007');
    object(`coolant-ring-${i}-${side}`, 'cylinder', [x + side * 95, 57, z], [36, 3, 36], cyan, undefined, cyan);
    object(`coolant-cap-${i}-${side}`, 'cone', [x + side * 95, 80, z], [35, 16, 35], 'tex005');
  }
}

// Roadside outriggers follow the authored frame, including banked corners.
// Keep the loop and fork mouths clear; static positions remain individually editable.
for (let d = 660, n = 0; d < length - 700; d += 64, n++) {
  const u = d / length;
  if (u >= FOUNDRY_SECTORS.loopApproach || !hasSurface(curve, d, 55) || curve.track.branches.some(b => Math.abs(u - b.start) * length < 100 || Math.abs(u - b.end) * length < 80)) continue;
  const f = getTrackFrame(curve, u), r = rotation(f);
  for (const side of [-1, 1]) {
    box(`outrigger-${n}-${side}`, at(f, side * 25, -5), [17, 8, 24], 'tex001', r);
    box(`edge-panel-${n}-${side}`, at(f, side * 31, 5), [3, 16, 20], n % 3 ? 'tex005' : 'tex009', r);
    box(`edge-light-${n}-${side}`, at(f, side * 28.9, 7), [0.5, 9, 1], u > FOUNDRY_SECTORS.technical && u < FOUNDRY_SECTORS.jump2 ? pink : cyan, r,
      u > FOUNDRY_SECTORS.technical && u < FOUNDRY_SECTORS.jump2 ? pink : cyan);
  }
}

// Reactor islands inside the broad turn / detour, visible from both routes.
for (const [index, x, z, radius, height] of [[0, 170, 510, 85, 90], [1, 545, 185, 100, 125]]) {
  object(`reactor-base-${index}`, 'cylinder', [x, 0, z], [radius + 30, 18, radius + 30], 'tex001');
  object(`reactor-${index}`, 'cylinder', [x, height / 2, z], [radius, height, radius], 'tex007');
  object(`reactor-cap-${index}`, 'cone', [x, height + 12, z], [radius + 5, 24, radius + 5], 'tex005');
  for (let ring = 0; ring < 4; ring++)
    object(`reactor-band-${index}-${ring}`, 'cylinder', [x, 10 + ring * height / 4, z], [radius + 2, 2, radius + 2], cyan, undefined, cyan);
  object(`reactor-heart-${index}`, 'sphere', [x, height + 31, z], [24, 24, 24], 'tex003');
}

// Narrow high route has its own amber guides and support towers.
const branch = curve.track.branches[0];
for (let i = 1; i < 6; i++) {
  const f = branch.frame(i / 6);
  object(`skyway-pier-${i}`, 'cylinder', [f.center.x, f.center.y / 2 - 7, f.center.z], [7, f.center.y - 8, 7], 'tex005');
  box(`skyway-cap-${i}`, at(f, 0, -3), [14, 3, 10], 'tex009', rotation(f));
  for (const side of [-1, 1]) box(`skyway-guide-${i}-${side}`, at(f, side * 8, 3), [0.7, 5, 0.7], amber, rotation(f), amber);
}

// Switchback machine halls frame, rather than block, the alternating bends.
for (let i = 0; i < 5; i++) {
  const z = -220 - i * 92, x = i % 2 ? 530 : 310;
  box(`machine-hall-${i}`, [x, 34, z], [46, 68, 62], 'tex005');
  box(`machine-roof-${i}`, [x, 70, z], [50, 4, 66], 'tex009');
  box(`machine-neon-${i}`, [x, 74, z], [42, 2, 54], pink, undefined, pink);
  object(`machine-vent-${i}`, 'cylinder', [x, 86, z], [20, 24, 20], 'tex001');
}

// The loop's free-standing polygon rings are assembled entirely from boxes.
// They surround the road in side view and remain outside its swept racing space.
for (const x of [-35, 80]) {
  for (let i = 0; i < 20; i++) {
    const angle = (i + 0.5) / 20 * Math.PI * 2;
    box(`loop-ring-${x}-${i}`, [x, 90 - 98 * Math.cos(angle), -850 + 98 * Math.sin(angle)],
      [7, 5, 32], i % 5 === 0 ? 'tex004' : 'tex005', [THREE.MathUtils.radToDeg(angle), 0, 0]);
    box(`loop-strip-${x}-${i}`, [x + (x < 0 ? 4 : -4), 90 - 98 * Math.cos(angle), -850 + 98 * Math.sin(angle)],
      [0.6, 1, 29], cyan, [THREE.MathUtils.radToDeg(angle), 0, 0], cyan);
  }
  box(`loop-foot-${x}`, [x, -17, -850], [25, 14, 90], 'tex001');
}
box('core-foundation', [23, -29, -850], [180, 10, 280], 'tex006');
object('core-axle', 'cylinder', [23, 90, -850], [42, 155, 42], 'tex004', [0, 0, 90]);
for (const x of [-55, 100]) {
  object(`core-flange-${x}`, 'cylinder', [x, 90, -850], [56, 6, 56], 'tex005', [0, 0, 90]);
  object(`core-cap-${x}`, 'sphere', [x, 90, -850], [10, 36, 36], 'tex003');
}
for (const x of [-42, 0, 45, 87])
  object(`core-band-${x}`, 'cylinder', [x, 90, -850], [44, 2, 44], cyan, [0, 0, 90], cyan);
for (const [i, x, z] of [[0, -92, -970], [1, 138, -730]]) {
  object(`core-tower-${i}`, 'cylinder', [x, 48, z], [28, 130, 28], 'tex001');
  object(`core-tower-light-${i}`, 'sphere', [x, 115, z], [17, 17, 17], cyan, undefined, cyan);
}

// Finish straight has a quiet rhythm after the loop, pointing back to the grid.
for (let i = 0; i < 4; i++) {
  for (const side of [-1, 1]) {
    box(`finish-pylon-${i}-${side}`, [side * 42, 28, -650 + i * 65], [9, 62, 15], 'tex005');
    box(`finish-light-${i}-${side}`, [side * 36.9, 33, -650 + i * 65], [0.5, 25, 1], cyan, undefined, cyan);
  }
}

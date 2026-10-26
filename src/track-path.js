import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const wrap = u => ((u % 1) + 1) % 1;

export function createTrackCurve(definition) {
  const scale = definition.horizontalScale ?? 1;
  const points = definition.centerline.map(([x, y, z]) => new THREE.Vector3(x * scale, y, z * scale));
  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.42);
  curve.arcLengthDivisions = 1800;
  curve.track = {
    magnetic: definition.magnetic === true,
    banks: definition.centerline.map(point => point[3] ?? 0),
    gaps: (definition.gaps ?? []).map(gap => ({ ...gap })),
    width: definition.width,
  };
  if (curve.track.magnetic) buildFrames(curve);
  return curve;
}

function buildFrames(curve) {
  const samples = 2048;
  const tangents = [], rights = [];
  for (let i = 0; i <= samples; i++) {
    const tangent = curve.getTangentAt(i / samples).normalize();
    tangents.push(tangent);
    let right;
    if (i === 0) {
      right = UP.clone().cross(tangent);
      if (right.lengthSq() < 1e-8) right.set(1, 0, 0).addScaledVector(tangent, -tangent.x);
    } else {
      const transport = new THREE.Quaternion().setFromUnitVectors(tangents[i - 1], tangent);
      right = rights[i - 1].clone().applyQuaternion(transport);
      right.addScaledVector(tangent, -right.dot(tangent));
    }
    rights.push(right.normalize());
  }
  // Distribute parallel-transport holonomy over the closed path, avoiding a seam.
  const closingAngle = Math.atan2(rights.at(-1).clone().cross(rights[0]).dot(tangents[0]), rights.at(-1).dot(rights[0]));
  curve.track.frames = rights.map((right, i) => {
    right.applyAxisAngle(tangents[i], closingAngle * i / samples);
    const normal = tangents[i].clone().cross(right).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, normal, tangents[i]));
  });
}

export function bankAt(curve, progress) {
  const banks = curve.track?.banks;
  if (!banks) return 0;
  const t = curve.getUtoTmapping(wrap(progress)) * banks.length;
  const index = Math.floor(t) % banks.length;
  const a = banks[index];
  let b = banks[(index + 1) % banks.length];
  if (index === banks.length - 1) b += 360 * Math.round((a - b) / 360);
  const f = t - Math.floor(t);
  return THREE.MathUtils.degToRad(THREE.MathUtils.lerp(a, b, f * f * (3 - 2 * f)));
}

export function getTrackFrame(curve, progress) {
  const u = wrap(progress);
  const center = curve.getPointAt(u);
  const tangent = curve.getTangentAt(u).normalize();
  let right;
  const frames = curve.track?.frames;
  if (frames) {
    const at = u * (frames.length - 1), index = Math.floor(at);
    const rotation = frames[index].clone().slerp(frames[index + 1], at - index);
    right = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);
    right.addScaledVector(tangent, -right.dot(tangent)).normalize();
    right.applyAxisAngle(tangent, bankAt(curve, u));
  } else {
    right = UP.clone().cross(tangent);
    if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
    else right.normalize();
  }
  const normal = tangent.clone().cross(right).normalize();
  return { center, tangent, right, normal,
    rotation: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, normal, tangent)),
    yaw: Math.atan2(tangent.x, tangent.z),
  };
}

export function gapAt(curve, distance) {
  const length = curve.getLength(), u = wrap(distance / length);
  const gap = curve.track?.gaps.find(gap => u >= gap.start && u < gap.end);
  if (!gap) return null;
  const lap = Math.floor(distance / length);
  return { start: (lap + gap.start) * length, end: (lap + gap.end) * length };
}

export function nextGap(curve, distance) {
  const gaps = curve.track?.gaps ?? [], length = curve.getLength();
  const lap = Math.floor(distance / length);
  for (const gap of gaps) {
    const start = (lap + gap.start) * length;
    if (start >= distance - 1e-7) return { start, end: (lap + gap.end) * length };
  }
  return gaps.length ? { start: (lap + 1 + gaps[0].start) * length, end: (lap + 1 + gaps[0].end) * length } : null;
}

export function hasSurface(curve, distance, margin = 0) {
  if (!margin) return !gapAt(curve, distance);
  const length = curve.getLength(), left = distance - margin, right = distance + margin;
  for (let lap = Math.floor(left / length); lap <= Math.floor(right / length); lap++) {
    for (const gap of curve.track?.gaps ?? []) {
      if (right >= (lap + gap.start) * length && left < (lap + gap.end) * length) return false;
    }
  }
  return true;
}

// Nearest point in a local, unwrapped race-distance interval. The bounded search
// deliberately cannot jump to another floor of a loop or an intersecting track.
export function projectOnTrack(curve, position, from, to) {
  let best = from, bestSq = Infinity;
  const count = 12, step = (to - from) / count;
  for (let i = 0; i <= count; i++) {
    const distance = from + i * step;
    const sq = curve.getPointAt(wrap(distance / curve.getLength())).distanceToSquared(position);
    if (sq < bestSq) { bestSq = sq; best = distance; }
  }
  let low = Math.max(from, best - step), high = Math.min(to, best + step);
  for (let i = 0; i < 14; i++) {
    const a = low + (high - low) / 3, b = high - (high - low) / 3;
    const pa = curve.getPointAt(wrap(a / curve.getLength()));
    const pb = curve.getPointAt(wrap(b / curve.getLength()));
    if (pa.distanceToSquared(position) < pb.distanceToSquared(position)) high = b; else low = a;
  }
  return (low + high) / 2;
}

export function progressAtControlPoint(curve, index) {
  const lengths = curve.getLengths(), t = index / curve.points.length * (lengths.length - 1);
  const i = Math.floor(t), f = t - i;
  return THREE.MathUtils.lerp(lengths[i], lengths[Math.min(i + 1, lengths.length - 1)], f) / lengths.at(-1);
}

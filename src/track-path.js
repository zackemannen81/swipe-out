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
    pointWidths: definition.pointWidths,
  };
  if (curve.track.magnetic) buildFrames(curve);
  curve.track.branches = (definition.branches ?? []).map(branch => buildBranch(curve, branch, scale));
  return curve;
}

function buildBranch(base, definition, scale) {
  const startFrame = getTrackFrame(base, definition.start), endFrame = getTrackFrame(base, definition.end);
  const handle = Math.min(25, startFrame.center.distanceTo(endFrame.center) * 0.12);
  const points = [startFrame.center.clone(), startFrame.center.clone().addScaledVector(startFrame.tangent, handle),
    ...definition.points.map(([x,y,z]) => new THREE.Vector3(x * scale,y,z * scale)),
    endFrame.center.clone().addScaledVector(endFrame.tangent, -handle), endFrame.center.clone()];
  const path = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  path.arcLengthDivisions = 1200;
  const frames = [], tangents = [], rights = [];
  for (let i = 0; i <= 512; i++) {
    const t = path.getTangentAt(i / 512).normalize(); tangents.push(t);
    const r = i ? rights[i - 1].clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(tangents[i - 1], t)) : startFrame.right.clone();
    rights.push(r.addScaledVector(t, -r.dot(t)).normalize());
  }
  const endRight = endFrame.right.clone();
  const correction = Math.atan2(rights.at(-1).clone().cross(endRight).dot(tangents.at(-1)), rights.at(-1).dot(endRight));
  rights.forEach((r, i) => {
    r.applyAxisAngle(tangents[i], correction * i / 512);
    frames.push(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, tangents[i].clone().cross(r), tangents[i])));
  });
  const branch = { ...definition, path, length: path.getLength(), span: (definition.end - definition.start) * base.getLength() };
  branch.frame = u => {
    u = THREE.MathUtils.clamp(u, 0, 1);
    if (u <= 1e-8) return getTrackFrame(base, definition.start);
    if (u >= 1 - 1e-8) return getTrackFrame(base, definition.end);
    const at = u * 512, i = Math.min(511, Math.floor(at));
    const q = frames[i].clone().slerp(frames[i + 1], at - i);
    const tangent = path.getTangentAt(u).normalize();
    const right = new THREE.Vector3(1,0,0).applyQuaternion(q);
    right.addScaledVector(tangent, -right.dot(tangent)).normalize();
    const normal = tangent.clone().cross(right).normalize();
    return { center: path.getPointAt(u), tangent, right, normal,
      rotation: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,normal,tangent)) };
  };
  branch.widthAt = u => THREE.MathUtils.lerp(getTrackWidth(base, u < 0.5 ? branch.start : branch.end), branch.width, Math.min(1, Math.max(0, Math.min(u, 1-u) / 0.1)));
  return branch;
}

export function activeBranch(curve, ship, distance = ship.distance) {
  if (!ship.route) return null;
  const branch = curve.track?.branches?.find(b => b.id === ship.route.id);
  const u = distance / curve.getLength() - ship.route.lap;
  return branch && u >= branch.start - 1e-8 && u <= branch.end + 1e-8 ? branch : null;
}

export function getRacerFrame(curve, ship, progress = ship.distance / curve.getLength()) {
  const branch = activeBranch(curve, ship, progress * curve.getLength());
  return branch ? branch.frame((progress - ship.route.lap - branch.start) / (branch.end - branch.start)) : getTrackFrame(curve, progress);
}

export function getRacerWidth(curve, ship, fallback = curve.track?.width ?? 10) {
  const branch = activeBranch(curve, ship);
  return branch ? branch.widthAt((ship.distance / curve.getLength() - ship.route.lap - branch.start) / (branch.end - branch.start)) : getTrackWidth(curve, ship.distance / curve.getLength(), fallback);
}

export function routeMetric(curve, ship) {
  const branch = activeBranch(curve, ship);
  return branch ? branch.span / branch.length : 1;
}

export function nextBranch(curve, distance) {
  const length = curve.getLength(), lap = Math.floor(distance / length);
  for (const branch of curve.track?.branches ?? []) {
    if ((lap + branch.start) * length >= distance - 1e-7) return { branch, lap, distance: (lap + branch.start) * length };
  }
  return null;
}

// Distance remains a common course coordinate. Speed remains real world units/s.
// Consume physical distance on each section, including exact fork/merge boundaries.
export function advanceRouteDistance(curve, ship, travel) {
  const length = curve.getLength();
  for (let guard = 0; travel > 1e-8 && guard < 16; guard++) {
    const branch = activeBranch(curve, ship);
    if (branch) {
      const end = (ship.route.lap + branch.end) * length;
      const remaining = Math.max(0, end - ship.distance) / (branch.span / branch.length);
      const used = Math.min(travel, remaining);
      ship.distance += used * branch.span / branch.length; travel -= used;
      if (remaining <= used + 1e-7) { ship.distance = end; ship.route = null; ship.routeMerges++; }
      continue;
    }
    const junction = nextBranch(curve, ship.distance);
    if (!junction || junction.distance > ship.distance + travel) { ship.distance += travel; break; }
    const used = Math.max(0, junction.distance - ship.distance);
    ship.distance = junction.distance; travel -= used;
    const { branch: b, lap } = junction;
    if (ship.routeDecision !== `${lap}:${b.id}`) {
      ship.routeDecision = `${lap}:${b.id}`;
      if (!ship.flight && ship.lateralOffset * b.side > getTrackWidth(curve, b.start) * 0.12) {
        ship.route = { id: b.id, lap }; ship.routeEntries++;
        continue;
      }
    }
    // Step over a declined fork without re-evaluating it later in the same lap.
    const epsilon = Math.min(travel, 1e-5); ship.distance += epsilon; travel -= epsilon;
    if (!epsilon) break;
  }
}

// Ordered shared gates prevent a jump/teleport over a mandatory sector from
// earning a lap. Branches use the same gates regardless of their physical length.
export function recordRaceProgress(curve, ship, from) {
  if (!curve.track?.branches?.length || ship.flight || ship.recoveryTimer > 0) return;
  const gates = [...new Set([0.33, 0.66, ...curve.track.branches.map(b => b.end), 1])].sort((a,b) => a-b);
  const length = curve.getLength();
  while (true) {
    const lap = Math.floor(ship.gatesPassed / gates.length), i = ship.gatesPassed % gates.length;
    const next = (lap + gates[i]) * length;
    if (from > next + 1e-6 || ship.distance < next) break;
    ship.gatesPassed++;
    if (i === gates.length - 1) ship.completedLaps++;
  }
}

export function canFinishRace(curve, ship, laps = 3) {
  return !ship.flight && ship.distance >= curve.getLength() * laps &&
    (!curve.track?.branches?.length || ship.completedLaps >= laps);
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

export function getTrackWidth(curve, progress, fallback = curve.track?.width ?? 10) {
  const widths = curve.track?.pointWidths;
  if (!widths) return fallback;
  fallback = curve.track?.width ?? fallback;
  const t = curve.getUtoTmapping(wrap(progress)) * widths.length;
  const i = Math.floor(t) % widths.length, f = t - Math.floor(t);
  return THREE.MathUtils.lerp(widths[i] ?? fallback, widths[(i + 1) % widths.length] ?? fallback, f * f * (3 - 2 * f));
}

import * as THREE from 'three';
import { getTrackFrame } from './track.js';
import { getRacerTopSpeed } from './catch-up.js';

export const BOOST = { duration: 1, entryMultiplier: 1.3, maxMultiplier: 1.5, halfWidth: 1.2 };
const clamp = THREE.MathUtils.clamp;

export function registerImpact(ship, strength, side = 0) {
  ship.impactStrength = Math.max(ship.impactStrength, clamp(strength, 0, 1));
  ship.impactSerial++;
  ship.crashTimer = Math.max(ship.crashTimer, 0.18 + strength * 0.3);
  ship.lastImpact = 0.3;
  ship.yawVelocity += side * strength * 0.75;
  ship.roll += side * strength * 0.16;
}

export function resolveWallImpact(ship, trackWidth = 10) {
  const edge = Math.max(0.5, trackWidth / 2 - 0.85);
  if (Math.abs(ship.lateralOffset) <= edge || ship.verticalOffset > 1.4) return false;
  const side = Math.sign(ship.lateralOffset);
  ship.lateralOffset = side * edge;
  if (ship.crashCooldown > 0) {
    if (ship.lateralVelocity * side > 0) ship.lateralVelocity = 0;
    return false;
  }
  const severity = clamp((Math.abs(ship.lateralVelocity) * 2 + Math.abs(ship.yaw) * ship.speed * 0.3) / 22, 0.15, 1);
  ship.speed *= 1 - (0.1 + severity * 0.35);
  ship.lateralVelocity = -side * Math.max(1.5, Math.abs(ship.lateralVelocity) * 0.55);
  ship.yawVelocity *= -0.35;
  ship.crashCooldown = 0.3;
  ship.wallHits++;
  registerImpact(ship, severity, -side);
  return true;
}

// Pads are the three rendered arrows from d-4 to d, with a small end margin.
// Sweep the traveled segment so fast craft cannot skip a pad between frames.
export function collectBoostPad(ship, pads, trackLength, topSpeed) {
  const start = ship.previousDistance;
  const end = ship.distance;
  if (end <= start || !pads?.length) return false;
  for (let lap = Math.floor(start / trackLength); lap <= Math.floor(end / trackLength); lap++) {
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      const entry = lap * trackLength + pad.d - 5;
      const exit = lap * trackLength + pad.d + 1;
      if (end < entry || start > exit) continue;
      const key = `${lap}:${i}`;
      if (ship.lastBoostKey === key) continue;
      const fraction = clamp((Math.max(start, entry) - start) / (end - start), 0, 1);
      const lane = THREE.MathUtils.lerp(ship.previousLateralOffset, ship.lateralOffset, fraction);
      const height = THREE.MathUtils.lerp(ship.previousVerticalOffset, ship.verticalOffset, fraction);
      if (Math.abs(lane - pad.offset) > BOOST.halfWidth || height > 1.2) continue;
      ship.lastBoostKey = key;
      ship.boostTimer = BOOST.duration;
      ship.speed = Math.max(ship.speed, getRacerTopSpeed(ship, topSpeed) * BOOST.entryMultiplier);
      ship.boostCount++;
      return true;
    }
  }
  return false;
}

// Track-relative state is authoritative: impulses and separation survive the next pose update.
function moveBy(ship, frame, correction) {
  ship.distance = Math.max(0, ship.distance + correction.dot(frame.tangent));
  ship.lateralOffset += correction.dot(frame.right);
}

function setVelocity(ship, frame, velocity) {
  ship.speed = Math.max(12, velocity.dot(frame.tangent));
  ship.lateralVelocity = clamp(velocity.dot(frame.right) / 2, -15, 15);
  ship.velocity.copy(velocity);
}

export function createCollisionState() {
  return { cooldowns: new Map() };
}

export function resolveRacerCollisions(racers, curve, delta, state) {
  for (const [key, remaining] of state.cooldowns) {
    if (remaining <= delta) state.cooldowns.delete(key);
    else state.cooldowns.set(key, remaining - delta);
  }
  const length = curve.getLength();
  for (let i = 0; i < racers.length; i++) for (let j = i + 1; j < racers.length; j++) {
    const a = racers[i];
    const b = racers[j];
    if (a.finished || b.finished) continue;
    const sa = a.physics;
    const sb = b.physics;
    const frameA = getTrackFrame(curve, sa.distance / length);
    const frameB = getTrackFrame(curve, sb.distance / length);
    const separation = a.group.position.clone().sub(b.group.position);
    const radius = 2.2;
    let normal = separation.clone();
    let swept = false;
    const previous = sa.previousPosition.clone().sub(sb.previousPosition);
    const travel = separation.clone().sub(previous);
    const aa = travel.lengthSq();
    const bb = 2 * previous.dot(travel);
    const cc = previous.lengthSq() - radius * radius;
    const discriminant = bb * bb - 4 * aa * cc;
    if (aa >= 1e-8 && cc >= 0 && discriminant >= 0) {
      const t = (-bb - Math.sqrt(discriminant)) / (2 * aa);
      if (t >= 0 && t <= 1) {
        normal.copy(previous).addScaledVector(travel, t);
        swept = true;
      }
    }
    if (!swept && separation.lengthSq() >= radius * radius) continue;
    if (normal.lengthSq() < 1e-8) normal.copy(frameA.right);
    normal.normalize();
    const invA = 1 / sa.mass;
    const invB = 1 / sb.mass;
    const inverseMass = invA + invB;
    // Also rewind a swept crossing to the contact side, avoiding pass-through.
    const penetration = swept ? radius - separation.dot(normal) : radius - separation.length();
    const correction = normal.clone().multiplyScalar(Math.max(0, penetration) + 0.005);
    moveBy(sa, frameA, correction.clone().multiplyScalar(invA / inverseMass));
    moveBy(sb, frameB, correction.clone().multiplyScalar(-invB / inverseMass));
    a.group.position.addScaledVector(correction, invA / inverseMass);
    b.group.position.addScaledVector(correction, -invB / inverseMass);
    const closingSpeed = sa.velocity.clone().sub(sb.velocity).dot(normal);
    const key = `${a.id}:${b.id}`;
    if (closingSpeed >= -0.5 || state.cooldowns.has(key)) continue;
    const impulse = -(1 + 0.45) * closingSpeed / inverseMass;
    const velocityA = sa.velocity.clone().addScaledVector(normal, impulse * invA);
    const velocityB = sb.velocity.clone().addScaledVector(normal, -impulse * invB);
    const severity = clamp(-closingSpeed / 45, 0.08, 1);
    // A small dissipative loss on BOTH hulls makes a ram costly to the attacker too.
    velocityA.multiplyScalar(1 - severity * 0.14);
    velocityB.multiplyScalar(1 - severity * 0.14);
    setVelocity(sa, frameA, velocityA);
    setVelocity(sb, frameB, velocityB);
    registerImpact(sa, severity, normal.dot(frameA.right));
    registerImpact(sb, severity, -normal.dot(frameB.right));
    sa.craftHits++;
    sb.craftHits++;
    state.cooldowns.set(key, 0.12);
  }
}

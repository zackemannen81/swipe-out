import * as THREE from 'three';
import { getTrackFrame, hasSurface, projectOnTrack, gapAt } from './track-path.js';
import { registerImpact } from './race-interactions.js';

export const FLIGHT = { gravity: 24, airSteering: 9, maxSeconds: 5, recoverySeconds: 0.65, recoveryRunup: 70 };
const HOVER = 0.62;

export function launchAcrossGap(ship, curve, gap) {
  const frame = getTrackFrame(curve, ship.distance / curve.getLength());
  const position = frame.center.clone().addScaledVector(frame.right, ship.lateralOffset).addScaledVector(frame.normal, HOVER + ship.verticalOffset);
  const velocity = frame.tangent.clone().multiplyScalar(ship.speed)
    .addScaledVector(frame.right, ship.lateralVelocity * 2).addScaledVector(frame.normal, ship.verticalVelocity);
  ship.flight = { position, velocity, up: frame.normal.clone(), right: frame.right.clone(),
    orientation: frame.rotation.clone(), gap, time: 0 };
  ship.airborne = true;
  ship.launches++;
  ship.velocity.copy(velocity);
}

export function flightPose(ship, curve) {
  const flight = ship.flight;
  const tangent = flight.velocity.clone().normalize();
  const right = flight.up.clone().cross(tangent).normalize();
  if (right.lengthSq() < 0.01) right.copy(flight.right);
  const normal = tangent.clone().cross(right).normalize();
  const rotation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, normal, tangent));
  // Orientation follows actual flight velocity, never the invisible gap spline.
  const frame = { center: flight.position.clone(), tangent, right, normal, rotation };
  ship.velocity.copy(flight.velocity);
  return { position: flight.position.clone(), orientation: rotation, frame };
}

export function recoverBeforeGap(ship, curve, baseSpeed) {
  let safeDistance = Math.max(0, ship.flight.gap.start - FLIGHT.recoveryRunup);
  const earlierGap = gapAt(curve, safeDistance);
  if (earlierGap) safeDistance = earlierGap.end + Math.min(5, (ship.flight.gap.start - earlierGap.end) / 2);
  ship.distance = safeDistance;
  ship.flight = null;
  ship.airborne = false;
  ship.lateralOffset = ship.lateralVelocity = ship.verticalOffset = ship.verticalVelocity = 0;
  ship.yaw = ship.yawVelocity = ship.roll = ship.pitch = 0;
  ship.boostTimer = 0;
  ship.lastBoostKey = null;
  ship.speed = baseSpeed * 0.9;
  ship.recoveryTimer = FLIGHT.recoverySeconds;
  ship.recoveries++;
  ship.respawnSerial++;
  const frame = getTrackFrame(curve, safeDistance / curve.getLength());
  ship.previousTangent = frame.tangent.clone();
  ship.previousSlope = frame.tangent.y;
  ship.previousDistance = safeDistance;
  ship.previousLateralOffset = ship.previousVerticalOffset = 0;
  ship.previousPosition.copy(frame.center).addScaledVector(frame.normal, HOVER);
  ship.velocity.set(0, 0, 0);
}

export function stepGapFlight(ship, input, dt, curve, baseSpeed, width) {
  const flight = ship.flight;
  if (dt <= 0) return;
  const oldPosition = flight.position.clone();
  const acceleration = flight.right.clone().multiplyScalar(-THREE.MathUtils.clamp(input.steer ?? 0, -1, 1) * FLIGHT.airSteering);
  acceleration.y -= FLIGHT.gravity;
  flight.position.addScaledVector(flight.velocity, dt).addScaledVector(acceleration, 0.5 * dt * dt);
  flight.velocity.addScaledVector(acceleration, dt);
  flight.time += dt;
  ship.thrust = THREE.MathUtils.damp(ship.thrust, input.thrust ?? 0, 4, dt);
  const previousDistance = ship.distance;
  const distance = projectOnTrack(curve, flight.position,
    Math.max(flight.gap.start, previousDistance - 4), previousDistance + Math.max(12, flight.velocity.length() * dt * 2));
  const frame = getTrackFrame(curve, distance / curve.getLength());
  const relative = flight.position.clone().sub(frame.center);
  const height = relative.dot(frame.normal) - HOVER;
  const oldHeight = oldPosition.sub(frame.center).dot(frame.normal) - HOVER;
  const lane = relative.dot(frame.right);
  // Never credit an invalid airborne lap crossing before landing/recovery.
  const finishLimit = (Math.floor(flight.gap.start / curve.getLength()) + 1) * curve.getLength() - 1;
  ship.distance = Math.min(distance, finishLimit);
  ship.lateralOffset = lane;
  ship.lateralVelocity = flight.velocity.dot(frame.right) / 2;
  ship.verticalOffset = height;
  ship.verticalVelocity = flight.velocity.dot(frame.normal);
  ship.speed = Math.max(12, flight.velocity.dot(frame.tangent));
  ship.velocity.copy(flight.velocity);

  if (hasSurface(curve, distance) && oldHeight >= -0.02 && height <= 0.02 && ship.verticalVelocity < 0 && Math.abs(lane) <= width / 2 - 0.65) {
    const severity = THREE.MathUtils.clamp(-ship.verticalVelocity / 35, 0.08, 1);
    ship.flight = null;
    ship.airborne = false;
    ship.verticalOffset = ship.verticalVelocity = 0;
    ship.speed *= 1 - severity * 0.08;
    ship.landings++;
    ship.previousTangent = frame.tangent.clone();
    ship.previousSlope = frame.tangent.y;
    registerImpact(ship, severity * 0.35);
  } else if (flight.time > FLIGHT.maxSeconds || height < -35 || distance > flight.gap.end + 280) {
    recoverBeforeGap(ship, curve, baseSpeed);
  }
}

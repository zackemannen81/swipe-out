import * as THREE from 'three';

// Source-informed adaptation of tmp/src/wipeout/ship_player.c. Our ribbon
// supplies pitch/bank/adhesion; yaw and lateral momentum remain independent.
// Numbers are in Swipeout seconds/world units, not the reference's fixed scale.
export const CLASSIC_HANDLING = Object.freeze({
  turnAcceleration: 2.8, turnRate: 1.1, maxHeading: 0.65, engineForce: 20,
  skidSeconds: 0.32, brakeSkidSeconds: 0.14, brakeYaw: 0.0032,
  brakeRate: 3.75, maxLateralSpeed: 15, rollSpring: 36, rollDamping: 10,
});
const clamp = THREE.MathUtils.clamp;
const approach = (value, target, step) => value + clamp(target - value, -step, step);

export function stepClassicAttitude(ship, input, dt) {
  const t = CLASSIC_HANDLING, steer = clamp(-(input.steer ?? 0), -1, 1);
  ship.brakeLeft = approach(ship.brakeLeft, clamp(Number(input.brakeLeft || 0), 0, 1), t.brakeRate * dt);
  ship.brakeRight = approach(ship.brakeRight, clamp(Number(input.brakeRight || 0), 0, 1), t.brakeRate * dt);
  const previous = ship.yawVelocity;
  const countersteering = steer * previous < 0;
  ship.yawVelocity = approach(previous, steer * t.turnRate, t.turnAcceleration * (countersteering ? 2 : 1) * dt);
  ship.yaw += (previous + ship.yawVelocity) * 0.5 * dt
    + (ship.brakeLeft - ship.brakeRight) * ship.speed * t.brakeYaw * dt;
  ship.pitch = THREE.MathUtils.damp(ship.pitch, clamp(input.pitch ?? 0, -1, 1) * 0.09, 3.2, dt);
}

export function stepClassicMomentum(ship, frame, dt) {
  const t = CLASSIC_HANDLING;
  // Re-express the previous heading/velocity in the new road frame. Vertical
  // loops don't create artificial horizontal yaw as a world-Y angle would.
  const turn = ship.previousTangent
    ? Math.atan2(ship.previousTangent.dot(frame.right), ship.previousTangent.dot(frame.tangent)) : 0;
  ship.yaw = clamp(ship.yaw + turn, -t.maxHeading, t.maxHeading);
  ship.lateralVelocity += turn * ship.speed * 0.5;
  if (!ship.previousTangent) ship.previousTangent = frame.tangent.clone();
  else ship.previousTangent.copy(frame.tangent);

  // Velocity converges to the nose direction over time. Braking adds yaw and
  // drag while allowing more sideslip, matching the reference's skid principle.
  const targetVelocity = Math.tan(ship.yaw) * ship.speed * 0.5;
  const skid = t.skidSeconds + (ship.brakeLeft + ship.brakeRight) * t.brakeSkidSeconds;
  ship.lateralVelocity = clamp(THREE.MathUtils.damp(ship.lateralVelocity, targetVelocity,
    ship.airborne ? 1 : 1 / skid, dt), -t.maxLateralSpeed, t.maxLateralSpeed);
  ship.lateralOffset += ship.lateralVelocity * 2 * dt;
}

export function stepClassicRoll(ship, dt) {
  const t = CLASSIC_HANDLING;
  const target = clamp(-ship.yawVelocity * 0.2 - ship.lateralVelocity * 0.01, -0.28, 0.28);
  ship.classicRollVelocity += ((target - ship.roll) * t.rollSpring - ship.classicRollVelocity * t.rollDamping) * dt;
  ship.roll += ship.classicRollVelocity * dt;
}

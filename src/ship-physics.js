import * as THREE from 'three';

// A scale-adapted port of the original Wipeout ship dynamics.
// The original triangle/section collision system is replaced by the track frame
// supplied by SwipeOut, while retaining thrust build-up, skid, differential
// brakes, track adhesion, airborne gravity, angular inertia and edge impacts.
export function createShipPhysics(baseSpeed = 65) {
  return {
    distance: 0,
    speed: baseSpeed,
    lateralOffset: 0,
    lateralVelocity: 0,
    verticalOffset: 0,
    verticalVelocity: 0,
    yaw: 0,
    yawVelocity: 0,
    roll: 0,
    pitch: 0,
    thrust: 0,
    brakeLeft: 0,
    brakeRight: 0,
    airborne: false,
    jumpCooldown: 0,
    previousSlope: 0,
    crashTimer: 0,
    crashCooldown: 0,
    lastImpact: 0,
  };
}

const damp = (value, target, lambda, dt) =>
  THREE.MathUtils.damp(value, target, lambda, dt);

export function stepShipPhysics(ship, input, dt, curve, baseSpeed = 65) {
  if (dt <= 0) {
    const frame = getFrame(curve, ship.distance);
    return makePose(ship, frame);
  }

  ship.jumpCooldown = Math.max(0, ship.jumpCooldown - dt);
  ship.crashTimer = Math.max(0, ship.crashTimer - dt);
  ship.crashCooldown = Math.max(0, ship.crashCooldown - dt);
  ship.lastImpact = Math.max(0, ship.lastImpact - dt);

  // Original thrust rises while held and falls off when released.
  const thrustInput = THREE.MathUtils.clamp(input.thrust ?? 0, 0, 1);
  ship.thrust = THREE.MathUtils.clamp(
    ship.thrust + (thrustInput > 0 ? 1.75 * thrustInput : -2.1) * dt,
    0,
    1,
  );
  ship.brakeLeft = damp(ship.brakeLeft, input.brakeLeft ? 1 : 0, input.brakeLeft ? 5.8 : 7.5, dt);
  ship.brakeRight = damp(ship.brakeRight, input.brakeRight ? 1 : 0, input.brakeRight ? 5.8 : 7.5, dt);
  const brake = ship.brakeLeft + ship.brakeRight;
  const differentialBrake = ship.brakeLeft - ship.brakeRight;

  // Angular acceleration / inertia, inspired by ship_player_update_race().
  const steer = THREE.MathUtils.clamp(input.steer ?? 0, -1, 1);
  const turnAcceleration = 4.7 + brake * 1.8;
  ship.yawVelocity += (steer * turnAcceleration - ship.yawVelocity * (steer === 0 ? 7.0 : 1.15)) * dt;
  ship.yawVelocity = THREE.MathUtils.clamp(ship.yawVelocity, -2.5, 2.5);
  ship.yaw = damp(ship.yaw, THREE.MathUtils.clamp(ship.yawVelocity * 0.15, -0.24, 0.24), 5.2, dt);
  ship.pitch = damp(ship.pitch, THREE.MathUtils.clamp(input.pitch ?? 0, -1, 1) * 0.09, 3.2, dt);

  // Longitudinal force balance: thrust, drag and braking. Speed is in the
  // existing SwipeOut world scale, rather than the original PS1 fixed-point scale.
  const throttleForce = ship.thrust * 38;
  const baselineDrag = ship.speed * 0.045;
  const brakingForce = brake * 18;
  ship.speed += (throttleForce - baselineDrag - brakingForce) * dt;
  ship.speed = THREE.MathUtils.clamp(ship.speed, 12, 120);

  // Find the current local track frame and preserve the original jump response
  // to a sharp downward change in track tangent.
  let frame = getFrame(curve, ship.distance);
  const slope = frame.tangent.y;
  const slopeChange = (slope - ship.previousSlope) / Math.max(dt, 1 / 120);
  ship.previousSlope = slope;
  if (!ship.airborne && ship.jumpCooldown <= 0 && slopeChange < -0.18) {
    ship.airborne = true;
    ship.verticalVelocity = THREE.MathUtils.clamp(-slopeChange * 1.7, 2.8, 7.2);
    ship.jumpCooldown = 0.6;
  }

  // Wipeout's forward-velocity correction (skid) and weaker airborne grip.
  const grip = ship.airborne ? 1.0 : 4.5 + brake * 1.8;
  const speedRatio = THREE.MathUtils.clamp(ship.speed / baseSpeed, 0.35, 1.55);
  const yawLateralForce = ship.yawVelocity * ship.speed * 0.12;
  const brakeSteerForce = differentialBrake * ship.speed * 0.10;
  ship.lateralVelocity += (
    yawLateralForce + brakeSteerForce - ship.lateralVelocity * grip
  ) * dt;
  ship.lateralVelocity = THREE.MathUtils.clamp(ship.lateralVelocity, -15, 15);
  ship.lateralOffset += ship.lateralVelocity * dt;

  // Magnetic track hold: a damped spring to the road plane. In flight, gravity
  // takes over and steering authority is reduced, as in the source physics.
  if (ship.airborne) {
    ship.verticalVelocity -= 8.6 * dt;
    ship.verticalOffset += ship.verticalVelocity * dt;
    if (ship.verticalOffset <= 0) {
      ship.verticalOffset = 0;
      ship.verticalVelocity = 0;
      ship.airborne = false;
      ship.lastImpact = 0.24;
      ship.speed *= 0.91;
    }
  } else {
    const magneticAcceleration = -ship.verticalOffset * 24 - ship.verticalVelocity * 8;
    ship.verticalVelocity += magneticAcceleration * dt;
    ship.verticalOffset += ship.verticalVelocity * dt;
    if (ship.verticalOffset < 0) {
      ship.verticalOffset = 0;
      ship.verticalVelocity = 0;
    }
  }

  // The original uses face collisions and track repulsion. SwipeOut's track is
  // a smooth ribbon, so the edge is handled as a damped impact instead.
  const edge = 4.52;
  if (!ship.airborne && Math.abs(ship.lateralOffset) > edge && ship.crashCooldown <= 0) {
    ship.crashTimer = 0.42;
    ship.crashCooldown = 0.62;
    ship.lateralOffset = Math.sign(ship.lateralOffset) * edge;
    ship.lateralVelocity *= -0.42;
    ship.speed *= 0.2;
    ship.yawVelocity *= -0.28;
    ship.lastImpact = 0.3;
  }
  ship.lateralOffset = THREE.MathUtils.clamp(ship.lateralOffset, -5.4, 5.4);

  // Track-relative bank and attitude damping.
  const desiredRoll = THREE.MathUtils.clamp(
    -(ship.lateralVelocity * 0.035 + ship.yawVelocity * 0.08),
    -0.84,
    0.84,
  );
  ship.roll = damp(ship.roll, desiredRoll, ship.airborne ? 3.0 : 6.0, dt);

  // Progress advances with forward speed, not with steering input.
  ship.distance += ship.speed * dt;
  frame = getFrame(curve, ship.distance);
  return makePose(ship, frame);
}

function getFrame(curve, distance) {
  return getTrackFrame(curve, distance / curve.getLength());
}

function makePose(ship, frame) {
  const position = frame.center.clone()
    .addScaledVector(frame.right, ship.lateralOffset)
    .addScaledVector(frame.normal, 0.62 + ship.verticalOffset);
  const orientation = frame.rotation.clone();
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ship.yaw));
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ship.pitch));
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ship.roll*2));
  return { frame, position, orientation };
}

// Kept local to avoid coupling this module to game.js.
function getTrackFrame(curve, progress) {
  const u = ((progress % 1) + 1) % 1;
  const center = curve.getPointAt(u);
  const tangent = curve.getTangentAt(u).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  else right.normalize();
  const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();
  const rotation = new THREE.Matrix4().makeBasis(right, normal, tangent);
  return { center, tangent, right, normal, rotation: new THREE.Quaternion().setFromRotationMatrix(rotation) };
}

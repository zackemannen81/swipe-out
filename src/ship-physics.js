import * as THREE from 'three';
import {SPEEDCALIBRATION} from './game.js';

// A scale-adapted port of the original Wipeout ship dynamics.
// World-space motion is deliberately separate from the track projection used by race logic.
export function createShipPhysics(baseSpeed = 65 + SPEEDCALIBRATION) {
  return {
    boostTimer: 0,
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
    previousTangent: null,
    assistLevel: 1.0,
    crashTimer: 0,
    crashCooldown: 0,
    lastImpact: 0,
    worldPosition: new THREE.Vector3(),
    worldVelocity: new THREE.Vector3(),
    worldQuaternion: new THREE.Quaternion(),
    worldInitialized: false,
  };
}

const damp = (value, target, lambda, dt) =>
  THREE.MathUtils.damp(value, target, lambda, dt);

export function stepShipPhysics(ship, input, dt, curve, baseSpeed = 65 + SPEEDCALIBRATION, hoverSample = null) {
  if (dt <= 0) {
    const frame = getFrame(curve, ship.distance);
    if (!ship.worldInitialized) {
      ship.worldPosition.copy(makePose(ship, frame).position);
      ship.worldVelocity.copy(frame.tangent).multiplyScalar(ship.speed);
      ship.worldQuaternion.copy(frame.rotation);
      ship.worldInitialized = true;
    }
    return makeFreePose(ship, frame);
  }

  ship.jumpCooldown = Math.max(0, ship.jumpCooldown - dt);
  ship.crashTimer = Math.max(0, ship.crashTimer - dt);
  ship.crashCooldown = Math.max(0, ship.crashCooldown - dt);
  ship.lastImpact = Math.max(0, ship.lastImpact - dt);
  ship.boostTimer = Math.max(0, ship.boostTimer - dt);

  const thrustInput = THREE.MathUtils.clamp(input.thrust ?? 0, 0, 1);
  ship.thrust = THREE.MathUtils.clamp(
    ship.thrust + (thrustInput > 0 ? 1.75 * thrustInput : -1.1) * dt,
    0, 1,
  );
  ship.brakeLeft = damp(ship.brakeLeft, input.brakeLeft ? 1 : 0, input.brakeLeft ? 5.8 : 7.5, dt);
  ship.brakeRight = damp(ship.brakeRight, input.brakeRight ? 1 : 0, input.brakeRight ? 5.8 : 7.5, dt);
  const brake = ship.brakeLeft + ship.brakeRight;
  const differentialBrake = ship.brakeLeft - ship.brakeRight;

  const steer = THREE.MathUtils.clamp(-(input.steer ?? 0), -1, 1);
  ship.yawVelocity += (steer * (3.7 + brake * 1.8) - ship.yawVelocity * (steer === 0 ? 7.5 : 1.15)) * dt;
  ship.yawVelocity = THREE.MathUtils.clamp(ship.yawVelocity, -2.2, 2.2);
  ship.yaw = damp(ship.yaw, THREE.MathUtils.clamp(ship.yawVelocity * 0.15, -0.24, 0.24), 5.2, dt);
  ship.pitch = damp(ship.pitch, THREE.MathUtils.clamp(input.pitch ?? 0, -1, 1) * 0.09, 3.2, dt);

  const throttleForce = ship.thrust * 28;
  const brakingForce = brake * 18;
  ship.speed = THREE.MathUtils.clamp(ship.speed + (throttleForce - ship.speed * 0.045 - brakingForce) * dt, 12, ship.boostTimer > 0 ? baseSpeed + 40 : baseSpeed);

  if (!ship.worldInitialized) {
    const frame = getFrame(curve, ship.distance);
    ship.worldPosition.copy(makePose(ship, frame).position);
    ship.worldVelocity.copy(frame.tangent).multiplyScalar(ship.speed);
    ship.worldQuaternion.copy(frame.rotation);
    ship.worldInitialized = true;
  }

  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(ship.worldQuaternion).normalize();
  const turnAxis = hoverSample?.normal?.lengthSq() > 0 ? hoverSample.normal : new THREE.Vector3(0, 1, 0);
  forward.applyAxisAngle(turnAxis, ship.yawVelocity * dt);
  const targetVelocity = forward.multiplyScalar(ship.speed);
  ship.worldVelocity.lerp(targetVelocity, 1 - Math.exp(-(ship.airborne ? 2.0 : 7.0) * dt));
  ship.worldVelocity.addScaledVector(new THREE.Vector3(0, -9.8, 0), dt);

  // Repulsive hover force acts along the measured surface normal, not world-up.
  if (hoverSample?.hit && hoverSample.distance < 12) {
    const error = THREE.MathUtils.clamp(1.15 - hoverSample.distance, -4, 4);
    ship.worldVelocity.addScaledVector(hoverSample.normal, error * 18 * dt);
    ship.airborne = hoverSample.distance > 2.8;
  } else {
    ship.airborne = true;
  }
  if (brake > 0) ship.worldVelocity.multiplyScalar(Math.max(0, 1 - brake * 0.9 * dt));
  ship.worldPosition.addScaledVector(ship.worldVelocity, dt);

  const up = hoverSample?.normal?.lengthSq() > 0 ? hoverSample.normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
  const direction = ship.worldVelocity.clone().normalize();
  const right = new THREE.Vector3().crossVectors(up, direction).normalize();
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
  const correctedForward = new THREE.Vector3().crossVectors(right, up).normalize();
  const basis = new THREE.Matrix4().makeBasis(right, up, correctedForward);
  ship.worldQuaternion.setFromRotationMatrix(basis);
  ship.worldQuaternion.multiply(new THREE.Quaternion().setFromAxisAngle(up, ship.yaw));
  ship.roll = damp(ship.roll, -steer * 0.22, 6.5, dt);
  ship.pitch = damp(ship.pitch, THREE.MathUtils.clamp(-ship.worldVelocity.y * 0.012, -0.16, 0.16), 4, dt);
  ship.lastImpact = hoverSample?.hit && hoverSample.distance < 0.25 ? 0.2 : ship.lastImpact;

  // This is only a fallback logical estimate; game.js replaces it with nearest-spline projection.
  ship.distance += ship.speed * dt;
  const frame = getFrame(curve, ship.distance);
  return makeFreePose(ship, frame);
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
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ship.roll * 2));
  return { frame, position, orientation };
}

function makeFreePose(ship, frame) {
  return { frame, position: ship.worldPosition, orientation: ship.worldQuaternion };
}

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

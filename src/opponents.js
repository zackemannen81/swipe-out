import * as THREE from 'three';
import { getTrackFrame } from './track.js';
import { createCraft } from './craft.js';
import { createShipPhysics, stepShipPhysics } from './ship-physics.js';
import { collectBoostPad } from './race-interactions.js';
import { getRacerTopSpeed } from './catch-up.js';

const TOTAL_LAPS = 3;
const clamp = THREE.MathUtils.clamp;

// World units/second and world units/second². Player's normal speed cap is 133.
export const RACER_DEFINITIONS = [
  { name: 'Vanta', topSpeed: 129, acceleration: 24, mass: 1.05, reaction: 0.34,
    cornering: 0.76, precision: 0.3, lane: -2.4, gridDistance: 6, phase: 0.4,
    modelUrl: '/models/racer_optimized-team2.glb', accentColor: 0xff4b91 },
  { name: 'Kestrel', topSpeed: 130, acceleration: 31, mass: 0.9, reaction: 0.23,
    cornering: 0.9, precision: 0.18, lane: 2.4, gridDistance: 6, phase: 2.2,
    modelUrl: '/models/racer_optimized-team3.glb', accentColor: 0x63f4e8 },
  { name: 'Orca', topSpeed: 135, acceleration: 21, mass: 1.3, reaction: 0.4,
    cornering: 0.72, precision: 0.38, lane: -2.4, gridDistance: 12, phase: 4.1,
    modelUrl: '/models/racer_optimized-team4.glb', accentColor: 0xff4b91 },
  { name: 'Nexus-9', topSpeed: 136, acceleration: 27, mass: 1.0, reaction: 0.3,
    cornering: 0.82, precision: 0.28, lane: 2.4, gridDistance: 12, phase: 5.8,
    modelUrl: '/models/racer_optimized-team5.glb', accentColor: 0x63f4e8 },
];

export function createOpponentState(definition, craft = { group: new THREE.Group() }) {
  const opponent = { ...definition, craft, group: craft.group };
  // Keep existing HUD/checkpoint callers connected to the authoritative physics.
  Object.defineProperties(opponent, {
    distance: { get() { return this.physics.distance; }, set(v) { this.physics.distance = v; } },
    currentSpeed: { get() { return this.physics.speed; }, set(v) { this.physics.speed = v; } },
    currentLane: { get() { return this.physics.lateralOffset; }, set(v) { this.physics.lateralOffset = v; } },
  });
  resetOpponents([opponent]);
  return opponent;
}

export async function createOpponents() {
  return Promise.all(RACER_DEFINITIONS.map(async definition =>
    createOpponentState(definition, await createCraft(definition))));
}

export function resetOpponents(opponents) {
  for (const opponent of opponents) {
    opponent.physics = createShipPhysics(opponent.topSpeed * 0.8, {
      engineForce: opponent.acceleration + opponent.topSpeed * 0.045,
      brakeForce: 32, mass: opponent.mass, centeringStrength: 0,
    });
    opponent.physics.assistLevel = 0.25;
    opponent.distance = opponent.gridDistance;
    opponent.currentLane = opponent.lane;
    opponent.finishTime = null;
    opponent.targetLane = opponent.lane;
    opponent.targetSpeed = opponent.topSpeed;
    opponent.trafficSpeedLimit = Infinity;
    opponent.decisionTimer = 0;
    opponent.strategy = 'race';
    opponent.input = { steer: 0, thrust: 1, brakeLeft: false, brakeRight: false };
    opponent.nextCheckpointIndex = 0;
    opponent.checkpointTimes = [];
  }
}

function decide(opponent, opponents, player, curve, pads, trackWidth, elapsed) {
  const length = curve.getLength();
  const ship = opponent.physics;
  const lookDistance = Math.max(18, ship.speed * (0.4 + opponent.reaction));
  const here = getTrackFrame(curve, ship.distance / length);
  const ahead = getTrackFrame(curve, (ship.distance + lookDistance) / length);
  const turn = here.tangent.dot(ahead.right);
  const edge = Math.max(0.4, trackWidth / 2 - 1.2);
  const cornerSlowdown = Math.abs(turn) * (0.7 - opponent.cornering * 0.3);
  opponent.targetSpeed = opponent.topSpeed * clamp(1 - cornerSlowdown, 0.65, 1);
  opponent.targetLane = clamp(opponent.lane * 0.35 - turn * 2.4, -edge, edge);
  opponent.strategy = 'race';
  opponent.trafficSpeedLimit = Infinity;

  let nextPad = null;
  let nearestPad = Infinity;
  for (const pad of pads) {
    const aheadDistance = (pad.d - ship.distance % length + length) % length;
    if (aheadDistance < nearestPad && aheadDistance < Math.max(45, ship.speed * 1.15)) {
      nearestPad = aheadDistance;
      nextPad = pad;
    }
  }
  if (nextPad && Math.abs(turn) < 0.8) {
    opponent.targetLane = clamp(nextPad.offset, -edge, edge);
    opponent.strategy = 'boost-pad';
  }

  // Traffic decisions are separate from the shared, leader-relative catch-up.
  let blocker = null;
  let nearest = 24;
  for (const other of [...opponents, ...(player ? [player] : [])]) {
    if (other === opponent || other.finishTime != null) continue;
    const gap = ((other.physics.distance - ship.distance + length * 1.5) % length) - length * 0.5;
    if (gap > 0 && gap < nearest && Math.abs(other.physics.lateralOffset - ship.lateralOffset) < 2.4) {
      blocker = other;
      nearest = gap;
    }
  }
  if (blocker) {
    const lane = blocker.physics.lateralOffset;
    const leftSpace = lane + edge;
    const rightSpace = edge - lane;
    opponent.targetLane = clamp(lane + (rightSpace >= leftSpace ? 2.6 : -2.6), -edge, edge);
    opponent.strategy = 'overtake';
    if (nearest < 7) opponent.trafficSpeedLimit = blocker.physics.speed * 0.94;
  }
  // Smooth driver error and finite reaction time can produce imperfect lines and wall scrapes.
  opponent.targetLane += Math.sin(elapsed * 1.7 + opponent.phase) * opponent.precision;
  opponent.decisionTimer += opponent.reaction;
}

function drive(opponent, curve, dt) {
  const ship = opponent.physics;
  const frame = getTrackFrame(curve, ship.distance / curve.getLength());
  const turn = ship.previousTangent ? ship.previousTangent.dot(frame.right) : 0;
  const centrifugal = turn / dt * ship.speed * 0.75 * 0.1;
  const desiredLateral = clamp((opponent.targetLane - ship.lateralOffset) * 1.9, -4.5, 4.5);
  const grip = ship.airborne ? 1 : 4.5;
  const desiredYawRate = clamp(((desiredLateral - ship.lateralVelocity) * 4 + ship.lateralVelocity * grip - centrifugal)
    / Math.max(4, ship.speed * 0.12), -1.7, 1.7);
  const steer = -clamp(((desiredYawRate - ship.yawVelocity) * 5 + ship.yawVelocity * 1.15) / 3.7, -1, 1);
  const topSpeed = getRacerTopSpeed(ship, opponent.topSpeed);
  const cornerTarget = opponent.targetSpeed * topSpeed / opponent.topSpeed;
  const speedTarget = Math.min(opponent.trafficSpeedLimit,
    ship.boostTimer > 0 ? Math.max(cornerTarget, topSpeed * 1.3) : cornerTarget);
  const braking = ship.speed > speedTarget + 3;
  opponent.input = {
    steer, thrust: braking ? 0 : clamp((speedTarget - ship.speed) / 12 + 0.3, 0.15, 1),
    brakeLeft: braking, brakeRight: braking,
  };
}

export function syncOpponentPose(opponent, curve, trackWidth = 10) {
  const pose = stepShipPhysics(opponent.physics, opponent.input, 0, curve, opponent.topSpeed, trackWidth);
  opponent.group.position.copy(pose.position);
  opponent.group.quaternion.copy(pose.orientation);
}

export function updateOpponents(opponents, curve, delta, elapsed, racing, {
  player = null, boostPads = [], trackWidth = 10,
} = {}) {
  const length = curve.getLength();
  const totalDistance = length * TOTAL_LAPS;
  for (const opponent of opponents) {
    if (!racing || delta <= 0 || opponent.finishTime !== null) {
      syncOpponentPose(opponent, curve, trackWidth);
      continue;
    }
    const ship = opponent.physics;
    const initialPose = stepShipPhysics(ship, opponent.input, 0, curve, opponent.topSpeed, trackWidth);
    if (!ship.previousTangent) {
      ship.previousSlope = initialPose.frame.tangent.y;
      ship.previousTangent = initialPose.frame.tangent.clone();
    }
    const steps = Math.ceil(delta / (1 / 120));
    const dt = delta / steps;
    for (let step = 0; step < steps; step++) {
      const now = elapsed - delta + (step + 1) * dt;
      opponent.decisionTimer -= dt;
      if (opponent.decisionTimer <= 0) decide(opponent, opponents, player, curve, boostPads, trackWidth, now);
      drive(opponent, curve, dt);
      stepShipPhysics(ship, opponent.input, dt, curve, opponent.topSpeed, trackWidth);
      collectBoostPad(ship, boostPads, length, opponent.topSpeed);
      if (ship.distance >= totalDistance) {
        opponent.finishTime = now - (ship.distance - totalDistance) / Math.max(1, ship.speed);
        ship.distance = totalDistance;
        ship.boostTimer = 0;
        ship.speed = 0;
        break;
      }
    }
    ship.previousPosition.copy(initialPose.position);
    syncOpponentPose(opponent, curve, trackWidth);
  }
}

export function getPlayerPosition(opponents, playerDistance, playerFinishTime = null) {
  return opponents.filter(opponent => playerFinishTime !== null
    ? opponent.finishTime !== null && opponent.finishTime < playerFinishTime
    : opponent.distance > playerDistance).length + 1;
}

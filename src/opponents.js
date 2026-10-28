import * as THREE from 'three';
import { getRacerFrame, getRacerWidth, nextBranch, canFinishRace, nextGap } from './track-path.js';
import { createCraft } from './craft.js';
import { createShipPhysics, stepShipPhysics } from './ship-physics.js';
import { collectBoostPad } from './race-interactions.js';
import { getRacerTopSpeed } from './catch-up.js';

import { CPU_DIFFICULTIES, cpuDifficulty, shortcutChoice } from './cpu-difficulty.js';

const TOTAL_LAPS = 3;
const clamp = THREE.MathUtils.clamp;

// User-tuned physical performance; difficulty changes driving decisions, not these caps.
export const RACER_DEFINITIONS = [
  { name: 'Vanta', personality: 'Balanced', risk: 0.5, topSpeed: 134, acceleration: 24, mass: 1.05, reaction: 0.34,
    cornering: 0.76, precision: 0.3, lane: -2.4, gridDistance: 6, phase: 0.4,
    modelUrl: '/models/racer_optimized-team2.glb', accentColor: 0xe811ff },
  { name: 'Kestrel', personality: 'Precise', risk: 0.35, topSpeed: 136, acceleration: 31, mass: 0.9, reaction: 0.23,
    cornering: 0.9, precision: 0.18, lane: 2.4, gridDistance: 6, phase: 2.2,
    modelUrl: '/models/racer_optimized-team3.glb', accentColor: 0x00f4e8 },
  { name: 'Orca', personality: 'Cautious', risk: 0.15, topSpeed: 138, acceleration: 21, mass: 1.3, reaction: 0.4,
    cornering: 0.72, precision: 0.38, lane: -2.4, gridDistance: 12, phase: 4.1,
    modelUrl: '/models/racer_optimized-team4.glb', accentColor: 0xff4b11 },
  { name: 'Nexus-9', personality: 'Aggressive', risk: 0.85, topSpeed: 141, acceleration: 27, mass: 1.0, reaction: 0.3,
    cornering: 0.82, precision: 0.28, lane: 2.4, gridDistance: 12, phase: 5.8,
    modelUrl: '/models/racer_optimized-team5.glb', accentColor: 0x00f4e8 },
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

export function resetOpponents(opponents, difficulty = 'pilot') {
  for (const opponent of opponents) {
    opponent.difficulty = cpuDifficulty(difficulty);
    opponent.ai = CPU_DIFFICULTIES[opponent.difficulty];
    opponent.risk ??= 0.5;
    opponent.mistakeUntil = 0;
    opponent.nextMistake = 5 + opponent.phase * 2;
    opponent.mistakes = 0;
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
  const lookDistance = Math.max(18, ship.speed * (0.4 + opponent.reaction) * opponent.ai.anticipation);
  trackWidth = getRacerWidth(curve, ship, trackWidth);
  const here = getRacerFrame(curve, ship);
  const ahead = getRacerFrame(curve, ship, (ship.distance + lookDistance) / length);
  const turn = here.tangent.dot(ahead.right);
  const edge = Math.max(0.4, trackWidth / 2 - 1.2);
  const cornerSlowdown = Math.abs(turn) * (0.7 - opponent.cornering * 0.3)
    * opponent.ai.cornerPenalty * (1.08 - opponent.risk * 0.16);
  opponent.targetSpeed = opponent.topSpeed * opponent.ai.pace * clamp(1 - cornerSlowdown, 0.6, 1);
  opponent.targetLane = clamp(opponent.lane * 0.35 - turn * 2.4, -edge, edge);
  opponent.strategy = 'race';
  opponent.trafficSpeedLimit = Infinity;

  let nextPad = null;
  let nearestPad = Infinity;
  for (const pad of pads) {
    if ((pad.routeId ?? null) !== (ship.route?.id ?? null)) continue;
    const aheadDistance = (pad.d - ship.distance % length + length) % length;
    if (aheadDistance < nearestPad && aheadDistance < Math.max(45, ship.speed * 1.15)) {
      nearestPad = aheadDistance;
      nextPad = pad;
    }
  }
  if (nextPad && Math.abs(turn) < 0.65 + opponent.risk * 0.3) {
    opponent.targetLane = clamp(nextPad.offset, -edge, edge);
    opponent.strategy = 'boost-pad';
  }

  // Traffic decisions are separate from the shared, leader-relative catch-up.
  let blocker = null;
  let nearest = 20 + opponent.risk * 12;
  for (const other of [...opponents, ...(player ? [player] : [])]) {
    if (other === opponent || other.finishTime != null) continue;
    if ((other.physics.route?.id ?? null) !== (ship.route?.id ?? null)) continue;
    const gap = ((other.physics.distance - ship.distance + length * 1.5) % length) - length * 0.5;
    if (gap > 0 && gap < nearest && Math.abs(other.physics.lateralOffset - ship.lateralOffset) < 2.4) {
      blocker = other;
      nearest = gap;
    }
  }
  if (blocker) {
    const lane = blocker.physics.lateralOffset;
    const clearance = opponent.ai.passingSpace + (0.5 - opponent.risk) * 0.4;
    const candidates = [lane - clearance, lane + clearance]
      .filter(target => Math.abs(target) <= edge)
      .filter(target => ![...opponents, ...(player ? [player] : [])].some(other => {
        if (other === opponent || other === blocker || other.finishTime != null ||
            (other.physics.route?.id ?? null) !== (ship.route?.id ?? null)) return false;
        const gap = ((other.physics.distance - ship.distance + length * 1.5) % length) - length * 0.5;
        return Math.abs(gap) < 12 && Math.abs(other.physics.lateralOffset - target) < clearance;
      }))
      .sort((a,b) => Math.abs(a - ship.lateralOffset) - Math.abs(b - ship.lateralOffset));
    if (candidates.length) {
      opponent.targetLane = candidates[0];
      opponent.strategy = 'overtake';
    } else {
      opponent.targetLane = ship.lateralOffset;
      opponent.strategy = 'follow';
    }
    if (!candidates.length || nearest < 10 - opponent.risk * 4)
      opponent.trafficSpeedLimit = blocker.physics.speed * 0.94;
  }
  const junction = nextBranch(curve, ship.distance);
  const approachingJunction = junction && junction.distance - ship.distance < Math.max(220, ship.speed * 2.2);
  const gap = ship.flight?.gap ?? nextGap(curve, ship.distance);
  const approachingGap = gap && (ship.flight || gap.start - ship.distance < Math.max(110, ship.speed * 1.1));
  // Smooth driver error and finite reaction time can produce imperfect lines and wall scrapes.
  opponent.targetLane += Math.sin(elapsed * 1.7 + opponent.phase) * opponent.precision * opponent.ai.error;
  // Occasional overcommitment is an input error with a real recovery cost.
  if (elapsed >= opponent.nextMistake && Math.abs(turn) > 0.12 && !ship.flight && !approachingGap && !approachingJunction) {
    opponent.mistakeUntil = elapsed + 0.45 + opponent.risk * 0.45;
    opponent.nextMistake = elapsed + opponent.ai.mistakeInterval * (1.3 - opponent.risk * 0.65);
    opponent.mistakes++;
  }
  if (elapsed < opponent.mistakeUntil) {
    opponent.targetLane += Math.sign(turn) * opponent.ai.mistakeSize * (0.6 + opponent.risk);
    opponent.targetSpeed *= 0.94;
  }
  if (approachingJunction) {
    const takeBranch = shortcutChoice(opponent, junction.lap);
    opponent.targetLane = junction.branch.side * curve.track.width * (takeBranch ? 0.3 : -0.2);
    opponent.strategy = takeBranch ? 'shortcut-entry' : 'main-route';
  }
  if (ship.route) opponent.targetLane = clamp(opponent.targetLane, -edge * 0.65, edge * 0.65);
  if (approachingGap) {
    opponent.targetLane = 0;
    opponent.targetSpeed = opponent.topSpeed;
    opponent.trafficSpeedLimit = Infinity;
    opponent.strategy = ship.flight ? 'air-control' : 'gap-runup';
  }
  opponent.decisionTimer += opponent.reaction * opponent.ai.reaction;
}

function drive(opponent, curve, dt) {
  const ship = opponent.physics;
  const frame = getRacerFrame(curve, ship);
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
    const respawnSerial = ship.respawnSerial;
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
      if (canFinishRace(curve, ship, TOTAL_LAPS)) {
        opponent.finishTime = now - (ship.distance - totalDistance) / Math.max(1, ship.speed);
        ship.distance = totalDistance;
        ship.boostTimer = 0;
        ship.speed = 0;
        break;
      }
    }
    if (ship.respawnSerial === respawnSerial) ship.previousPosition.copy(initialPose.position);
    syncOpponentPose(opponent, curve, trackWidth);
  }
}

export function getPlayerPosition(opponents, playerDistance, playerFinishTime = null) {
  return opponents.filter(opponent => playerFinishTime !== null
    ? opponent.finishTime !== null && opponent.finishTime < playerFinishTime
    : opponent.distance > playerDistance).length + 1;
}

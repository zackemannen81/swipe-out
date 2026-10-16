import * as THREE from 'three';
import { createCraft, loadCraftModel } from './craft.js';
import { getTrackFrame } from './track.js';

const TOTAL_LAPS = 3;
const COLLISION_RADIUS = 1.65;
const RACER_MASS = 1;
const collisionSeparation = new THREE.Vector3();
const collisionRelativeVelocity = new THREE.Vector3();

const RACER_DEFINITIONS = [
  {
    name: 'Vanta', speed: 94.5, lane: -2.15, phase: 0.4,
    modelUrl: '/models/racer_optimized-team2.glb',
    hullColor: 0x8b426c, canopyColor: 0x55132d,
    accentColor: 0xff4b91, secondaryAccentColor: 0xffb24a,
  },
  {
    name: 'Kestrel', speed: 102.5, lane: 2.15, phase: 2.2,
    modelUrl: '/models/racer_optimized-team3.glb',
    hullColor: 0x4c7890, canopyColor: 0x123d55,
    accentColor: 0x63f4e8, secondaryAccentColor: 0xc2ff61,
  },
];

export function createOpponents() {
  return RACER_DEFINITIONS.map((definition) => {
    const craft = createCraft({ ...definition, showGlow: true });
    loadCraftModel({ group: craft.group }, definition.modelUrl)
      .catch((error) => console.warn(`Unable to load ${definition.name} racer model; using procedural craft.`, error));
    return {
      ...definition,
      group: craft.group,
      engineMaterials: craft.engineMaterials ?? [],
      thrusterMaterials: craft.thrusterMaterials ?? [],
      thrusters: craft.thrusters ?? [],
      glow: craft.glow ?? null,
      distance: 0,
      finishTime: null,
      collisionVelocity: new THREE.Vector3(),
      collisionCooldown: 0,
    };
  });
}

export function resetOpponents(opponents) {
  for (const opponent of opponents) {
    opponent.distance = 0;
    opponent.finishTime = null;
    opponent.collisionVelocity.set(0, 0, 0);
    opponent.collisionCooldown = 0;
  }
}

export function updateOpponents(opponents, curve, delta, elapsed, racing) {
  const length = curve.getLength();
  const totalDistance = length * TOTAL_LAPS;
  for (const opponent of opponents) {
    if (racing && opponent.distance < totalDistance) {
      const nextDistance = opponent.distance + opponent.speed * delta;
      if (nextDistance >= totalDistance && opponent.finishTime === null) {
        opponent.finishTime = elapsed - (nextDistance - totalDistance) / opponent.speed;
      }
      opponent.distance = Math.min(nextDistance, totalDistance);
    }

    const frame = getTrackFrame(curve, (opponent.distance % length) / length);
    if (delta > 0) {
      opponent.collisionVelocity.multiplyScalar(Math.exp(-5.5 * delta));
      opponent.collisionCooldown = Math.max(0, opponent.collisionCooldown - delta);
    }
    const laneMotion = Math.sin(opponent.distance * 0.003 + opponent.phase) * 0.28;
    opponent.group.position.copy(frame.center)
      .addScaledVector(frame.right, opponent.lane + laneMotion)
      .addScaledVector(frame.normal, 0.62)
      .addScaledVector(opponent.collisionVelocity, delta > 0 ? Math.min(delta, 1 / 30) : 0);
    opponent.group.quaternion.copy(frame.rotation);
    opponent.group.rotateZ(-laneMotion * 0.045);

    // Give each CPU racer its own animated engine glow and exhaust.
    const pulse = 0.82 + Math.sin(elapsed * 19 + opponent.phase) * 0.16;
    for (const material of opponent.engineMaterials) {
      material.color.setHex(opponent.accentColor);
      material.emissive?.setHex(opponent.accentColor);
    }
    const enginePower = racing ? 0.9 + Math.sin(elapsed * 27 + opponent.phase) * 0.22 : 0.25;
    opponent.thrusters.forEach((thruster, index) => {
      thruster.visible = true;
      thruster.scale.set(
        0.82 + enginePower * 0.22,
        enginePower * (1 + Math.sin(elapsed * 31 + index * 2.1 + opponent.phase) * 0.1),
        0.82 + enginePower * 0.22,
      );
    });
    opponent.thrusterMaterials.forEach((material) => {
      material.opacity = racing ? THREE.MathUtils.clamp(0.42 + enginePower * 0.18, 0.42, 0.82) : 0.28;
    });
    if (opponent.glow) opponent.glow.intensity = 1.8 + pulse * 1.5;
  }
}

export function resolveCraftCollisions(opponents, playerPosition, playerVelocity, delta) {
  for (const opponent of opponents) {
    collisionSeparation.copy(playerPosition).sub(opponent.group.position);
    const distance = collisionSeparation.length();
    if (distance >= COLLISION_RADIUS * 2 || distance < 1e-5) continue;

    collisionSeparation.multiplyScalar(1 / distance);
    const normal = collisionSeparation;
    const penetration = COLLISION_RADIUS * 2 - distance;
    playerPosition.addScaledVector(normal, penetration * 0.5);
    opponent.group.position.addScaledVector(normal, -penetration * 0.5);

    collisionRelativeVelocity.copy(playerVelocity).sub(opponent.collisionVelocity);
    const closingSpeed = collisionRelativeVelocity.dot(normal);
    if (closingSpeed >= 0 || opponent.collisionCooldown > 0) continue;

    const impulse = -closingSpeed * 0.5 * RACER_MASS;
    playerVelocity.addScaledVector(normal, impulse);
    opponent.collisionVelocity.addScaledVector(normal, -impulse);
    opponent.collisionCooldown = 0.18;
  }
}

export function getPlayerPosition(opponents, playerDistance, playerFinishTime = null) {
  const ahead = opponents.filter((opponent) => {
    if (playerFinishTime !== null) {
      return opponent.finishTime !== null && opponent.finishTime < playerFinishTime;
    }
    return opponent.distance > playerDistance;
  }).length;
  return ahead + 1;
}

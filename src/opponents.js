import * as THREE from 'three';
import { createCraft, loadCraftModel } from './craft.js';
import { getTrackFrame } from './track.js';

const TOTAL_LAPS = 3;

const RACER_DEFINITIONS = [
  {
    name: 'Vanta', speed: 72.5, lane: -2.15, phase: 0.4,
    modelUrl: '/models/racer_optimized-team2.glb',
    hullColor: 0x8b426c, canopyColor: 0x55132d,
    accentColor: 0xff4b91, secondaryAccentColor: 0xffb24a,
  },
  {
    name: 'Kestrel', speed: 78.5, lane: 2.15, phase: 2.2,
    modelUrl: '/models/racer_optimized-team3.glb',
    hullColor: 0x4c7890, canopyColor: 0x123d55,
    accentColor: 0x63f4e8, secondaryAccentColor: 0xc2ff61,
  },
];

export function createOpponents() {
  return RACER_DEFINITIONS.map((definition) => {
    const craft = createCraft({ ...definition, showGlow: false });
    loadCraftModel({ group: craft.group }, definition.modelUrl)
      .catch((error) => console.warn(`Unable to load ${definition.name} racer model; using procedural craft.`, error));
    return {
      ...definition,
      group: craft.group,
      distance: 0,
      finishTime: null,
    };
  });
}

export function resetOpponents(opponents) {
  for (const opponent of opponents) {
    opponent.distance = 0;
    opponent.finishTime = null;
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
    const laneMotion = Math.sin(opponent.distance * 0.003 + opponent.phase) * 0.28;
    opponent.group.position.copy(frame.center)
      .addScaledVector(frame.right, opponent.lane + laneMotion)
      .addScaledVector(frame.normal, 0.62);
    opponent.group.quaternion.copy(frame.rotation);
    opponent.group.rotateZ(-laneMotion * 0.045);
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

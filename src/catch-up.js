import { MathUtils } from 'three';

// Catch-up för ALLA skepp. Sekunderna uppskattas från ledarens normala toppfart.
export const CATCH_UP = {
  startGapSeconds: 2,  // Ingen hjälp närmare ledaren än så här.
  fullGapSeconds: 8,   // Full målbonus vid detta avstånd eller längre bakom.
  maxBonus: 0.08,      // 0.08 = högst 8 % extra toppfart.
  smoothingSeconds: 1.5, // Tidskonstant: ca 95 % av förändringen efter 4.5 s.
};

export function catchUpTarget(gapSeconds, maxBonus = CATCH_UP.maxBonus) {
  return MathUtils.clamp(maxBonus, 0, CATCH_UP.maxBonus) * MathUtils.smoothstep(
    gapSeconds, CATCH_UP.startGapSeconds, CATCH_UP.fullGapSeconds,
  );
}

// Run once BEFORE any racer moves. Accumulated distance includes completed laps.
// Use nominal leader speed: braking, crashes and boost must not distort the gap estimate.
export function updateCatchUp(racers, delta, totalDistance, racing, maxBonus = CATCH_UP.maxBonus) {
  if (!(delta > 0) || racers.length === 0) return;
  let leader = racers[0];
  let leaderDistance = Math.min(leader.physics.distance, totalDistance);
  for (const racer of racers) {
    const distance = Math.min(racer.physics.distance, totalDistance);
    if (distance > leaderDistance) {
      leader = racer;
      leaderDistance = distance;
    }
  }
  const referenceSpeed = Math.max(1, leader.topSpeed);
  for (const racer of racers) {
    const ship = racer.physics;
    const gap = Math.max(0, leaderDistance - Math.min(ship.distance, totalDistance)) / referenceSpeed;
    const target = racing && !racer.finished && ship.distance < totalDistance ? catchUpTarget(gap, maxBonus) : 0;
    ship.catchUpGap = gap;
    ship.catchUpBonus = MathUtils.damp(ship.catchUpBonus, target, 1 / CATCH_UP.smoothingSeconds, delta);
    if (ship.catchUpBonus < 1e-6) ship.catchUpBonus = 0;
  }
}

export function getRacerTopSpeed(ship, normalTopSpeed) {
  return normalTopSpeed * (1 + MathUtils.clamp(ship.catchUpBonus, 0, CATCH_UP.maxBonus));
}

import * as THREE from 'three';
import { getTrackFrame } from './track.js';
import { loadCraftModel, createCraft } from './craft.js';
const TOTAL_LAPS = 3;
const COLLISION_RADIUS = 1.65;
const RACER_MASS = 1;
const collisionSeparation = new THREE.Vector3();
const collisionRelativeVelocity = new THREE.Vector3();

const RACER_DEFINITIONS = [
  {
    name: 'Vanta', speed: 97.5, lane: -3.35, phase: 0.4,
    modelUrl: '/models/racer_optimized-team2.glb',
    hullColor: 0x8b426c, canopyColor: 0x55132d,
    accentColor: 0xff4b91, secondaryAccentColor: 0xffb24a,
  },
  {
    name: 'Kestrel', speed: 99, lane: 3.35, phase: 2.2,
    modelUrl: '/models/racer_optimized-team3.glb',
    hullColor: 0x4c7890, canopyColor: 0x123d55,
    accentColor: 0x63f4e8, secondaryAccentColor: 0xc2ff61,
  },
  {
    name: 'Orca', speed: 104.5, lane: -1.7, phase: 0.4,
    modelUrl: '/models/racer_optimized-team4.glb',
    hullColor: 0x8b426c, canopyColor: 0x55132d,
    accentColor: 0xff4b91, secondaryAccentColor: 0xffb24a,
  },
  {
    name: 'Nexus-9', speed: 112.5, lane: 1.7, phase: 2.2,
    modelUrl: '/models/racer_optimized-team5.glb',
    hullColor: 0x4c7890, canopyColor: 0x123d55,
    accentColor: 0x63f4e8, secondaryAccentColor: 0xc2ff61,
  },
];
// Gör createOpponents async
export async function createOpponents() {
  
  // Vänta tills ALLA skepp har laddats in
  const opponentsData = await Promise.all(RACER_DEFINITIONS.map(async (definition) => {
    
    // Await:a vår nya async createCraft
    const craftObj = await createCraft(definition);
    
    return {
      ...definition,
      craft: craftObj,          
      group: craftObj.group,    
      distance: 0,
      finishTime: null,
      currentSpeed: definition.speed,
      baseSpeed: definition.speed,
      targetLane: definition.lane,
      currentLane: definition.lane,
      decisionTimer: Math.random() * 2.0,
      strategy: 'hold_default',
      collisionCooldown: 0
    };
  }));

  return opponentsData;
}

export function resetOpponents(opponents) {
  for (const opponent of opponents) {
    opponent.distance = 0;
    opponent.finishTime = null;
    opponent.currentLane = opponent.lane;
    opponent.targetLane = opponent.lane;
  }
}

export function updateOpponents(opponents, curve, delta, elapsed, racing, playerDistance = 0) {
  const length = curve.getLength();
  const totalDistance = length * TOTAL_LAPS;

  for (const opponent of opponents) {
    if (racing && opponent.distance < totalDistance) {

      // --- A. AI-BESLUTSMOTOR ---
      opponent.decisionTimer -= delta;

      if (opponent.decisionTimer <= 0) {
        opponent.decisionTimer = 1.5 + Math.random() * 1.0;

        const distToPlayer = opponent.distance - playerDistance;

        if (distToPlayer > 120) {
          // Långt före -> Sakta ner och håll sin fil
          opponent.currentSpeed = opponent.baseSpeed * 0.8;
          opponent.strategy = 'hold_default';
        } else if (distToPlayer > 0 && distToPlayer <= 40) {
          // Strax framför -> Blockera spelaren!
          opponent.currentSpeed = opponent.baseSpeed * 1.05;
          opponent.strategy = 'block';
        } else if (distToPlayer < 0 && distToPlayer >= -50) {
          // Strax bakom -> Försök köra om!
          opponent.currentSpeed = opponent.baseSpeed * 1.15;
          opponent.strategy = 'avoid';
        } else if (distToPlayer < -50) {
          // Långt bakom -> Ge dem en boost ikapp
          opponent.currentSpeed = opponent.baseSpeed * 1.25;
          opponent.strategy = 'hold_default';
        } else {
          // Normal lucka (40 till 120m framför)
          opponent.currentSpeed = opponent.baseSpeed;
          opponent.strategy = 'hold_default';
        }

        // Räkna ut målfil baserat på strategi
        const maxLane = 3.0;
        if (opponent.strategy === 'avoid') {
          // Korsa över banan för att köra om
          opponent.targetLane = opponent.lane > 0 ? -maxLane * 0.7 : maxLane * 0.7;
        } else if (opponent.strategy === 'block') {
          // Lägg sig i vägen
          opponent.targetLane = (Math.random() > 0.5 ? 1 : -1) * 1.2;
        } else {
          // Gå tillbaka till sin egen unika startfil (definition.lane)
          opponent.targetLane = opponent.lane;
        }
      }

      // --- B. MJUK FÖRFLYTTNING ---
      opponent.currentLane = THREE.MathUtils.damp(opponent.currentLane, opponent.targetLane, 2.0, delta);
      
      const nextDistance = opponent.distance + opponent.currentSpeed * delta;
      if (nextDistance >= totalDistance && opponent.finishTime === null) {
        opponent.finishTime = elapsed - (nextDistance - totalDistance) / opponent.currentSpeed;
      }
      opponent.distance = Math.min(nextDistance, totalDistance);
    }

    // --- C. POSITIONERING OCH LEVANDE MOTION ---
    const frame = getTrackFrame(curve, (opponent.distance % length) / length);
    const laneMotion = Math.sin(opponent.distance * 0.003 + opponent.phase) * 0.28;
    const finalLane = opponent.currentLane + laneMotion;

    opponent.group.position.copy(frame.center)
      .addScaledVector(frame.right, finalLane)
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
export function resolveCraftCollisions(opponents, playerPosition, playerVelocity, trackCurve, playerDistance, delta) {
  // Säkerhetskontroller för indata
  if (!playerPosition || !opponents) return;

  const actualCurve = trackCurve?.curve || trackCurve;
  if (!actualCurve || typeof actualCurve.getLength !== 'function') return;

  const length = actualCurve.getLength();
  
  // Skapa en säker fallback om playerVelocity saknas eller inte är en Vector3
  const safePlayerVel = (playerVelocity && typeof playerVelocity.x === 'number')
    ? playerVelocity
    : new THREE.Vector3();

  for (const opponent of opponents) {
    if (!opponent.group) continue;

    // 1. Räkna ner cooldown
    if (opponent.collisionCooldown > 0) {
      opponent.collisionCooldown -= delta;
    }

    // 2. Vektorseparering
    collisionSeparation.copy(playerPosition).sub(opponent.group.position);
    const distance = collisionSeparation.length();

    if (distance >= COLLISION_RADIUS * 2 || distance < 1e-5) continue;

    collisionSeparation.multiplyScalar(1 / distance);
    const normal = collisionSeparation;
    const penetration = COLLISION_RADIUS * 2 - distance;

    // 3. Separera spelaren i 3D-rymden
    playerPosition.addScaledVector(normal, penetration * 0.5);

    // 4. Knuffa motståndaren i sidled på sin fil (currentLane)
    const frame = getTrackFrame(actualCurve, (opponent.distance % length) / length);
    const sideDot = normal.dot(frame.right);
    
    opponent.currentLane -= Math.sign(sideDot) * penetration * 0.5;

    // 5. Impuls & Cooldown
    const safeOpponentVel = (opponent.collisionVelocity && typeof opponent.collisionVelocity.x === 'number')
      ? opponent.collisionVelocity
      : new THREE.Vector3();

    collisionRelativeVelocity.copy(safePlayerVel).sub(safeOpponentVel);
    const closingSpeed = collisionRelativeVelocity.dot(normal);

    if (closingSpeed >= 0 || opponent.collisionCooldown > 0) continue;

    const impulse = -closingSpeed * 0.5 * RACER_MASS;
    
    // Ge spelaren sin stöt om vektorn är giltig
    if (typeof playerVelocity?.addScaledVector === 'function') {
      playerVelocity.addScaledVector(normal, impulse);
    }
    
    // Bromsa eller accelerera motståndaren lite beroende på krockvinkeln
    opponent.currentSpeed -= Math.sign(normal.z) * impulse * 0.1;
    opponent.collisionCooldown = 0.18;
  }
}

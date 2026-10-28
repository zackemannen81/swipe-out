import * as THREE from 'three';
import { getRacerFrame, routeMetric, activeBranch, recordRaceProgress } from './track-path.js';
import { getRacerTopSpeed } from './catch-up.js';
// Presentation is injected by the game; physics also runs without a browser.
let particleSystem = null, scrapeMaterial = null;
export function configureImpactParticles(system, material) {
  particleSystem = system; scrapeMaterial = material;
}



// Skapa materialet för gnistorna en gång i minnet
const sparkMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xffbb00, // Guld/Orange färg
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

export const BOOST = { duration: 1, entryMultiplier: 1.3, maxMultiplier: 1.5, halfWidth: 1.2 };
const clamp = THREE.MathUtils.clamp;
export const CLASSIC_WALL = Object.freeze({ restitution: 0.12, maxRebound: 1.25 });

function settleClassicWallAttitude(ship, side) {
  // Stop motion into the rail; never manufacture a new sustained inward heading.
  // Already-applied player countersteer away from the rail remains authoritative.
  if (ship.yaw * side > 0) ship.yaw = 0;
  if (ship.yawVelocity * side > 0) ship.yawVelocity = 0;
}

function spawnScrapeSparks(position, inward, tangent, up, speed, strength, delta) {
  if (!particleSystem) return;
  // Antal gnistor per sekund, inte per kollision.
  const expected = (120 + strength * 450) * delta;
  const count = Math.floor(expected) +
    (Math.random() < expected % 1 ? 1 : 0);

  for (let i = 0; i < count; i++) {
    const spawnPos = position.clone()
      .addScaledVector(tangent, (Math.random() - 0.5) * speed * delta)
      .addScaledVector(up, (Math.random() - 0.5) * 0.3);

    // Låt gnistorna röra sig långsammare än skeppet,
    // så ett långt spår bildas bakom det.
    const vel = tangent.clone().multiplyScalar(
      speed * (0.05 + Math.random() * 0.18)
    );

    // Studsa bort från räcket.
    vel.addScaledVector(inward, 2 + Math.random() * 10);

    // Spridning relativt banans yta.
    vel.addScaledVector(up, (Math.random() - 0.25) * 8);

    particleSystem.createParticle(
      spawnPos,
      vel,
      scrapeMaterial,
      0.5 + Math.random() * 0.5,
      1,
      0.25 + Math.random() * 0.35,
      1,
      0
    );
  }
}

function spawnImpactSparks(position, normal, velocity, strength) {
  if (!particleSystem) return;
  const count = Math.floor(strength * 100) + 100;
  
  // Lista ut vilket håll skeppet åker åt
  const forward = velocity.clone().normalize();

  for (let i = 0; i < count; i++) {
    // Vänd riktningen motsatt skeppets riktning..
    const direction = forward.clone().multiplyScalar(-1.0);  
    direction.add(new THREE.Vector3(
      (Math.random() - 0.5) * 1.4,
      Math.random() - 0.4 * 1.4, // Inte säker på att det ska vara nån fart upp... kanske till o med ner!?!?
      (Math.random() - 0.5) * 1.4
    ));
    direction.normalize();
    const sparkSpeed =  Math.random() * 2;
    direction.multiplyScalar(sparkSpeed);
    direction.addScaledVector(velocity, 0.3);

    const spawnPos = position.clone().add(new THREE.Vector3(
  (Math.random() - 0.5) * 0.8,
  (Math.random() - 0.5) * 0.5,
  (Math.random() - 0.5) * 0.8
));
    particleSystem.createParticle(
      spawnPos,
      direction,
      sparkMaterial,
      0.5 + Math.random() * 0.5,
      1,
      0.25 + Math.random() * 0.35,
      1,  
      0   
    );
  }
}

export function registerImpact(ship, strength, side = 0) {
  ship.impactStrength = Math.max(ship.impactStrength, clamp(strength, 0, 1));
  ship.impactSerial++;
  ship.crashTimer = Math.max(ship.crashTimer, 0.18 + strength * 0.3);
  ship.lastImpact = 0.3;
  ship.yawVelocity += side * strength * 0.75;
  ship.roll += side * strength * 0.16;

}


export function resolveWallImpact(
  ship,
  trackWidth = 10,
  curve = null,
  delta = 1 / 60
) {
  if (ship.flight || ship.recoveryTimer > 0) return false;
  const edge = Math.max(0.5, trackWidth / 2 - 0.85);
  if (Math.abs(ship.lateralOffset) <= edge || ship.verticalOffset > 1.4) return false;
  const side = Math.sign(ship.lateralOffset);

  if (curve) {
  const frame = getRacerFrame(curve, ship);

  // Kontaktpunkten ute vid räcket.
  const contact = frame.center.clone()
    .addScaledVector(frame.right, side * edge)
    .addScaledVector(frame.normal, 0.55);

  // Normalen pekar in mot banans mitt.
  const inward = frame.right.clone().multiplyScalar(-side);

  // Fortsätt gnista även under crashCooldown.
  const scrapeStrength = THREE.MathUtils.clamp(
    (Math.abs(ship.lateralVelocity) +
      Math.abs(ship.yaw) * ship.speed * 0.15) / 8,
    0.15,
    1
  );

  spawnScrapeSparks(
    contact,
    inward,
    frame.tangent,
    frame.normal,
    ship.speed,
    scrapeStrength,
    delta
  );
}

  const classic = ship.handlingMode === 'wipeout';
  ship.lateralOffset = side * edge;
  if (ship.crashCooldown > 0) {
    if (ship.lateralVelocity * side > 0) ship.lateralVelocity = 0;
    if (classic) settleClassicWallAttitude(ship, side);
    return false;
  }
  const severity = clamp((Math.abs(ship.lateralVelocity) * 2 + Math.abs(ship.yaw) * ship.speed * 0.3) / 22, 0.15, 1);
  ship.speed *= 1 - (0.1 + severity * 0.35);
  if (classic) {
    const incoming = Math.max(0, ship.lateralVelocity * side);
    // lateralVelocity is half physical side speed. Preserve existing escape
    // momentum if another craft has pushed us outside while we steer away.
    if (incoming > 0) ship.lateralVelocity = -side * Math.min(CLASSIC_WALL.maxRebound, incoming * CLASSIC_WALL.restitution);
    settleClassicWallAttitude(ship, side);
  } else {
    ship.lateralVelocity = -side * Math.max(1.5, Math.abs(ship.lateralVelocity) * 0.55);
    ship.yawVelocity *= -0.35;
  }
  ship.crashCooldown = 0.3;
  ship.wallHits++;
  //spawnImpactSparks(ship.position,ship.velocity,severity);
spawnImpactSparks(
  ship.previousPosition.clone(),
  new THREE.Vector3(0, 1, 0),
  ship.velocity,
  severity
);
  
  registerImpact(ship, severity, classic ? 0 : -side);
  if (classic) ship.roll -= side * severity * 0.16; // Keep visible impact without a steering kick.
  return true;
}

// Pads are the three rendered arrows from d-4 to d, with a small end margin.
// Sweep the traveled segment so fast craft cannot skip a pad between frames.
export function collectBoostPad(ship, pads, trackLength, topSpeed) {
  if (ship.flight || ship.recoveryTimer > 0) return false;
  const start = ship.previousDistance;
  const end = ship.distance;
  if (end <= start || !pads?.length) return false;
  let boosted = false;
  ship.padPassages ??= {};
  for (let lap = Math.floor(start / trackLength); lap <= Math.floor(end / trackLength); lap++) {
    for (let i=0;i<pads.length;i++) {
      const pad=pads[i];
      if(pad.type==='weapon')continue;
      if ((pad.routeId ?? null) !== (ship.route?.id ?? null)) continue;
      const entry = lap * trackLength + pad.d - 5 * (pad.metric ?? 1);
      const exit = lap * trackLength + pad.d + (pad.metric ?? 1);
      if (end < entry || start > exit) continue;
      const key = `${lap}:${i}`;
      if (ship.padPassages[i] === lap) continue;
      const fraction = clamp((Math.max(start, entry) - start) / (end - start), 0, 1);
      const lane = THREE.MathUtils.lerp(ship.previousLateralOffset, ship.lateralOffset, fraction);
      const height = THREE.MathUtils.lerp(ship.previousVerticalOffset, ship.verticalOffset, fraction);
      if (Math.abs(lane - pad.offset) > BOOST.halfWidth || height > 1.2) continue;
      ship.padPassages[i] = lap;
      if (pad.type === 'brake') {
        ship.lastBrakeKey = key;
        ship.speed *= 0.72;
        ship.boostTimer = 0;
        ship.brakePadCount = (ship.brakePadCount ?? 0) + 1;
        continue;
      }
      ship.lastBoostKey = key;
      ship.boostTimer = BOOST.duration;
      ship.speed = Math.max(ship.speed, getRacerTopSpeed(ship, topSpeed) * BOOST.entryMultiplier);
      ship.boostCount++;
      boosted = true;
    }
  }
  return boosted;
}

// Track-relative state is authoritative: impulses and separation survive the next pose update.
function moveBy(ship, frame, correction, curve) {
  if (ship.flight) { ship.flight.position.add(correction); return; }
  const from=ship.distance,branch=activeBranch(curve,ship);
  ship.distance = Math.max(0, ship.distance + correction.dot(frame.tangent) * routeMetric(curve,ship));
  if(branch)ship.distance=clamp(ship.distance,(ship.route.lap+branch.start)*curve.getLength()+1e-7,(ship.route.lap+branch.end)*curve.getLength()-1e-7);
  recordRaceProgress(curve,ship,from);
  ship.lateralOffset += correction.dot(frame.right);
}

function setVelocity(ship, frame, velocity) {
  if (ship.flight) ship.flight.velocity.copy(velocity);
  ship.speed = Math.max(12, velocity.dot(frame.tangent));
  ship.lateralVelocity = clamp(velocity.dot(frame.right) / 2, -15, 15);
  ship.velocity.copy(velocity);
}

export function createCollisionState() {
  return { cooldowns: new Map() };
}

export function resolveRacerCollisions(racers, curve, delta, state) {
  for (const [key, remaining] of state.cooldowns) {
    if (remaining <= delta) state.cooldowns.delete(key);
    else state.cooldowns.set(key, remaining - delta);
  }
  const length = curve.getLength();
  for (let i = 0; i < racers.length; i++) for (let j = i + 1; j < racers.length; j++) {
    const a = racers[i];
    const b = racers[j];
    if (a.finished || b.finished) continue;
    const sa = a.physics;
    const sb = b.physics;
    if (sa.recoveryTimer > 0 || sb.recoveryTimer > 0) continue;
    const frameA = getRacerFrame(curve, sa);
    const frameB = getRacerFrame(curve, sb);
    const separation = a.group.position.clone().sub(b.group.position);
    const radius = 2.2;
    let normal = separation.clone();
    let swept = false;
    const previous = sa.previousPosition.clone().sub(sb.previousPosition);
    const travel = separation.clone().sub(previous);
    const aa = travel.lengthSq();
    const bb = 2 * previous.dot(travel);
    const cc = previous.lengthSq() - radius * radius;
    const discriminant = bb * bb - 4 * aa * cc;
    if (aa >= 1e-8 && cc >= 0 && discriminant >= 0) {
      const t = (-bb - Math.sqrt(discriminant)) / (2 * aa);
      if (t >= 0 && t <= 1) {
        normal.copy(previous).addScaledVector(travel, t);
        swept = true;
      }
    }
    if (!swept && separation.lengthSq() >= radius * radius) continue;
    if (normal.lengthSq() < 1e-8) normal.copy(frameA.right);
    normal.normalize();
    const invA = 1 / sa.mass;
    const invB = 1 / sb.mass;
    const inverseMass = invA + invB;
    // Also rewind a swept crossing to the contact side, avoiding pass-through.
    const penetration = swept ? radius - separation.dot(normal) : radius - separation.length();
    const correction = normal.clone().multiplyScalar(Math.max(0, penetration) + 0.005);
    moveBy(sa, frameA, correction.clone().multiplyScalar(invA / inverseMass), curve);
    moveBy(sb, frameB, correction.clone().multiplyScalar(-invB / inverseMass), curve);
    a.group.position.addScaledVector(correction, invA / inverseMass);
    b.group.position.addScaledVector(correction, -invB / inverseMass);
    const closingSpeed = sa.velocity.clone().sub(sb.velocity).dot(normal);
    const key = `${a.id}:${b.id}`;
    if (closingSpeed >= -0.5 || state.cooldowns.has(key)) continue;
    const impulse = -(1 + 0.45) * closingSpeed / inverseMass;
    const velocityA = sa.velocity.clone().addScaledVector(normal, impulse * invA);
    const velocityB = sb.velocity.clone().addScaledVector(normal, -impulse * invB);
    const severity = clamp(-closingSpeed / 45, 0.08, 1);
    // A small dissipative loss on BOTH hulls makes a ram costly to the attacker too.
    velocityA.multiplyScalar(1 - severity * 0.14);
    velocityB.multiplyScalar(1 - severity * 0.14);
    setVelocity(sa, frameA, velocityA);
    setVelocity(sb, frameB, velocityB);
    registerImpact(sa, severity, normal.dot(frameA.right));
    registerImpact(sb, severity, -normal.dot(frameB.right));
    sa.craftHits++;
    sb.craftHits++;
    state.cooldowns.set(key, 0.12);
  spawnImpactSparks(
  sa.previousPosition.clone(),
  new THREE.Vector3(0, 1, 0),
  sa.velocity,
  severity
);
  spawnImpactSparks(
  sb.previousPosition.clone(),
  new THREE.Vector3(0, -1, 0),
  sb.velocity,
  severity
);
  }
}

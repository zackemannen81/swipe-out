import * as THREE from 'three';
import { BOOST, resolveWallImpact } from './race-interactions.js';
import { getRacerTopSpeed } from './catch-up.js';
import { getRacerFrame, getRacerWidth, advanceRouteDistance, recordRaceProgress, gapAt, nextGap } from './track-path.js';
import { launchAcrossGap, stepGapFlight, flightPose } from './gap-flight.js';
import { CLASSIC_HANDLING, stepClassicAttitude, stepClassicMomentum, stepClassicRoll } from './classic-handling.js';

// Konstanter för svävaren (kan flyttas överst i filen)
const GRAVITY = -26.0;         // Snabb arkad-gravitation i Y-led
const HOVER_TARGET = 1.25;     // Önskad svävarhöjd över marken
const HOVER_STRENGTH = 55.0;   // Fjäderstyrka när skeppet trycks ner
const HOVER_DAMPING = 9.0;     // Dämpning så att skeppet inte studsar oändligt

// A scale-adapted port of the original Wipeout ship dynamics.
// The original triangle/section collision system is replaced by the track frame
// supplied by SwipeOut, while retaining thrust build-up, skid, differential
// brakes, track adhesion, airborne gravity, angular inertia and edge impacts.
export function createShipPhysics(baseSpeed, tuning = {}) {
  return {
    handlingMode: tuning.handlingMode === 'wipeout' ? 'wipeout' : 'swipeout', classicRollVelocity: 0,
    route: null, routeDecision: '', routeEntries: 0, routeMerges: 0, gatesPassed: 0, completedLaps: 0, pendingFlightFrom: null,
    flight: null, recoveryTimer: 0, recoveries: 0, respawnSerial: 0, launches: 0, landings: 0,
    boostTimer: 0,        
    catchUpBonus: 0,
    catchUpGap: 0,
    tuning,
    mass: tuning.mass ?? 1,
    velocity: new THREE.Vector3(),
    previousPosition: new THREE.Vector3(),
    previousDistance: 0,
    previousLateralOffset: 0,
    previousVerticalOffset: 0,
    lastBoostKey: null,
    boostCount: 0,
    wallHits: 0,
    craftHits: 0,
    impactSerial: 0,
    impactStrength: 0,
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
    // ... dina andra variabler ...
    jumpCooldown: 0,
    previousSlope: 0,
    previousTangent: null, // NY: Håller koll på kurvans riktning
    assistLevel: 1.0,      // NY: 1.0 = Ingen drift (som nu), 0.0 = Full drift
    crashTimer: 0,
  };
}

const damp = (value, target, lambda, dt) =>
  THREE.MathUtils.damp(value, target, lambda, dt);

export function stepShipPhysics(ship, input, dt, curve, baseSpeed, trackWidth = 10) {
  const from = ship.distance;
  const pose = stepRoutePhysics(ship, input, dt, curve, baseSpeed, trackWidth);
  if (dt > 0) {
    recordRaceProgress(curve, ship, ship.pendingFlightFrom ?? from);
    if (!ship.flight) ship.pendingFlightFrom = null;
  }
  return pose;
}

function stepRoutePhysics(ship, input, dt, curve, baseSpeed, trackWidth) {
  if ((!curve.track?.magnetic && ship.handlingMode !== 'wipeout') || dt <= 1 / 120) return stepShipSubstep(ship, input, dt, curve, baseSpeed, trackWidth);
  const previous = { distance: ship.distance, lane: ship.lateralOffset, height: ship.verticalOffset,
    position: stepShipSubstep(ship, input, 0, curve, baseSpeed, trackWidth).position, serial: ship.respawnSerial };
  const steps = Math.ceil(dt / (1 / 120));
  let pose;
  for (let i = 0; i < steps; i++) pose = stepShipSubstep(ship, input, dt / steps, curve, baseSpeed, trackWidth);
  if (ship.respawnSerial === previous.serial) {
    ship.previousDistance = previous.distance; ship.previousLateralOffset = previous.lane;
    ship.previousVerticalOffset = previous.height; ship.previousPosition.copy(previous.position);
  }
  return pose;
}

function stepShipSubstep(ship, input, dt, curve, baseSpeed, trackWidth) {
  trackWidth = getRacerWidth(curve, ship, trackWidth);
  if (dt <= 0) {
    const frame = getFrame(curve, ship.distance, ship);
    return makePose(ship, frame, curve);
  }

  ship.previousDistance = ship.distance;
  ship.previousLateralOffset = ship.lateralOffset;
  ship.previousVerticalOffset = ship.verticalOffset;
  ship.previousPosition.copy(makePose(ship, getFrame(curve, ship.distance, ship), curve).position);

  if (ship.recoveryTimer > 0) {
    ship.recoveryTimer = Math.max(0, ship.recoveryTimer - dt);
    return makePose(ship, getFrame(curve, ship.distance, ship), curve);
  }
  ship.jumpCooldown = Math.max(0, ship.jumpCooldown - dt);
  ship.crashTimer = Math.max(0, ship.crashTimer - dt);
  ship.crashCooldown = Math.max(0, ship.crashCooldown - dt);
  ship.lastImpact = Math.max(0, ship.lastImpact - dt);
  ship.impactStrength = Math.max(0, ship.impactStrength - dt * 2.5);
ship.boostTimer = Math.max(0, ship.boostTimer - dt);

  const gap = gapAt(curve, ship.distance);
  if (!ship.flight && gap) launchAcrossGap(ship, curve, gap);
  if (ship.flight) {
    stepGapFlight(ship, input, dt, curve, baseSpeed, trackWidth);
    return makePose(ship, getFrame(curve, ship.distance, ship), curve);
  }

  // Original thrust rises while held and falls off when released.
  const thrustInput = THREE.MathUtils.clamp(input.thrust ?? 0, 0, 1);
  ship.thrust = ship.tuning.engineForce !== undefined
    ? damp(ship.thrust, thrustInput, 6, dt)
    : THREE.MathUtils.clamp(
    ship.thrust + (thrustInput > 0 ? 1.75 * thrustInput : -1.1) * dt,
    0,
    1,
  );
  const classic = ship.handlingMode === 'wipeout';
  if (classic) stepClassicAttitude(ship, input, dt);
  else {
  ship.brakeLeft = damp(ship.brakeLeft, input.brakeLeft ? 1 : 0, input.brakeLeft ? 5.8 : 7.5, dt);
  ship.brakeRight = damp(ship.brakeRight, input.brakeRight ? 1 : 0, input.brakeRight ? 5.8 : 7.5, dt);
  const brake = ship.brakeLeft + ship.brakeRight;
  // Angular acceleration / inertia, inspired by ship_player_update_race().
  const steer = THREE.MathUtils.clamp(-(input.steer ?? 0), -1, 1);
  const turnAcceleration = 3.7 + brake * 1.8;
  ship.yawVelocity += (steer * turnAcceleration - ship.yawVelocity * (steer === 0 ? 7.5 : 1.15)) * dt;
  ship.yawVelocity = THREE.MathUtils.clamp(ship.yawVelocity, -2.2, 2.2);
  ship.yaw = damp(ship.yaw, THREE.MathUtils.clamp(ship.yawVelocity * 0.15, -0.24, 0.24), 5.2, dt);
  ship.pitch = damp(ship.pitch, THREE.MathUtils.clamp(input.pitch ?? 0, -1, 1) * 0.09, 3.2, dt);
  }
  const brake = ship.brakeLeft + ship.brakeRight;
  const differentialBrake = ship.brakeLeft - ship.brakeRight;

  // Longitudinal force balance: thrust, drag and braking. Speed is in the
  // existing SwipeOut world scale, rather than the original PS1 fixed-point scale.
  const throttleForce = ship.thrust * (ship.tuning.engineForce ?? (classic ? CLASSIC_HANDLING.engineForce : 8));
  const baselineDrag = ship.speed * 0.045;
  const brakingForce = brake * (ship.tuning.brakeForce ?? 18);
  ship.speed += (throttleForce - baselineDrag - brakingForce) * dt;
  const maxSpeed = getRacerTopSpeed(ship, baseSpeed) * (ship.boostTimer > 0 ? BOOST.maxMultiplier : 1);
  ship.speed = THREE.MathUtils.clamp(ship.speed, 12, maxSpeed);

  // Find the current local track frame and preserve the original jump response
  // to a sharp downward change in track tangent.
  let frame = getFrame(curve, ship.distance, ship);
  // --- 1. KANTER OCH KRÖN-DETEKTION (Tröghetsöverföring) ---
  const currentSlope = frame.tangent.y;
  const slopeChange = (currentSlope - ship.previousSlope) / Math.max(dt, 0.001);
  ship.previousSlope = currentSlope;

  // Om banan viker nedåt (slopeChange < -0.1) och vi kör fort:
  // Kasta upp skeppet i luften baserat på framåthastigheten!
  if (!curve.track?.magnetic && !ship.airborne && ship.jumpCooldown <= 0 && slopeChange < -0.12) {
    const forwardInertia = (ship.speed / baseSpeed) * Math.abs(slopeChange) * 12.0;
    
    if (forwardInertia > 1.5) {
      ship.airborne = true;
      // Ge en vertikal stöt proportional mot hastigheten över krönet
      ship.verticalVelocity = THREE.MathUtils.clamp(forwardInertia, 4.0, 18.0);
      ship.jumpCooldown = 0.4; // Förhindra att den retriggerar direkt
    }
  }
  // --- 2. GRAVITATION OCH LUFTKUDDE ---
  const GRAVITY = 24.0;       // Normal tung arkadgravitation
  const HOVER_SPRING = 90.0;  // Fjäderkraft vid markkontakt
  const HOVER_DAMP = 10.0;    // Dämpning för mjuk landning

  if (curve.track?.magnetic) {
    ship.airborne = false; ship.verticalOffset = ship.verticalVelocity = 0;
  } else if (ship.airborne) {
    // I luften: Ren gravitation drar ner skeppet
    ship.verticalVelocity -= GRAVITY * dt;
    ship.verticalOffset += ship.verticalVelocity * dt;

    // Landningsdetektion när vi kommer ner till marknivå (verticalOffset <= 0)
    if (ship.verticalOffset <= 0) {
      ship.verticalOffset = 0;
      ship.verticalVelocity = 0;
      ship.airborne = false;
      ship.lastImpact = 0.2;
      ship.speed *= 0.94; // Mjuk landningsbroms
    }
  } else {
    // På marken: Envägs luftkudde som håller skeppet svävande
    const springForce = -ship.verticalOffset * HOVER_SPRING;
    const dampForce = ship.verticalVelocity * HOVER_DAMP;
    const hoverAccel = springForce - dampForce;

    ship.verticalVelocity += hoverAccel * dt;
    ship.verticalOffset += ship.verticalVelocity * dt;

    // Om vi gungar upp över markytan lättar skeppet mjukt
    if (ship.verticalOffset > 0.2) {
      ship.airborne = true;
    }
  }
  if (classic) stepClassicMomentum(ship, frame, dt);
  else {
// --- NY KOD: CENTRIFUGALKRAFT OCH DRIFT ---
  if (!ship.previousTangent) {
    ship.previousTangent = frame.tangent.clone();
  }
  
  // Dot-produkten mellan förra framens riktning och den nya "höger"-vektorn 
  // ger oss ett exakt mått på hur skarpt banan precis svängde.
  const trackTurnAmount = ship.previousTangent.dot(frame.right);
  const driftFactor = 1.0 - (ship.assistLevel ?? 1.0);
  
  // Omvandla svängen till en acceleration (skalad med hastighet). 0.06 är en justerbar styrkekonstant.
  const centrifugalAccel = (trackTurnAmount / Math.max(dt, 0.001)) * ship.speed * driftFactor * 0.1;
  ship.previousTangent.copy(frame.tangent);
  // ------------------------------------------

  // Wipeout's forward-velocity correction (skid) and weaker airborne grip.
  const grip = ship.airborne ? 1.0 : 4.5 + brake * 1.8;
  const speedRatio = THREE.MathUtils.clamp(ship.speed / baseSpeed, 0.35, 1.55);
  const yawLateralForce = ship.yawVelocity * ship.speed * 0.12;
  const brakeSteerForce = differentialBrake * ship.speed * 0.10;
  
  // ÄNDRING HÄR: Lägg till centrifugalAccel i beräkningen av lateralVelocity
  ship.lateralVelocity += (
    yawLateralForce + brakeSteerForce + centrifugalAccel - ship.lateralVelocity * grip
  ) * dt;

  ship.lateralVelocity = THREE.MathUtils.clamp(ship.lateralVelocity, -15, 15);
  //ship.lateralOffset += ship.lateralVelocity * dt * 2;
/*
const centeringForce = -ship.lateralOffset * (ship.assistLevel * 5.0); 
  ship.lateralOffset += (ship.lateralVelocity + centeringForce) * dt * 2;
*/
// Låt spelarens egen styrning (lateralVelocity) få motverka eller väga upp centeringForce
const steeringInput = input.steer ?? 0;
const centeringForce = -ship.lateralOffset * (ship.assistLevel * (ship.tuning.centeringStrength ?? 2.0));

// Om spelaren styr aktivt, dämpa centreringen så man kan svänga ut!
const effectiveCentering = THREE.MathUtils.lerp(centeringForce, 0, Math.abs(steeringInput));

ship.lateralOffset += (ship.lateralVelocity + effectiveCentering) * dt * 2;
  }

  // The original uses face collisions and track repulsion. SwipeOut's track is
  // a smooth ribbon, so the edge is handled as a damped impact instead.
  resolveWallImpact(ship, trackWidth, curve,dt);
  const outerLimit = trackWidth / 2 + 0.4;
  ship.lateralOffset = THREE.MathUtils.clamp(ship.lateralOffset, -outerLimit, outerLimit);

  // Track-relative bank and attitude damping.
  if (classic) stepClassicRoll(ship, dt);
  else {
  const desiredRoll = THREE.MathUtils.clamp(
    -(ship.lateralVelocity * 0.035 + ship.yawVelocity * 0.1),
    -0.38,
    0.38,
  );
  ship.roll = damp(ship.roll, desiredRoll, ship.airborne ? 5.5 : 10.6, dt);
  }

  // Progress advances with forward speed, not with steering input.
  const boundary = nextGap(curve, ship.distance);
  const targetDistance = ship.distance + ship.speed * dt;
  if (boundary && boundary.start <= targetDistance) {
    const remaining = (targetDistance - boundary.start) / ship.speed;
    ship.distance = boundary.start;
    launchAcrossGap(ship, curve, boundary);
    stepGapFlight(ship, input, remaining, curve, baseSpeed, trackWidth);
  } else advanceRouteDistance(curve, ship, ship.speed * dt);
  frame = getFrame(curve, ship.distance, ship);
  return makePose(ship, frame, curve);
}

function getFrame(curve, distance, ship) {
  return getRacerFrame(curve, ship, distance / curve.getLength());
}

function makePose(ship, frame, curve) {
  if (ship.flight) return flightPose(ship, curve);
  ship.velocity.copy(frame.tangent).multiplyScalar(ship.speed)
    .addScaledVector(frame.right, ship.lateralVelocity * 2)
    .addScaledVector(frame.normal, ship.verticalVelocity);
  const position = frame.center.clone()
    .addScaledVector(frame.right, ship.lateralOffset)
    .addScaledVector(frame.normal, 0.62 + ship.verticalOffset);
  const orientation = frame.rotation.clone();
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ship.yaw));
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ship.pitch));
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ship.roll*2));
  return { frame, position, orientation };
}

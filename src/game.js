import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RaceAudio } from './audio.js';
import './style.css';
import { createCraft, loadCraftModel } from './craft.js';
import { createTrack, getTrackFrame } from './track.js';
import { NEON_CAUSEWAY, SYNTHETIC_DREAMS, DIGITAL_HORIZON } from './track-data.js';
import { createShipPhysics, stepShipPhysics } from './ship-physics.js';
import { createOpponents, getPlayerPosition, resetOpponents, updateOpponents } from './opponents.js';

const canvas = document.querySelector('#game-canvas');
const startScreen = document.querySelector('#start-screen');
const resultsScreen = document.querySelector('#results-screen');
const startButton = document.querySelector('#start-button');
const retryButton = document.querySelector('#retry-button');
const timerDisplay = document.querySelector('#race-time');
const resultDisplay = document.querySelector('#result-time');
const lapDisplay = document.querySelector('#race-lap');
const positionDisplay = document.querySelector('#race-position');
const resultPositionDisplay = document.querySelector('#result-position');
const speedDisplay = document.querySelector('#race-speed');
const minimapRoute = document.querySelector('#minimap-route');
const minimapStart = document.querySelector('#minimap-start');
const minimapPlayer = document.querySelector('#minimap-player');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080c0a);
scene.fog = new THREE.FogExp2(0x080d18, 0.00065);

const TRACK_CONFIG = {
  'track1': { name: 'Neon Causeway', data: NEON_CAUSEWAY, defaultAudio: '/audio/tracks/track_001.mp3' },
  'track2': { name: 'Synthetic Dreams', data: SYNTHETIC_DREAMS, defaultAudio: '/audio/tracks/track_003.mp3' },
  'track3': { name: 'Digital Horizon', data: DIGITAL_HORIZON, defaultAudio: '/audio/tracks/track_006.mp3' }
};

let currentTrackId = 'track1'; 
// Ändra din raceAudio till att vara en let istället för const så vi kan byta ut den
let raceAudio = new RaceAudio(TRACK_CONFIG[currentTrackId].defaultAudio);

const panoramaTexture = new THREE.TextureLoader().load(
  '/images/backdrop_track-001.jpg',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  },
  undefined,
  (error) => console.warn('Unable to load panorama backdrop.', error),
);
panoramaTexture.colorSpace = THREE.SRGBColorSpace;
const panoramaBackdrop = new THREE.Mesh(
  new THREE.CylinderGeometry(196, 196, 376, 128, 4, true),
  new THREE.MeshBasicMaterial({
    map: panoramaTexture,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: true,
  }),
);
panoramaBackdrop.renderOrder = -10;
scene.add(panoramaBackdrop);

const camera = new THREE.PerspectiveCamera(53, 1, 0.1, 220);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.78, 0.7, 0.78);
composer.addPass(bloomPass);

scene.add(new THREE.HemisphereLight(0x98c8ff, 0x111421, 1.8));
const keyLight = new THREE.DirectionalLight(0xd8e8ff, 2.8);
keyLight.position.set(-15, 28, 12);
scene.add(keyLight);
const cyanLight = new THREE.PointLight(0x32f4e8, 80, 46);
cyanLight.position.set(18, 12, 22);
scene.add(cyanLight);
const pinkLight = new THREE.PointLight(0xff397b, 80, 42);
pinkLight.position.set(-24, 10, -16);
scene.add(pinkLight);

const savedTrack = (() => {
  try {
    const value = JSON.parse(localStorage.getItem('swipe-out-track-definition'));
    return value?.centerline?.length >= 4 ? value : NEON_CAUSEWAY;
  } catch (error) {
    console.warn('Unable to load saved track definition.', error);
    return NEON_CAUSEWAY;
  }
})();
const { group: track, curve } = createTrack(savedTrack);
scene.add(track);

function setupMinimap() {
  const samples = 160;
  const points = Array.from({ length: samples }, (_, index) => {
    const frame = getTrackFrame(curve, index / samples);
    return { x: frame.center.x, z: frame.center.z };
  });
  const minX = Math.min(...points.map(({ x }) => x));
  const maxX = Math.max(...points.map(({ x }) => x));
  const minZ = Math.min(...points.map(({ z }) => z));
  const maxZ = Math.max(...points.map(({ z }) => z));
  const scale = Math.min(84 / Math.max(maxX - minX, 1), 84 / Math.max(maxZ - minZ, 1));
  const toMapPoint = ({ x, z }) => `${50 + (x - (minX + maxX) / 2) * scale},${50 + (z - (minZ + maxZ) / 2) * scale}`;
  minimapRoute.setAttribute('points', points.map(toMapPoint).join(' '));
  minimapStart.setAttribute('cx', 50 + (points[0].x - (minX + maxX) / 2) * scale);
  minimapStart.setAttribute('cy', 50 + (points[0].z - (minZ + maxZ) / 2) * scale);
  minimapPlayer.dataset.mapBounds = JSON.stringify({ minX, maxX, minZ, maxZ, scale });
}

function updateMinimap(position) {
  const { minX, maxX, minZ, maxZ, scale } = JSON.parse(minimapPlayer.dataset.mapBounds);
  minimapPlayer.setAttribute('cx', 50 + (position.x - (minX + maxX) / 2) * scale);
  minimapPlayer.setAttribute('cy', 50 + (position.z - (minZ + maxZ) / 2) * scale);
}

setupMinimap();
const { group: craft, engineMaterials, thrusterMaterials, thrusters, glow } = createCraft();
scene.add(craft);

const speedTrails = [-1, 1].map((side) => {
  const material = new THREE.MeshBasicMaterial({
    color: side < 0 ? 0xff4388 : 0x5cf5ec,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.8), material);
  trail.position.set(side * 0.84, -0.12, 0.78);
  trail.rotation.x = -Math.PI / 2;
  trail.visible = false;
  craft.add(trail);
  return trail;
});

loadCraftModel({ group: craft })
  .catch((error) => console.warn('Unable to load racer model; using procedural craft.', error));
const opponents = createOpponents();
for (const opponent of opponents) scene.add(opponent.group);

const clock = new THREE.Clock();
//const raceAudio = new RaceAudio(RACE_TRACK_AUDIO);

// --- KAMERASYSTEM INTEGRATION (Vänd 180 grader för att titta framåt) ---
const cameraSystem = {
  previousMode: 'external',
  modeTimer: 0,
  orbitAngle: 0,
  orbitSpeed: 0.55,
  mode: 'external', // 'external' (chase-vy bakifrån) eller 'internal' (cockpit-vy)
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  lastPosition: new THREE.Vector3(),
  lookTarget: new THREE.Vector3(),
  currentLook: new THREE.Vector3(),
  shakeTimer: 0,
  shakeIntensity: 0.25,

  setShake(duration) {
    this.shakeTimer = duration;
  },

  update(craftPosition, craftQuaternion, craftVelocity, delta, trackFrame) {
    this.lastPosition.copy(this.position);

    switch (this.mode) {
    case 'internal':
    {  
    // Cockpit-vy
      const cockpitOffset = new THREE.Vector3(0, 0.4, 0.2);
      this.position.copy(craftPosition).add(cockpitOffset.applyQuaternion(craftQuaternion));
      
      const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(craftQuaternion);
      this.lookTarget.copy(this.position).add(forwardDir.multiplyScalar(10));
      break;
    }
 /*   case 'external':
      {
      // Extern / Chase-vy (Vänd 180 grader: Z är nu positivt bakåt, så kameran hamnar bakom skeppet)
      const idealOffset = new THREE.Vector3(0, 3.3, -11.2).applyQuaternion(craftQuaternion);
      const desiredPos = craftPosition.clone().add(idealOffset);

      // Tröghet och studs
      const displacement = desiredPos.clone().sub(this.position);
      this.velocity.addScaledVector(displacement, delta * 15.0);
      this.velocity.multiplyScalar(Math.max(0, 1 - delta * 8.0));
      this.position.addScaledVector(this.velocity, delta * 30.0);

      this.position.lerp(desiredPos, 1 - Math.exp(-4.5 * delta));

      // Titta framåt i skeppets riktning istället för bakåt
      const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(craftQuaternion);
      this.lookTarget.copy(craftPosition).add(forwardDir.multiplyScalar(12));
  
  this.lookTarget.y += 0.3;
  break;

    };*/
        
   case 'external': {
  // Kameran följer banans riktning i stället för
  // att reagera direkt på skeppets rotation.
        const speedBlend = THREE.MathUtils.clamp((race.currentSpeed - baseSpeed) / (104 - baseSpeed), 0, 1);
  // Pull the chase camera 25% closer as the ship approaches maximum speed.
  const chaseDistance = THREE.MathUtils.lerp(6.2, 5.4, speedBlend);
  const chaseHeight = THREE.MathUtils.lerp(3.3, 2.8, speedBlend);
  const idealOffset = new THREE.Vector3(0, chaseHeight, -chaseDistance).applyQuaternion(craftQuaternion);
  const forward = trackFrame.tangent.clone().normalize();

  const worldUp = new THREE.Vector3(0, 1, 0);

  const desiredPos = craftPosition.clone()
  .add(idealOffset)
    //.addScaledVector(forward, -2.2)
    .addScaledVector(worldUp, 2.8);

  // Mjuk, tidsbaserad förflyttning mot målpositionen.
  this.position.lerp(
    desiredPos,
    1 - Math.exp(-3.8 * delta)
  );

  // Blickpunkten ligger framför skeppet längs banan.
  
  this.lookTarget.copy(craftPosition)
    .addScaledVector(forward, 9);

  this.lookTarget.y += 3.8;
  break;
}

case 'circle': {
  this.orbitAngle += delta * this.orbitSpeed;

  const offset = new THREE.Vector3(
    Math.sin(this.orbitAngle) * 10,
    3.2,
    -Math.cos(this.orbitAngle) * 10
  );

  this.position.copy(craftPosition).add(offset);
  this.lookTarget.copy(craftPosition);
  this.lookTarget.y += 0.5;
  break;
}

    case 'static': {
      // En fast kamerastation vid sidan av banan.
    // trackFrame.center förutsätter att trackFrame skickas in.
      const side = trackFrame?.right ?? new THREE.Vector3(1, 0, 0);

    this.position.copy(trackFrame.center)
        .addScaledVector(side, 7)
        .add(new THREE.Vector3(0, 2.5, 0));

      this.lookTarget.copy(craftPosition);
      break;
    }
  }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const s = this.shakeIntensity * Math.max(0, this.shakeTimer);
      this.position.x += (Math.random() - 0.5) * s;
      this.position.y += (Math.random() - 0.5) * s;
    }

    camera.position.copy(this.position);

if (this.mode === 'circle' || this.mode === 'static') {
  this.currentLook.copy(this.lookTarget); // Titta direkt på skeppet
} else {
  this.currentLook.lerp(this.lookTarget, 1 - Math.exp(-3.0 * delta)); // Behåll mjukheten i andra lägen
}

camera.lookAt(this.currentLook);


  },

  toggleMode() {
    this.mode = this.mode === 'external' ? 'internal' : 'external';
  },
  cycleMode() {
  const modes = ['external', 'internal', 'circle', 'static'];
  const index = modes.indexOf(this.mode);
  this.mode = modes[(index + 1) % modes.length];

  // Undvik att kameran drar med sig hastighet från föregående läge.
  this.velocity.set(0, 0, 0);
  this.orbitAngle = 0;
  }
};

const drag = { active: false, lastX: 0, pointerId: null, throttle: 0 };
const heldKeys = new Set();
const shipPhysics = createShipPhysics(65);
const race = {
  state: 'ready', distance: 0, elapsed: 0, steering: 0, targetSteering: 0, drift: 0,
  lateralVelocity: 0, roll: 0, currentSpeed: 65, throttleTarget: 0, keyboardThrottle: 0, playerFinishTime: null,
  airborne: false, airWorldY: 0, airVelocity: 0, previousSlope: 0, jumpCooldown: 0,
  crashTimer: 0, crashCooldown: 0,
};
const baseSpeed = 65;
const totalLaps = 3;
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${String(minutes).padStart(2, '0')}:${remainder}`;
}

function setScreen(screen, visible) {
  screen.hidden = !visible;
  screen.setAttribute('aria-hidden', String(!visible));
}

function updateCraftPose(delta = 0) {
  const input = {
    steer: race.steering,
    thrust: Math.max(0, race.throttleTarget),
    brakeLeft: heldKeys.has('q') || race.throttleTarget < -0.1,
    brakeRight: heldKeys.has('e') || race.throttleTarget < -0.1,
    pitch: (heldKeys.has('r') ? 1 : 0) - (heldKeys.has('f') ? 1 : 0),
  };
  const pose = race.state === 'racing' && delta > 0
    ? stepShipPhysics(shipPhysics, input, delta, curve, baseSpeed)
    : stepShipPhysics(shipPhysics, input, 0, curve, baseSpeed);

  race.distance = shipPhysics.distance;
  race.currentSpeed = shipPhysics.speed;
  race.lateralVelocity = shipPhysics.lateralVelocity;
  race.airborne = shipPhysics.airborne;
  race.airWorldY = shipPhysics.verticalOffset;
  race.roll = shipPhysics.roll;
  race.crashTimer = shipPhysics.crashTimer;
  craft.position.copy(pose.position);
  craft.quaternion.copy(pose.orientation);
  return pose;
}

function beginRace() {
  raceAudio.play().catch((error) => console.warn('Unable to start race music.', error));
  race.state = 'racing';
  Object.assign(shipPhysics, createShipPhysics(baseSpeed));
  shipPhysics.previousSlope = getTrackFrame(curve, 0).tangent.y;
  race.distance = 0;
  race.elapsed = 0;
  race.steering = 0;
  race.targetSteering = 0;
  race.lateralVelocity = 0;
  race.roll = 0;
  race.drift = 0;
  race.currentSpeed = baseSpeed;
  race.throttleTarget = 0;
  race.keyboardThrottle = 0;
  race.playerFinishTime = null;
  resetOpponents(opponents);
  race.airborne = false;
  race.airWorldY = 0;
  race.airVelocity = 0;
  race.previousSlope = getTrackFrame(curve, 0).tangent.y;
  race.jumpCooldown = 0;
  race.crashTimer = 0;
  race.crashCooldown = 0;
  heldKeys.clear();
  drag.active = false;
  drag.throttle = 0;
  timerDisplay.textContent = '00:00.00';
  lapDisplay.textContent = `01 / ${String(totalLaps).padStart(2, '0')}`;
  positionDisplay.textContent = '1 / 3';
  resultPositionDisplay.textContent = '1 / 3';
  setScreen(startScreen, false);
  setScreen(resultsScreen, false);
  canvas.focus({ preventScroll: true });
}

function finishRace() {
  raceAudio.stop();
  race.state = 'finished';
  race.playerFinishTime = race.elapsed;
  positionDisplay.textContent = `${getPlayerPosition(opponents, race.distance, race.playerFinishTime)} / 3`;
  resultPositionDisplay.textContent = positionDisplay.textContent;
  drag.active = false;
  resultDisplay.textContent = formatTime(race.elapsed);
  setScreen(resultsScreen, true);
  retryButton.focus({ preventScroll: true });
}

startButton.addEventListener('click', beginRace);
retryButton.addEventListener('click', beginRace);

canvas.addEventListener('pointerdown', (event) => {
  if (race.state !== 'racing' || event.button !== 0) return;
  drag.active = true;
  drag.lastX = event.clientX;
  drag.pointerId = event.pointerId;
  drag.throttle = getVerticalThrottle(event.clientY);
  canvas.setPointerCapture(event.pointerId);
});
function getVerticalThrottle(y) {
  const normalized = THREE.MathUtils.clamp(y / Math.max(viewportHeight, 1), 0, 1);
  return THREE.MathUtils.clamp((0.5 - normalized) * 2, -1, 1);
}

canvas.addEventListener('pointermove', (event) => {
  if (!drag.active || event.pointerId !== drag.pointerId || race.state !== 'racing') return;
  const delta = event.clientX - drag.lastX;
  drag.lastX = event.clientX;
  drag.throttle = getVerticalThrottle(event.clientY);
  race.targetSteering = THREE.MathUtils.clamp(
    race.targetSteering + (delta / Math.max(viewportWidth, 1)) * 5.5,
    -1,
    1,
  );
});
function releasePointer(event) {
  if (event.pointerId !== drag.pointerId) return;
  drag.active = false;
  drag.pointerId = null;
  drag.throttle = 0;
  race.targetSteering = 0;
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  
  // Växla kameraläge med 'v'
  if (key === 'v') {
    cameraSystem.toggleMode();
    return;
  }
  if (key === 'c') {
  cameraSystem.cycleMode();
  }

  if (race.state !== 'racing') return;
  if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'arrowright', 'a', 'd', 'q', 'e', 'r', 'f'].includes(key)) {
    event.preventDefault();
  }
  heldKeys.add(key);
  if (key === 'arrowup' || key === 'w') race.keyboardThrottle = 1;
  if (key === 'arrowdown' || key === 's') race.keyboardThrottle = -1;
  if (key === 'arrowleft' || key === 'a') race.targetSteering = 1;
  if (key === 'arrowright' || key === 'd') race.targetSteering = -1;
});
window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  heldKeys.delete(key);
  if (['arrowup', 'w', 'arrowdown', 's'].includes(key)) race.keyboardThrottle = 0;
  if (['arrowleft', 'a', 'arrowright', 'd'].includes(key)) {
    const left = heldKeys.has('arrowleft') || heldKeys.has('a');
    const right = heldKeys.has('arrowright') || heldKeys.has('d');
    race.targetSteering = left === right ? 0 : left ? -1 : 1;
  }
});
window.addEventListener('blur', () => {
  heldKeys.clear();
  drag.active = false;
  drag.throttle = 0;
  race.keyboardThrottle = 0;
  race.targetSteering = 0;
});

function resize() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  camera.aspect = width / height;
  camera.fov = width < 700 ? 54 : 46;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
}
window.addEventListener('resize', resize, { passive: true });
resize();

function render() {
  const delta = Math.min(clock.getDelta(), 0.05);
  let crossedFinish = false;
  if (race.state === 'racing') {
    race.elapsed += delta;
    raceAudio.update(delta);
    race.throttleTarget = drag.active ? drag.throttle : race.keyboardThrottle;
    race.steering = THREE.MathUtils.damp(
      race.steering,
      race.targetSteering,
      race.airborne ? 2.7 : 4.8,
      delta,
    );
    updateCraftPose(delta);
    const completedLaps = Math.floor(race.distance / curve.getLength());
    const currentLap = Math.min(completedLaps + 1, totalLaps);
    const lapProgress = race.distance / curve.getLength() - completedLaps;
    timerDisplay.textContent = formatTime(race.elapsed);
    lapDisplay.textContent = `${String(currentLap).padStart(2, '0')} / ${String(totalLaps).padStart(2, '0')}${currentLap === totalLaps && lapProgress >= 0.72 ? ' · FINAL' : ''}`;
    crossedFinish = race.distance >= curve.getLength() * totalLaps;
  } else {
    race.steering = THREE.MathUtils.damp(race.steering, race.targetSteering, 7.5, delta);
    updateCraftPose(0);
  }

  updateMinimap(craft.position);
  const trackFrame = getTrackFrame(curve, race.distance / curve.getLength());

  if (race.state === 'racing') {
    updateOpponents(opponents, curve, delta, race.elapsed, true);
  } else {
    updateOpponents(opponents, curve, 0, race.elapsed, false);
  }
  if (crossedFinish) finishRace();
  positionDisplay.textContent = `${getPlayerPosition(opponents, race.distance, race.playerFinishTime)} / 3`;

  // Aktivera kameraskakning om skeppet kraschar
  if (race.crashTimer > 0) {
    cameraSystem.setShake(0.3);
  }

  // Kör det nya integrerade kamerapasset
  cameraSystem.update(craft.position, craft.quaternion, shipPhysics.velocity, delta, trackFrame);
  
  panoramaBackdrop.position.copy(camera.position);

  const kick = race.state === 'racing' ? raceAudio.channels.kick : { hitValue: 0 };
  const bass = race.state === 'racing' ? raceAudio.channels.bass : { value: 0 };
  bloomPass.strength = 0.62 + kick.hitValue * 0.55 + bass.value * 0.12;
  const pulse = 0.78 + Math.sin(clock.elapsedTime * 19) * 0.12 + kick.hitValue * 0.75;
  engineMaterials.forEach((material) => material.color.setRGB(0.28 * pulse, 0.95 * pulse, 0.9 * pulse));
  const thrusterPower = 0.72 + bass.value * 0.85 + kick.hitValue * 0.72;
  thrusters.forEach((thruster, index) => {
    thruster.visible = race.state === 'racing';
    thruster.scale.set(
      0.82 + thrusterPower * 0.22,
      thrusterPower * (1 + Math.sin(clock.elapsedTime * 31 + index * Math.PI) * 0.08),
      0.82 + thrusterPower * 0.22,
    );
  });
  const trailPower = race.state === 'racing' ? THREE.MathUtils.clamp(0.18 + bass.value * 0.42 + kick.hitValue * 0.35, 0.18, 0.9) : 0;
  speedTrails.forEach((trail, index) => {
    trail.visible = race.state === 'racing';
    trail.scale.y = trailPower * (0.82 + Math.sin(clock.elapsedTime * 23 + index * 2.4) * 0.12);
    trail.material.opacity = trailPower * 0.38;
  });
  thrusterMaterials.forEach((material) => {
    material.opacity = race.state === 'racing' ? THREE.MathUtils.clamp(0.36 + thrusterPower * 0.14, 0.36, 0.82) : 0;
  });
  glow.intensity = 2.4 + pulse * 1.2 + kick.hitValue * 5.5 + bass.value * 2.4;
  speedDisplay.textContent = race.state === 'racing'
    ? `${race.airborne ? 'AIR' : race.throttleTarget > 0.1 ? 'THRUST' : race.throttleTarget < -0.1 ? 'BRAKE' : 'AUTO'} · ${Math.round(race.currentSpeed * 36)} KM/H`
    : 'AUTO · READY';
  composer.render();
  requestAnimationFrame(render);
}
updateCraftPose();
render();

window.addEventListener('pagehide', () => {
  window.removeEventListener('resize', resize);
  renderer.dispose();
  scene.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
  });
}, { once: true });
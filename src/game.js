import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RaceAudio, RACE_TRACK_AUDIO } from './audio.js';
import './style.css';
import { createCraft, loadCraftModel } from './craft.js';
import { createTrack, getTrackFrame } from './track.js';
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
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d18);
scene.fog = new THREE.FogExp2(0x080d18, 0.0065);

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
  new THREE.CylinderGeometry(190, 190, 380, 96, 1, true),
  new THREE.MeshBasicMaterial({
    map: panoramaTexture,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
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
const cyanLight = new THREE.PointLight(0x32f4e8, 75, 46);
cyanLight.position.set(18, 12, 22);
scene.add(cyanLight);
const pinkLight = new THREE.PointLight(0xff397b, 58, 42);
pinkLight.position.set(-24, 10, -16);
scene.add(pinkLight);

const { group: track, curve } = createTrack();
scene.add(track);
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
const raceAudio = new RaceAudio(RACE_TRACK_AUDIO);
const cameraLook = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const drag = { active: false, lastX: 0, pointerId: null, throttle: 0 };
const race = {
  state: 'ready', distance: 0, elapsed: 0, steering: 0, targetSteering: 0, drift: 0,
  currentSpeed: 65, throttleTarget: 0, keyboardThrottle: 0, playerFinishTime: null,
  airborne: false, airWorldY: 0, airVelocity: 0, previousSlope: 0, jumpCooldown: 0,
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
  const progress = race.distance / curve.getLength();
  const frame = getTrackFrame(curve, progress);
  const slope = frame.tangent.y;
  const slopeChange = (slope - race.previousSlope) / Math.max(delta, 1 / 120);
  race.previousSlope = slope;
  race.jumpCooldown = Math.max(0, race.jumpCooldown - delta);

  if (race.state === 'racing' && !race.airborne && race.jumpCooldown === 0 && slopeChange < -0.18) {
    race.airborne = true;
    race.airVelocity = THREE.MathUtils.clamp(-slopeChange * 20, 3.5, 8);
    race.jumpCooldown = 0.55;
  }
  if (race.airborne) {
    race.airVelocity -= 6.4 * delta;
    race.airWorldY += race.airVelocity * delta;
    if (race.airWorldY <= 0) {
      race.airWorldY = 0;
      race.airVelocity = 0;
      race.airborne = false;
    }
  }

  race.drift = THREE.MathUtils.damp(
    race.drift,
    race.targetSteering * (race.airborne ? 0.34 : 0.16),
    race.airborne ? 1.25 : 2.4,
    delta,
  );
  const position = frame.center.clone()
    .addScaledVector(frame.right, THREE.MathUtils.clamp(race.steering + race.drift, -3.7, 3.7))
    .addScaledVector(frame.normal, 0.62 + race.airWorldY);
  craft.position.copy(position);
  craft.quaternion.copy(frame.rotation);
  craft.rotateZ(-THREE.MathUtils.clamp(race.targetSteering - race.steering, -0.7, 0.7) * 0.16);
  return { frame, position };
}

function beginRace() {
  raceAudio.play().catch((error) => console.warn('Unable to start race music.', error));
  race.state = 'racing';
  race.distance = 0;
  race.elapsed = 0;
  race.steering = 0;
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
    race.targetSteering + (delta / Math.max(viewportWidth, 1)) * 15,
    -3.15,
    3.15,
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
  if (race.state !== 'racing') return;
  if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(event.key)) {
    event.preventDefault();
    race.keyboardThrottle = event.key === 'ArrowUp' || event.key.toLowerCase() === 'w' ? 1 : -1;
    return;
  }
  if (!['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a' ? -1 : 1;
  race.targetSteering = THREE.MathUtils.clamp(race.targetSteering + direction * 0.52, -3.15, 3.15);
});
window.addEventListener('keyup', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(event.key)) race.targetSteering = 0;
  if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(event.key)) race.keyboardThrottle = 0;
});
window.addEventListener('blur', () => {
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
    const speedTarget = baseSpeed * (1 + race.throttleTarget * 0.3);
    race.currentSpeed = THREE.MathUtils.damp(race.currentSpeed, speedTarget, 2.8, delta);
    race.distance += race.currentSpeed * delta;
    race.steering = THREE.MathUtils.damp(race.steering, race.targetSteering, race.airborne ? 4.8 : 7.5, delta);
    const completedLaps = Math.floor(race.distance / curve.getLength());
    const currentLap = Math.min(completedLaps + 1, totalLaps);
    const lapProgress = race.distance / curve.getLength() - completedLaps;
    timerDisplay.textContent = formatTime(race.elapsed);
    lapDisplay.textContent = `${String(currentLap).padStart(2, '0')} / ${String(totalLaps).padStart(2, '0')}${currentLap === totalLaps && lapProgress >= 0.72 ? ' · FINAL' : ''}`;
    crossedFinish = race.distance >= curve.getLength() * totalLaps;
  } else {
    race.steering = THREE.MathUtils.damp(race.steering, race.targetSteering, 7.5, delta);
  }

  const { frame, position } = updateCraftPose(delta);
  if (race.state === 'racing') {
    updateOpponents(opponents, curve, delta, race.elapsed, true);
  } else {
    updateOpponents(opponents, curve, 0, race.elapsed, false);
  }
  if (crossedFinish) finishRace();
  positionDisplay.textContent = `${getPlayerPosition(opponents, race.distance, race.playerFinishTime)} / 3`;
  desiredCameraPosition.copy(position).addScaledVector(frame.tangent, -3.6);
  desiredCameraPosition.y += 1.72;
  camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-3.6 * delta));
  lookTarget.copy(position).addScaledVector(frame.tangent, 9);
  lookTarget.y += 0.25;
  cameraLook.lerp(lookTarget, 1 - Math.exp(-4.8 * delta));
  camera.lookAt(cameraLook);
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

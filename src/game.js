import * as THREE from 'three';
import './style.css';
import { createCraft } from './craft.js';
import { createTrack, getTrackFrame } from './track.js';

const canvas = document.querySelector('#game-canvas');
const startScreen = document.querySelector('#start-screen');
const resultsScreen = document.querySelector('#results-screen');
const startButton = document.querySelector('#start-button');
const retryButton = document.querySelector('#retry-button');
const timerDisplay = document.querySelector('#race-time');
const resultDisplay = document.querySelector('#result-time');
const lapDisplay = document.querySelector('#race-lap');
const speedDisplay = document.querySelector('#race-speed');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d18);
scene.fog = new THREE.FogExp2(0x080d18, 0.0065);

const camera = new THREE.PerspectiveCamera(53, 1, 0.1, 220);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

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

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x0a101b, roughness: 0.92, metalness: 0.12 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.4;
scene.add(ground);
const grid = new THREE.GridHelper(260, 130, 0x16464e, 0x152131);
grid.position.y = -0.37;
grid.material.transparent = true;
grid.material.opacity = 0.26;
scene.add(grid);

const { group: track, curve } = createTrack();
scene.add(track);
const { group: craft, engineMaterials, glow } = createCraft();
scene.add(craft);

const clock = new THREE.Clock();
const cameraLook = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const drag = { active: false, lastX: 0, pointerId: null };
const race = { state: 'ready', distance: 0, elapsed: 0, steering: 0, targetSteering: 0 };
const speed = 17.5;
let viewportWidth = window.innerWidth;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${String(minutes).padStart(2, '0')}:${remainder}`;
}

function setScreen(screen, visible) {
  screen.hidden = !visible;
  screen.setAttribute('aria-hidden', String(!visible));
}

function updateCraftPose() {
  const progress = race.distance / curve.getLength();
  const frame = getTrackFrame(curve, progress);
  const position = frame.center.clone().addScaledVector(frame.right, race.steering);
  position.y = 0.62;
  craft.position.copy(position);
  craft.rotation.set(0, frame.yaw, -THREE.MathUtils.clamp(race.targetSteering - race.steering, -0.7, 0.7) * 0.16);
  return { frame, position };
}

function beginRace() {
  race.state = 'racing';
  race.distance = 0;
  race.elapsed = 0;
  race.steering = 0;
  race.targetSteering = 0;
  drag.active = false;
  timerDisplay.textContent = '00:00.00';
  lapDisplay.textContent = '01 / 01';
  setScreen(startScreen, false);
  setScreen(resultsScreen, false);
  canvas.focus({ preventScroll: true });
}

function finishRace() {
  race.state = 'finished';
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
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag.active || event.pointerId !== drag.pointerId || race.state !== 'racing') return;
  const delta = event.clientX - drag.lastX;
  drag.lastX = event.clientX;
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
  race.targetSteering = 0;
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);

window.addEventListener('keydown', (event) => {
  if (race.state !== 'racing' || !['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a' ? -1 : 1;
  race.targetSteering = THREE.MathUtils.clamp(race.targetSteering + direction * 0.52, -3.15, 3.15);
});
window.addEventListener('keyup', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(event.key)) race.targetSteering = 0;
});
window.addEventListener('blur', () => {
  drag.active = false;
  race.targetSteering = 0;
});

function resize() {
  viewportWidth = window.innerWidth;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  camera.aspect = width / height;
  camera.fov = width < 700 ? 62 : 53;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize, { passive: true });
resize();

function render() {
  const delta = Math.min(clock.getDelta(), 0.05);
  if (race.state === 'racing') {
    race.elapsed += delta;
    race.distance += speed * delta;
    race.steering = THREE.MathUtils.damp(race.steering, race.targetSteering, 7.5, delta);
    timerDisplay.textContent = formatTime(race.elapsed);
    lapDisplay.textContent = race.distance >= curve.getLength() * 0.72 ? '01 / 01 · FINAL' : '01 / 01';
    if (race.distance >= curve.getLength()) finishRace();
  } else {
    race.steering = THREE.MathUtils.damp(race.steering, race.targetSteering, 7.5, delta);
  }

  const { frame, position } = updateCraftPose();
  desiredCameraPosition.copy(position).addScaledVector(frame.tangent, -12.5);
  desiredCameraPosition.y += 7.1;
  camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-3.8 * delta));
  lookTarget.copy(position).addScaledVector(frame.tangent, 7.8);
  lookTarget.y += 0.5;
  cameraLook.lerp(lookTarget, 1 - Math.exp(-5.5 * delta));
  camera.lookAt(cameraLook);

  const pulse = 0.78 + Math.sin(clock.elapsedTime * 19) * 0.22;
  engineMaterials.forEach((material) => material.color.setRGB(0.28 * pulse, 0.95 * pulse, 0.9 * pulse));
  glow.intensity = 2.4 + pulse;
  speedDisplay.textContent = race.state === 'racing' ? 'AUTO · 630 KM/H' : 'AUTO · READY';
  renderer.render(scene, camera);
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

import * as THREE from 'three';
import { load, parse } from 'opentype.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RaceAudio } from './audio.js';
import './style.css';
import { createCraft, loadCraftModel } from './craft.js';
import { spawnTrackObjects, createTrack, getTrackFrame } from './track.js';
import { NEON_CAUSEWAY, SYNTHETIC_DREAMS, DIGITAL_HORIZON, MOMMY_IM_SCARED ,DARK_SKIES, GEMINI,THE_JOKER,THE_VOID, AGENT_008_STAGE,ION_CATHEDRAL} from './track-data.js';
import { createShipPhysics, stepShipPhysics } from './ship-physics.js';
import { createOpponents, getPlayerPosition, resetOpponents, updateOpponents,resolveCraftCollisions } from './opponents.js';
import Nebula, { SpriteRenderer, Rate, Span } from 'three-nebula';
import thrusterConfig from './thruster.json';

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
const STORAGE_KEY = 'swipe-out-track-definitions';
// Högst upp bland DOM-elementen:
const countdownOverlay = document.querySelector('#countdown-overlay');

// Prefer landscape on mobile; browsers and Capacitor may require a user gesture.
async function lockMobileLandscape() {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  try {
    await screen.orientation?.lock?.('landscape');
  } catch {
    // Web browsers commonly permit orientation lock only in fullscreen or installed apps.
  }
}


const fullscreenButton = document.querySelector('#btn-fullscreen-toggle');
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement;

function syncFullscreenButton() {
  const active = Boolean(fullscreenElement()) || document.body.classList.contains('fullscreen-fallback');
  fullscreenButton?.setAttribute('aria-pressed', String(active));
  if (fullscreenButton) fullscreenButton.textContent = active ? 'EXIT FULLSCREEN ⛶' : 'FULLSCREEN ⛶';
}

async function toggleFullscreenAndLock() {
  const docEl = document.documentElement;
  const active = Boolean(fullscreenElement()) || document.body.classList.contains('fullscreen-fallback');
  if (active && document.body.classList.contains('fullscreen-fallback')) {
    document.body.classList.remove('fullscreen-fallback');
    syncFullscreenButton();
    return;
  }
  try {
    if (!active) {
      const request = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.webkitRequestFullScreen;
      if (!request) {
        document.body.classList.add('fullscreen-fallback');
      } else {
        await request.call(docEl);
        try { await screen.orientation?.lock?.('landscape'); } catch { /* Browser/device limitation. */ }
      }
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
      if (exit) await exit.call(document);
      screen.orientation?.unlock?.();
    }
  } catch (error) {
    console.warn('Fullscreen/Orientation Lock begränsning:', error);
    document.body.classList.toggle('fullscreen-fallback', !active);
  }
  syncFullscreenButton();
}

fullscreenButton?.addEventListener('click', toggleFullscreenAndLock);
document.addEventListener('fullscreenchange', syncFullscreenButton);
document.addEventListener('webkitfullscreenchange', syncFullscreenButton);



function getActiveTrackData(trackId) {
  try {
    const savedTracks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (savedTracks[trackId]) {
      return savedTracks[trackId];
    }
  } catch (err) {
    console.warn('Kunde inte läsa från localStorage:', err);
  }
  return TRACK_CONFIG[trackId]?.data;
}

function triggerCountdownAnim(text, isGo = false) {
  if (!countdownOverlay) return;
  countdownOverlay.textContent = text;
  countdownOverlay.classList.toggle('go-text', isGo);
  
  // Nollställ CSS-animationen (reflow-trick)
  countdownOverlay.classList.remove('countdown-pop');
  void countdownOverlay.offsetWidth;
  countdownOverlay.classList.add('countdown-pop');
}
// Hämta element för meny-knapp (lägg till detta bland dina DOM-element längst upp)
const menuButton = document.querySelector('#menu-button'); // Skapa gärna denna i HTML om den saknas
const buffer = fetch('/font/Induction.otf').then(res => res.arrayBuffer());
const font = parse(await buffer);
if (menuButton) {
  menuButton.addEventListener('click', () => {
    race.state = 'ready';
    raceAudio.stop();
    setScreen(resultsScreen, false);
    setScreen(startScreen, true);
  });
}

export const SPEEDCALIBRATION = 58; // Justera detta värde för att kalibrera spelets hastighe
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080c0a);
scene.fog = new THREE.FogExp2(0x080d18, 0.0035);
//scene.fog = new THREE.Fog(0x080c0a,350,420);

const TRACK_CONFIG = {
  'track1': { name: 'Neon Causeway', data: NEON_CAUSEWAY, defaultAudio: '/audio/tracks/track_001.mp3', backdrop: '/images/backdrop_track-001.jpg' },
  'track2': { name: 'Synthetic Dreams', data: SYNTHETIC_DREAMS, defaultAudio: '/audio/tracks/track_002.mp3', backdrop: '/images/backdrop_track-002.jpg' },
  'track3': { name: 'Digital Horizon', data: DIGITAL_HORIZON, defaultAudio: '/audio/tracks/track_006.mp3', backdrop: '/images/backdrop_track-003.jpg' },
  'track4': { name: 'Mommy I\'m Scared', data: MOMMY_IM_SCARED, defaultAudio: '/audio/tracks/track_005.mp3', backdrop: '/images/backdrop_track-004.jpg' },
  'track5': { name: 'Dark skies', data: DARK_SKIES, defaultAudio: '/audio/tracks/track_004.mp3', backdrop: '/images/backdrop_track-005.jpg' },
  'track6': { name: 'Gemini', data: GEMINI, defaultAudio: '/audio/tracks/track_007.mp3', backdrop: '/images/backdrop_track-006.jpg' },
  'track7': { name: 'The Joker', data: THE_JOKER, defaultAudio: '/audio/tracks/track_009.mp3', backdrop: '/images/backdrop_track-007.jpg' } ,
  'track8': { name: 'The Void', data: THE_VOID, defaultAudio: '/audio/tracks/track_010.mp3', backdrop: '/images/backdrop_track-009.jpg' } ,
  'track9': { name: 'Agent 008 Stage: Obsidian Relay', data: AGENT_008_STAGE, defaultAudio: '/audio/tracks/track_011.mp3', backdrop: '/images/backdrop_track-010.jpg' },
  'track10': { name: 'Ion Cathedral', data: ION_CATHEDRAL, defaultAudio: '/audio/tracks/track_012.mp3', backdrop: '/images/backdrop_track-013.png' },  

};

let currentTrackId = 'track1'; 
// Ändra din raceAudio till att vara en let istället för const så vi kan byta ut den
let raceAudio = new RaceAudio(TRACK_CONFIG[currentTrackId].defaultAudio);

const panoramaTexture = new THREE.TextureLoader().load(
  TRACK_CONFIG[currentTrackId].backdrop,
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // 1. Tvinga bort mipmapping så WebGL alltid ritar full 4K/8K-upplösning
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // 2. Maximal skärpa i vinklar
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    texture.needsUpdate = true;
  }
);

// Skapa cylindern med stängda ändar
const panoramaBackdrop = new THREE.Mesh(

  //new THREE.CylinderGeometry(384,374, 256, 64, 8, false),
  new THREE.SphereGeometry(392,128,64),
  new THREE.MeshBasicMaterial({
    map: panoramaTexture,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog:true, // Gör att inte fog/dimma bleker ur färgerna i fjärran
  })
);
panoramaBackdrop.renderOrder = -10;
scene.add(panoramaBackdrop);

const camera = new THREE.PerspectiveCamera(53, 1, 0.1, 512);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
//renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.7, 0.78);
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
let { group: track, curve } = createTrack(savedTrack);
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

const thrusterSystems = [];
const thrusterCrafts = [];

try {
  await loadCraftModel({ group: craft });
} catch (error) {
  console.warn(
    'Unable to load racer model; using procedural craft.',
    error
  );
}
const opponents = createOpponents();
for (const opponent of opponents) scene.add(opponent.group);
thrusterCrafts.push({ group: craft, color: 0x43f6ea });
opponents.forEach((opponent) => thrusterCrafts.push({ group: opponent.group, color: opponent.accentColor }));
thrusterCrafts.forEach(({ group, color }) => {
  for (const side of [-1, 1]) {
    Nebula.fromJSONAsync(thrusterConfig, THREE).then((loaded) => {
      const system = loaded.addRenderer(new SpriteRenderer(scene, THREE));
      const emitter = system.emitters[0];
      emitter.emit();
thrusterSystems.push({
  system,
  emitter,
  group,
  color,
  nozzleOffset: new THREE.Vector3(side * 0.38, -0.00, -1.65),
  previousExhaustPos: new THREE.Vector3() // NY: Håller koll på förra utblåspositionen
});
    }).catch((error) => console.error('Nebula thruster error:', error));
  }
});

const ghostPool = [];
const GHOST_POOL_SIZE = 8;

function createGhostPool() {
  for (let i = 0; i < GHOST_POOL_SIZE; i++) {
    const group = craft.clone(true);

    // Ett material per ghost, delat mellan dess mesh-objekt.
    const material = new THREE.MeshBasicMaterial({
      color: 0x58f442,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      wireframe: true,
      toneMapped: false
    });

    group.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
      }
    });

    group.visible = false;
    scene.add(group);

    ghostPool.push({
      group,
      material,
      life: 0,
      active: false
    });
  }
}

createGhostPool();

function spawnGhost() {
  const ghost = ghostPool.find(g => !g.active);
  if (!ghost) return;

  ghost.group.position.copy(craft.position);
  ghost.group.quaternion.copy(craft.quaternion);
  ghost.group.scale.copy(craft.scale);

  ghost.life = 0.7;
  ghost.active = true;
  ghost.group.visible = true;
  ghost.material.opacity = 0.25;
}
const clock = new THREE.Clock();
//const raceAudio = new RaceAudio(RACE_TRACK_AUDIO);
// --- KAMERASYSTEM INTEGRATION (Vänd 180 grader för att titta framåt) ---
const cameraSystem = {
  previousMode: 'external',
  modeTimer: 0,
  orbitAngle: 0,
  orbitSpeed: 0.55,
  mode: 'wipeoutStyle', // 'external' (chase-vy bakifrån) eller 'internal' (cockpit-vy)
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
    case 'cockpit':
    {  
    // Cockpit-vy
      const cockpitOffset = new THREE.Vector3(0, 0.6, -1.2);
      this.position.copy(craftPosition).add(cockpitOffset.applyQuaternion(craftQuaternion));
      
      const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(craftQuaternion);
      this.lookTarget.copy(this.position).add(forwardDir.multiplyScalar(10));
      break;
    }
        case 'internal':
    {  
    // Cockpit-vy
      const cockpitOffset = new THREE.Vector3(0, 0.4, -0.2);
      this.position.copy(craftPosition).add(cockpitOffset.applyQuaternion(craftQuaternion));
      
      const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(craftQuaternion);
      this.lookTarget.copy(this.position).add(forwardDir.multiplyScalar(10));
      break;
    }
 
case 'wipeoutStyle': {
      // Konfiguration (dessa kan du flytta upp till state-variablerna i början av cameraSystem om du vill)
      const distance = 1.2;      // Hur långt bakom
      const height = 2.8;        // Hur högt över
      const positionLerp = 5.5;  // Hur stram gummisnodden är (högre = stummare, lägre = sladdrigare)

      // 1. Skapa offset utifrån skeppets lokala rotation. 
      // Eftersom Z=1 verkar vara framåt i din motor, sätter vi Z till -distance för att hamna bakom.
      const offset = new THREE.Vector3(0, height, -distance).applyQuaternion(craftQuaternion);
      
      // 2. Beräkna den ideala positionen (där kameran VILL vara)
      const idealPosition = craftPosition.clone().add(offset);

      // 3. Dra kamerans nuvarande position mot den ideala positionen (Gummisnoddseffekten)
      this.position.lerp(idealPosition, 1 - Math.exp(-positionLerp * delta));

      // 4. Sätt vad vi vill titta på (en bit framför skeppet in i kurvan)
      const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(craftQuaternion);
      this.lookTarget.copy(craftPosition).add(forwardDir.multiplyScalar(8));
      this.lookTarget.y += 1.2; // Lyft blicken lite så vi inte tittar rakt ner i marken

      break;
    }
    
   case 'external': {
  // Kameran följer banans riktning i stället för
  // att reagera direkt på skeppets rotation.
        const speedBlend = THREE.MathUtils.clamp((race.currentSpeed - baseSpeed) / (104 - baseSpeed), 0, 1);
  // Pull the chase camera 25% closer as the ship approaches maximum speed.
  const chaseDistance = THREE.MathUtils.lerp(5.2, 4.4, speedBlend);
  const chaseHeight = THREE.MathUtils.lerp(3.3, 2.8, speedBlend);
  const idealOffset = new THREE.Vector3(0, chaseHeight, -chaseDistance).applyQuaternion(craftQuaternion);
  const forward = trackFrame.tangent.clone().normalize();

  const worldUp = new THREE.Vector3(0, 1, 0);

  const desiredPos = craftPosition.clone()
  .add(idealOffset)
    //.addScaledVector(forward, -2.2)
    .addScaledVector(worldUp, 1.8);

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

if (this.mode === 'circle' || this.mode === 'static' || this.mode === 'wipeoutStyle') {
    this.lookTarget.y += 0.5;
  this.currentLook.copy(this.lookTarget); // Titta direkt på skeppet
} else if(this.mode === 'cockpit'){
  const rotate180 = new THREE.Vector3(0.01,0,1);
  
  this.currentLook.copy(this.lookTarget).add(rotate180 );//Titta direkt på skeppet
  
}
else {
  this.currentLook.lerp(this.lookTarget, 1 - Math.exp(-3.0 * delta)); // Behåll mjukheten i andra lägen
}



camera.lookAt(this.currentLook);
// Lägg på extra dynamisk hjälmlutning i cockpit/internal
if (this.mode === 'cockpit' || this.mode === 'internal') {
  // race.roll eller shipPhysics.roll ger lutningen när du svänger
  const extraHeadRoll = (race.roll || 0) * 0.5; // Justera 0.4 för mer/mindre lutning
  camera.rotateZ(extraHeadRoll);
}

  },

  toggleMode() {
    this.mode = this.mode === 'external' ? 'internal' : 'external';
  },
  cycleMode() {
  const modes = ['external', 'internal', 'circle', 'static', 'wipeoutStyle','cockpit'];
  const index = modes.indexOf(this.mode);
  this.mode = modes[(index + 1) % modes.length];

  // Undvik att kameran drar med sig hastighet från föregående läge.
  this.velocity.set(0, 0, 0);
  this.orbitAngle = 0;
  }
};
const baseSpeed = 65; 
const drag = { active: false, lastX: 0, pointerId: null, throttle: 0 };
const heldKeys = new Set();
const mobileSteering = { pointerId: null, startX: 0 };
const mobileInput = { throttle: 0, gyroEnabled: false, gyroSteering: 0, orientationHandler: null };
const mobileControls = document.querySelector('#mobile-controls');
const steeringZone = document.querySelector('#touch-steering-zone');
const steeringIndicator = document.querySelector('#steering-indicator');
const gyroToggle = document.querySelector('#btn-gyro-toggle');
const pauseToggleButton = document.querySelector('#btn-pause-toggle');
const cameraCycleButton = document.querySelector('#btn-camera-cycle');
const thrustButton = document.querySelector('#btn-thrust');
const brakeButton = document.querySelector('#btn-brake');
const shipPhysics = createShipPhysics((baseSpeed+SPEEDCALIBRATION)*1.5);
const race = {
  topSpeed: 0,
  state: 'ready', distance: 0, elapsed: 0, steering: 0, targetSteering: 0, drift: 0,
  lateralVelocity: 0, roll: 0, currentSpeed: baseSpeed + SPEEDCALIBRATION, throttleTarget: 0, keyboardThrottle: 0, playerFinishTime: null,
  airborne: false, airWorldY: 0, airVelocity: 0, previousSlope: 0, jumpCooldown: 0,
  crashTimer: 0, crashCooldown: 0,
  countdownTimer: 3.0, // NY: För nedräkningen
};
// NY: Basfart för spelet, justeras med SPEEDCALIBRATION
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


const raycaster = new THREE.Raycaster();

raycaster.layers.set(1); // Sätt till samma Layer som banan

const arrows = {
    center: new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 4.0, 0xff0000),
    noseDown: new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 4.0, 0xff0000),
    noseForward: new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 4.0, 0xff0000),
    leftWingDown: new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 4.0, 0xff0000),
    rightWingDown: new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 4.0, 0xff0000),
    leftWingOut: new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 4.0, 0xff0000),
    rightWingOut: new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 4.0, 0xff0000)
};

// Lägg till alla pilar i scenen
Object.values(arrows).forEach(arrow => scene.add(arrow));

function updateCraftPose(delta = 0) {

  const input = {
    steer: race.steering,
    thrust: Math.max(0, race.throttleTarget),
    brakeLeft: heldKeys.has('q') || race.throttleTarget < -0.1,
    brakeRight: heldKeys.has('e') || race.throttleTarget < -0.1,
    pitch: (heldKeys.has('r') ? 1 : 0) - (heldKeys.has('f') ? 1 : 0),
  };
const pose = (race.state === 'racing' || race.state === 'finished') && delta > 0
    ? stepShipPhysics(shipPhysics, input, delta, curve, baseSpeed+SPEEDCALIBRATION)
    : stepShipPhysics(shipPhysics, input, 0, curve, baseSpeed+SPEEDCALIBRATION);

  race.distance = shipPhysics.distance;
  race.currentSpeed = shipPhysics.speed;
  race.lateralVelocity = shipPhysics.lateralVelocity;
  race.airborne = shipPhysics.airborne;
  race.airWorldY = shipPhysics.verticalOffset;
  race.roll = shipPhysics.roll;
  race.crashTimer = shipPhysics.crashTimer;
  craft.position.copy(pose.position);
  craft.quaternion.copy(pose.orientation);


// Definiera var punkterna sitter relativt skeppets mittpunkt.
// Z är oftast framåt/bakåt och X är höger/vänster. 
// Justera siffrorna om vingarna hamnar för långt ut eller nosen för långt bak!
const offsets = {
    center: new THREE.Vector3(0, 0, 0),
    noseDown: new THREE.Vector3(0, 0, 1.6), 
    noseForward: new THREE.Vector3(0, 0, 1.6), 
    leftWingDown: new THREE.Vector3(-1.3, 0, 0.2),
    rightWingDown: new THREE.Vector3(1.3, 0, 0.2),
    leftWingOut: new THREE.Vector3(-1.3, 0, 0.2),
    rightWingOut: new THREE.Vector3(1.3, 0, 0.2)
};

for (const [key, offset] of Object.entries(offsets)) {
    // 1. Ta den lokala offseten
    // 2. Rotera den så den följer skeppets aktuella vinkel
    // 3. Addera skeppets världsposition
   // if leftWingOut or rightWingOut, we want to check the horizontal direction instead of downwards. So we will use a different vector for those two cases.
    const partVector = key.includes('Out') ? new THREE.Vector3(0, 0, -1)  : key.includes('Forward') ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, -1, 0);
    

    const worldPos = offset.clone().applyQuaternion(craft.quaternion).add(craft.position);
    
    // Testa gärna att höja upp hela rasket tillfälligt för att se att de slår om till rött:
    // worldPos.y += 5.0; 
      
    raycaster.set(worldPos, partVector);
/*
    arrows[key].position.copy(worldPos);
    if(key.includes('Out')) {
        arrows[key].setDirection(offset.clone().normalize().applyQuaternion(craft.quaternion));
    }
        if(key.includes('Forward')) {
        arrows[key].setDirection(offset.clone().normalize().applyQuaternion(craft.quaternion));
    }
    const intersects = raycaster.intersectObject(track, true);
    
    // Om vi träffar banan och är närmare än 4 enheter
    if (intersects.length > 0 && intersects[0].distance < 4.0) {
        arrows[key].setColor(0x00ff00); // Grön = Träff
        
        // Spara värdena för fysiken senare (t.ex. avstånd och lutning)
        // const distance = intersects[0].distance;
        // const normal = intersects[0].face.normal;
    } else {
        arrows[key].setColor(0xff0000); // Röd = Miss
    }
*/        
} 

  return pose;
}

function beginRace() {
  // Läs av vilken bana som valts
  const trackSelect = document.querySelector('#track-select');
  currentTrackId = trackSelect.value;
  const trackData = getActiveTrackData(currentTrackId);
  //const trackData = TRACK_CONFIG[currentTrackId].data;
// Hämta banans namn och gör det till stora bokstäver
  const trackName = TRACK_CONFIG[currentTrackId].name.toUpperCase();

  // Uppdatera texten i toppmenyn
  const buildTag = document.querySelector('.build-tag');
  if (buildTag) {
    buildTag.innerHTML = `<i></i> 0.1 · ${trackName}`;
  }

  // Uppdatera texten på resultatskärmen
  const resultsEyebrow = document.querySelector('#results-screen .eyebrow');
  if (resultsEyebrow) {
    resultsEyebrow.innerHTML = `<span>FINISH</span> &nbsp; ${trackName}`;
  }
  // Ta bort den gamla banan om den finns
  if (track) {
    scene.remove(track);
  }

  // Skapa och lägg till den nya banan
const trackAssets = createTrack(trackData);
  track = trackAssets.group;
  curve = trackAssets.curve;
  race.boostPads = trackAssets.boostPads; // Hämta de slumpade positionerna från banan!
  track.traverse((child) => {
    if (child.isMesh) {
      child.layers.enable(1); // Aktivera lager 1 för alla banans mesh-objekt      
    }
  });
  spawnTrackObjects(scene, trackData);
  scene.add(track);

  // Uppdatera minimappen för den nya banan
  setupMinimap();

  // Byt musik
  raceAudio.stop();
  raceAudio = new RaceAudio(TRACK_CONFIG[currentTrackId].defaultAudio);
  // Läs av sökvägen till den nya bakgrundsbilden
  const backdropUrl = TRACK_CONFIG[currentTrackId].backdrop;

  // Ladda den nya texturen och byt ut den gamla
  new THREE.TextureLoader().load(
    backdropUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Frigör minne från den gamla texturen om den finns
      if (panoramaBackdrop.material.map) {
        panoramaBackdrop.material.map.dispose(); 
      }
      
      // Applicera den nya texturen
      panoramaBackdrop.material.map = texture;
      panoramaBackdrop.material.needsUpdate = true;
    },
    undefined,
    (error) => console.warn('Unable to load new panorama backdrop.', error)
  );
  
  raceAudio.play().catch((error) => console.warn('Unable to start race music.', error));
  race.state = 'racing';
Object.assign(shipPhysics, createShipPhysics(baseSpeed+SPEEDCALIBRATION));
  
  // Läs av hur mycket styrhjälp spelaren vill ha
  const assistSelect = document.querySelector('#assist-select');
  if (assistSelect) {
    shipPhysics.assistLevel = parseFloat(assistSelect.value);
  }
  
  race.state = 'countdown';
  race.countdownTimer = 4.0; // 3 sekunders nedräkning
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
  positionDisplay.textContent = '1 / 5';
  resultPositionDisplay.textContent = '1 / 5';
  // --- Checkpoint & Boost Setup ---
  const trackLen = curve.getLength();
  
  // Skapa 3 checkpoints per varv (33%, 66% och Start/Mål)
  race.checkpoints = [];
  for (let lap = 0; lap < totalLaps; lap++) {
    race.checkpoints.push(trackLen * lap + trackLen * 0.33);
    race.checkpoints.push(trackLen * lap + trackLen * 0.66);
    race.checkpoints.push(trackLen * lap + trackLen);
  }
  race.nextCheckpointIndex = 0;
  race.checkpointTimes = []; // Spelarens tider

  // Nollställ motståndarnas checkpoints
  opponents.forEach(opp => { 
    opp.nextCheckpointIndex = 0; 
    opp.checkpointTimes = []; 
  });

  // Lägg ut Boost-pads jämnt över hela banan (exempelvis var 150:e meter)
  setScreen(startScreen, false);
  setScreen(resultsScreen, false);
  canvas.focus({ preventScroll: true });
}

function finishRace() {
  // VIKTIGT: Ta bort raceAudio.stop() så musiken spelar under ärovarvet!
  
  race.state = 'finished';
  race.playerFinishTime = race.elapsed;
  positionDisplay.textContent = `${getPlayerPosition(opponents, race.distance, race.playerFinishTime)} / 3`;
  resultPositionDisplay.textContent = positionDisplay.textContent;
  drag.active = false;
  
  // Aktivera Autopilot-inställningar för ärovarvet
  shipPhysics.assistLevel = 1.0; // Sätt lane assist till max
  shipPhysics.boostTimer = 0;    // Nollställ eventuell boost
  shipPhysics.speed = 65;        // Sätt farten till basfarten
  cameraSystem.mode = 'circle';  // Byt till snurrande kameran

  resultDisplay.textContent = formatTime(race.elapsed);
  setScreen(resultsScreen, true);
  retryButton.focus({ preventScroll: true });
}

startButton.addEventListener('click', () => {
  toggleFullscreenAndLock();
  beginRace();
});
retryButton.addEventListener('click', () => {
  toggleFullscreenAndLock();
  beginRace();
});

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
function handleGamepadInput() {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0]; 

  if (!gp || race.state !== 'racing') return; 

  // --- 1. DÖDZON & KÄNSLIGHETSKURVA ---
  const applyDeadzone = (value, threshold = 0.12) => {
    if (Math.abs(value) < threshold) return 0;
    const sign = Math.sign(value);
    const scaled = (Math.abs(value) - threshold) / (1 - threshold);
    // Exponentiell kurva (1.3) ger fin precision i mitten och max effekt längst ut
    return sign * Math.pow(scaled, 1.3); 
  };

  // --- 2. STYRNING (Vänster spak X-axel + D-Pad) ---
  const stickX = applyDeadzone(gp.axes[0]);
  const dpadLeft = gp.buttons[14]?.pressed ? -1 : 0;
  const dpadRight = gp.buttons[15]?.pressed ? 1 : 0;
  
  const rawSteer = stickX !== 0 ? stickX : (dpadLeft + dpadRight);
  race.targetSteering = rawSteer;

  // --- 3. PITCH / NOS-LUTNING (Vänster spak Y-axel) ---
  // Dra spaken bakåt (Y > 0) -> Nos UPÅT ('r')
  // Tryck spaken framåt (Y < 0) -> Nos NEDÅT ('f')
  const stickY = applyDeadzone(gp.axes[1]);
  if (stickY < -0.35) {
    heldKeys.add('f');
    heldKeys.delete('r');
  } else if (stickY > 0.35) {
    heldKeys.add('r');
    heldKeys.delete('f');
  } else {
    heldKeys.delete('f');
    heldKeys.delete('r');
  }

  // --- 4. WIPEOUT LUFTBROMSAR (L1 / R1 eller L2 / R2) ---
  // Aktiverar dina befintliga 'q' (vänster) och 'e' (höger) bromsar i shipPhysics
  const leftAirbrake = (gp.buttons[4]?.pressed || (gp.buttons[6] && gp.buttons[6].value > 0.15));
  const rightAirbrake = (gp.buttons[5]?.pressed || (gp.buttons[7] && gp.buttons[7].value > 0.15));

  if (leftAirbrake) heldKeys.add('q'); else heldKeys.delete('q');
  if (rightAirbrake) heldKeys.add('e'); else heldKeys.delete('e');

  // --- 5. GAS (A / Kryss-knappen [0] eller R2-trigger [7]) ---
// --- 5. GAS (A / Kryss-knappen [0] eller R2-trigger [7]) ---
  const isGasButtonPressed = gp.buttons[0]?.pressed || gp.buttons[7]?.value > 0.2;

  // Spara gasen i race.gamepadThrottle istället för direkt i throttleTarget
  if (isGasButtonPressed) {
    race.gamepadThrottle = Math.max(gp.buttons[7]?.value || 0, 1.0);
  } else {
    race.gamepadThrottle = 0;
  }
}

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

function updateMobileSteering(clientX) {
  if (!steeringZone || mobileSteering.pointerId === null || mobileInput.gyroEnabled) return;
  const rect = steeringZone.getBoundingClientRect();
  const offset = clientX - mobileSteering.startX;
  const range = Math.max(72, rect.width * 0.36);
  const value = THREE.MathUtils.clamp(offset / range, -1, 1);
  race.targetSteering = value;
  if (steeringIndicator) steeringIndicator.style.transform = `translateX(calc(-50% + ${value * range}px))`;
}
steeringZone?.addEventListener('pointerdown', (event) => {
  if (race.state !== 'racing' || mobileSteering.pointerId !== null) return;
  event.preventDefault(); mobileSteering.pointerId = event.pointerId; mobileSteering.startX = event.clientX;
  steeringZone.setPointerCapture(event.pointerId); updateMobileSteering(event.clientX);
});
steeringZone?.addEventListener('pointermove', (event) => { if (event.pointerId === mobileSteering.pointerId) { event.preventDefault(); updateMobileSteering(event.clientX); } });
function releaseMobileSteering(event) {
  if (event.pointerId !== mobileSteering.pointerId) return;
  mobileSteering.pointerId = null; race.targetSteering = 0;
  if (steeringIndicator) steeringIndicator.style.transform = 'translateX(-50%)';
}
steeringZone?.addEventListener('pointerup', releaseMobileSteering);
steeringZone?.addEventListener('pointercancel', releaseMobileSteering);
steeringZone?.addEventListener('lostpointercapture', releaseMobileSteering);

function setMobileThrottle(value, button) { mobileInput.throttle = value; button?.classList.toggle('active', value !== 0); }
function bindPedal(button, value) {
  if (!button) return;
  button.addEventListener('pointerdown', (event) => { if (race.state === 'racing') { event.preventDefault(); button.setPointerCapture(event.pointerId); setMobileThrottle(value, button); } });
  const release = () => setMobileThrottle(0, button);
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
}
bindPedal(thrustButton, 1); bindPedal(brakeButton, -1);

function orientationSteering(event) {
  const angle = screen.orientation?.angle ?? window.orientation ?? 0;
  let tilt = Number.isFinite(event.beta) ? event.beta : event.gamma;
  if (angle === 90) tilt = event.beta;
  else if (angle === 270 || angle === -90) tilt = -event.beta;
  else if (window.matchMedia('(orientation: portrait)').matches) tilt = event.gamma;
  if (typeof tilt !== 'number' || !Number.isFinite(tilt)) return;
  const deadzone = 3;
  const maxTilt = 15;
  const magnitude = Math.abs(tilt);
  mobileInput.gyroSteering = magnitude <= deadzone
    ? 0
    : THREE.MathUtils.clamp((magnitude - deadzone) / (maxTilt - deadzone), 0, 1) * Math.sign(tilt);
}
async function toggleGyro() {
  if (mobileInput.gyroEnabled) {
    window.removeEventListener('deviceorientation', orientationSteering); mobileInput.gyroEnabled = false; mobileInput.gyroSteering = 0;
    gyroToggle.textContent = 'GYRO: OFF'; gyroToggle.setAttribute('aria-pressed', 'false'); return;
  }
  try {
    if (typeof DeviceOrientationEvent === 'undefined') throw new Error('Orientation sensors unavailable');
    if (typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') throw new Error('Orientation permission denied');
    window.addEventListener('deviceorientation', orientationSteering); mobileInput.gyroEnabled = true;
    gyroToggle.textContent = 'GYRO: ON'; gyroToggle.setAttribute('aria-pressed', 'true');
  } catch (error) { console.warn('Gyro steering could not be enabled.', error); gyroToggle.textContent = 'GYRO: N/A'; window.setTimeout(() => { if (!mobileInput.gyroEnabled) gyroToggle.textContent = 'GYRO: OFF'; }, 1400); }
}
gyroToggle?.addEventListener('click', toggleGyro);

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
  if (key === 'arrowleft' || key === 'a') race.targetSteering = -1;
  if (key === 'arrowright' || key === 'd') race.targetSteering = 1;
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

let isPaused = false;
const pauseScreen = document.querySelector('#pause-screen');
const resumeButton = document.querySelector('#resume-button');
const musicSelect = document.querySelector('#music-select');

// Lyssna efter Escape för att pausa/avpausa
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && race.state === 'racing') {
    togglePause();
  }
});

resumeButton.addEventListener('click', togglePause);
pauseToggleButton?.addEventListener('click', togglePause);
cameraCycleButton?.addEventListener('click', () => cameraSystem.cycleMode());

function togglePause() {
  isPaused = !isPaused;
  setScreen(pauseScreen, isPaused);
  pauseToggleButton?.setAttribute('aria-pressed', String(isPaused));
  if (pauseToggleButton) pauseToggleButton.textContent = isPaused ? 'RESUME ▶' : 'PAUSE ⏸';
  
  if (isPaused) {
    raceAudio.audio.pause();
  } else {
    raceAudio.audio.play();
    // Nollställ klockan så inte fysiken hoppar framåt när vi avpausar
    clock.getDelta(); 
  }
}

// Byt låt direkt när man ändrar i pausmenyn
musicSelect.addEventListener('change', async (event) => {
  const newAudioUrl = event.target.value;
  raceAudio.stop();
  raceAudio = new RaceAudio(newAudioUrl);
  
  if (!isPaused) {
    await raceAudio.play();
  }
});
const trackSelect = document.querySelector('#track-select');
trackSelect.addEventListener('change', (event) => {
  const newTrackName = TRACK_CONFIG[event.target.value].name.toUpperCase();
  const startEyebrow = document.querySelector('#start-screen .eyebrow');
  if (startEyebrow) {
    // 01, 02 eller 03 beroende på vald bana
    const trackNumber = event.target.value.replace('track', '0'); 
    startEyebrow.innerHTML = `<span>${trackNumber}</span> &nbsp; ${newTrackName}`;
  }
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
  handleGamepadInput();
    // Om spelet är pausat, rita bara om bilden och avbryt funktionen
  if (isPaused) {
    composer.render();
    requestAnimationFrame(render);
    return; 
  }
  const delta = Math.min(clock.getDelta(), 0.05);
  let crossedFinish = false;
  // --- ANIMERA BANE-OBJEKT ---
  const customObjects = scene.getObjectByName('customTrackObjects');
  if (customObjects && !isPaused) {
    const time = clock.elapsedTime;
    
    customObjects.children.forEach(mesh => {
      const anim = mesh.userData.animType;
      
      // 1. Skala upp och ner pulserande objekt
      if (anim === 'pulse') {
        const s = 1 + Math.sin(time * 3.5) * 0.15; // Pulserar +/- 15%
        mesh.scale.set(
          mesh.userData.baseScale[0] * s,
          mesh.userData.baseScale[1] * s,
          mesh.userData.baseScale[2] * s
        );
      }
      
      // 2. Scrolla texturer om materialet har en map
      if (mesh.material.map) {
        if (anim === 'scroll-y') {
          mesh.material.map.offset.y = (time * -0.6) % 1; // Hastighet -0.6
        } else if (anim === 'scroll-x') {
          mesh.material.map.offset.x = (time * -0.6) % 1;
        }
      }
    });
  }

  if (race.state === 'countdown') {
   
    // Uppdatera timer-displayen med nedräkning (t.ex. 3, 2, 1 eller GO!)
const prevCount = Math.ceil(race.countdownTimer);
    race.countdownTimer -= delta;
    const countVal = Math.ceil(race.countdownTimer);

    timerDisplay.textContent = countVal > 0 ? `00:0${countVal}` : 'GO!';
    lapDisplay.textContent = `01 / ${String(totalLaps).padStart(2, '0')}`;
    
    // Håll skeppet fryst under nedräkningen
    updateCraftPose(0);
    raceAudio.updateEngine(0, false, false);
if (countVal !== prevCount) {
  if (countVal === 4) {
    raceAudio.playSfx('countdownFour');
    triggerCountdownAnim('0100');
  } else if (countVal === 3) {
    shipPhysics.boostTimer = 0.5; // Ge spelaren en liten boost när nedräkningen börjar
    spawnGhost();
    raceAudio.playSfx('countdownThree');
    triggerCountdownAnim('0011');
  } else if (countVal === 2) {
    raceAudio.playSfx('countdownTwo');
    triggerCountdownAnim('0010');
  } else if (countVal === 1) {
    raceAudio.playSfx('countdownOne');
    triggerCountdownAnim('0001');
  } else if (countVal <= 0 && prevCount > 0) {
    raceAudio.playSfx('countdownGo');
    triggerCountdownAnim('GO!', true);
    race.topSpeed = 0;
  }
} 
    // När räknaren når 0, startar loppet på riktigt!
    if (race.countdownTimer <= 0) {
      race.state = 'racing';
      race.elapsed = 0;
    }

  } else if (race.state === 'racing') {
    race.elapsed += delta;
    raceAudio.update(delta);
// KORRIGERAD RAD: Inkluderar nu race.gamepadThrottle
    race.throttleTarget = mobileInput.throttle !== 0 
      ? mobileInput.throttle 
      : drag.active 
        ? drag.throttle 
        : (race.gamepadThrottle || race.keyboardThrottle);

    if (mobileInput.gyroEnabled) race.targetSteering = mobileInput.gyroSteering;
    race.steering = THREE.MathUtils.damp(
      race.steering,
      race.targetSteering,
      race.airborne ? 3.8 : 9.5,
      delta,
    );
    updateCraftPose(delta);
    // Uppdatera motorljudet
    raceAudio.updateEngine(race.currentSpeed, shipPhysics.boostTimer > 0, true);

    const completedLaps = Math.floor(race.distance / curve.getLength());
    const currentLap = Math.min(completedLaps + 1, totalLaps);
    const lapProgress = race.distance / curve.getLength() - completedLaps;
    timerDisplay.textContent = formatTime(race.elapsed);
    lapDisplay.textContent = `${String(currentLap).padStart(2, '0')} / ${String(totalLaps).padStart(2, '0')}${currentLap === totalLaps && lapProgress >= 0.72 ? ' · FINAL' : ''}`;
    //crossedFinish = race.distance >= curve.getLength() * totalLaps;
    raceAudio.updateEngine(race.currentSpeed, shipPhysics.boostTimer > 0, true);
    if (race.distance >= curve.getLength() * totalLaps) {
        finishRace();
    }

  } else if (race.state === 'finished') {
    // --- ÄROVARV (AUTOPILOT) ---
    raceAudio.update(delta); // Låt musiken fortsätta driva bloom-effekterna
    
    race.targetSteering = 0; // Släpp ratten
    race.throttleTarget = 0; // Släpp gasen
    race.steering = THREE.MathUtils.damp(race.steering, race.targetSteering, 4.8, delta);
    
    // Tvinga farten och assistansen varje frame ifall fysiken försöker ändra den
    shipPhysics.speed = 65;
    shipPhysics.assistLevel = 1.0;
    
    updateCraftPose(delta); // Fortsätt flytta skeppet framåt!
    
    // Håll motorljudet igång på lågvarv
    raceAudio.updateEngine(65, false, true); 
    
  }
  else {
    // --- STARTMENYN (READY) ---
    race.steering = THREE.MathUtils.damp(race.steering, race.targetSteering, 7.5, delta);
    updateCraftPose(0); // Frys skeppet
    raceAudio.updateEngine(0, false, false); // Stäng av motorljudet
  }
// --- GHOSTING EFFEKT ---
    race.ghostTimer = (race.ghostTimer || 0) + delta;
   // race.ghosts = race.ghosts || [];

    // Skapa ett nytt "eftersken" var 50:e millisekund under boosten
      
if (shipPhysics.boostTimer > 0 && race.ghostTimer > 0.05) {
  race.ghostTimer = 0;
  spawnGhost();
}
      
  /*    // Byt ut alla material på klonen mot ett glödande wireframe-material
      ghostGroup.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({
            color: 0x58f442, // Samma neongröna som boost-pilarna
            transparent: true, 
            opacity: 0.5, 
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            wireframe: true // Ger en väldigt cool digital hologrameffekt
          });
        }
      });
    */  
     /* scene.add(ghostGroup);
      race.ghosts.push({ group: ghostGroup, life: 1.0 });*/


    // Tona ut och städa bort gamla ghosts så vi inte kraschar minnet
for (const ghost of ghostPool) {
  if (!ghost.active) continue;

  ghost.life -= delta * 4.5;

  if (ghost.life <= 0) {
    ghost.active = false;
    ghost.group.visible = false;
    ghost.material.opacity = 0;
  } else {
    ghost.material.opacity = ghost.life * 0.5;
  }
}

  updateMinimap(craft.position);
  const trackFrame = getTrackFrame(curve, race.distance / curve.getLength());

  if (race.state === 'racing') {
// --- SPEEDBOOST LOGIK ---
    const trackLen = curve.getLength();
    const lapDistance = race.distance % trackLen;
    
    // 1. Hitta först om vi är över en pad i längdled
    const currentPadIndex = race.boostPads.findIndex(pad => lapDistance >= pad.d && lapDistance < pad.d + 10);
    
    if (currentPadIndex !== -1) {
      // 2. Om vi är vid en pad, kolla om vi prickar den i sidled!
      // Vi krymper träffytan från 2.8 till 1.2 (mycket striktare)
      const currentPad = race.boostPads[currentPadIndex];
      const inWidth = Math.abs(shipPhysics.lateralOffset - currentPad.offset) < 1.2;
      
      // 3. Bara ge boost om vi prickar rätt och inte redan tagit just denna pad
      if (inWidth && race.lastBoostIndex !== currentPadIndex) {
        race.lastBoostIndex = currentPadIndex;
        raceAudio.playSfx('boost');
        // AKTIVERA BOOST!
        shipPhysics.boostTimer = 1.0; 
        shipPhysics.speed = (baseSpeed + SPEEDCALIBRATION )* 1.3;
        
        cameraSystem.shakeTimer = 0.8;
        cameraSystem.shakeIntensity = 0.65;
        bloomPass.strength = 0.6;
      }
    } else {
      // Återställ när vi har åkt förbi paden, så den kan tas nästa varv
      race.lastBoostIndex = -1;
    }

    // --- CHECKPOINT LOGIK (Motståndare) ---
    // Motståndarnas checkpoint-tider uppdateras
    opponents.forEach(opp => {
      if (opp.nextCheckpointIndex < race.checkpoints.length) {
        if (opp.distance >= race.checkpoints[opp.nextCheckpointIndex]) {
          opp.checkpointTimes[opp.nextCheckpointIndex] = race.elapsed;
          opp.nextCheckpointIndex++;
        }
      }
    });

    // --- CHECKPOINT LOGIK (Spelaren) ---
    if (race.nextCheckpointIndex < race.checkpoints.length) {
      const nextCpDist = race.checkpoints[race.nextCheckpointIndex];
      if (race.distance >= nextCpDist) {
        race.checkpointTimes[race.nextCheckpointIndex] = race.elapsed;
        raceAudio.playSfx('checkpoint');
        // Beräkna gap till framför/bakom
        let gapText = "LEADER";
        let color = "#5cf5ec"; // Cyan för ledning
        let timeGapAhead = null;
        let timeGapBehind = null;

        opponents.forEach(opp => {
          if (opp.checkpointTimes[race.nextCheckpointIndex]) {
            //  passerade före oss
            const gap = race.elapsed - opp.checkpointTimes[race.nextCheckpointIndex];
            if (!timeGapAhead || gap < timeGapAhead) timeGapAhead = gap;
          } else {
            // Motståndaren är bakom. Beräkna uppskattad tid baserat på avstånd
            const distGap = race.distance - opp.distance;
            // Uppskattar att CPU kör i ca 65 km/h (basfart)
            const estimatedTime = distGap / 65; 
            if (!timeGapBehind || estimatedTime < timeGapBehind) timeGapBehind = estimatedTime;
          }
        });

        if (timeGapAhead) {
          gapText = `▲ +${timeGapAhead.toFixed(2)}s PÅ LEDAREN`;
          color = "#ff397b"; // Rosa/Rött när vi ligger under
        } else if (timeGapBehind) {
          gapText = `▼ -${timeGapBehind.toFixed(2)}s TILL BAKOMLIGGANDE`;
        }

        // Visa UI-meddelandet
        const msgContainer = document.querySelector('#race-messages');
        document.querySelector('#msg-time').textContent = formatTime(race.elapsed);
        const gapEl = document.querySelector('#msg-gap');
        gapEl.textContent = gapText;
        gapEl.style.color = color;
        
        msgContainer.style.opacity = '1';
        
        // Dölj meddelandet efter 2.5 sekunder
        setTimeout(() => { msgContainer.style.opacity = '0'; }, 2500);

        race.nextCheckpointIndex++;
      }
    }
    updateOpponents(opponents, curve, delta, race.elapsed, true,race.distance);
    resolveCraftCollisions(opponents, craft.position, shipPhysics.velocity, curve, race.distance, delta);
  } else {
    updateOpponents(opponents, curve, 0, race.elapsed, false,race.distance);
  }
  if (crossedFinish) finishRace();
  positionDisplay.textContent = `${getPlayerPosition(opponents, race.distance, race.playerFinishTime)} / 3`;

  // Aktivera kameraskakning om skeppet kraschar
    if (race.crashTimer > 0) {
    cameraSystem.setShake(0.3);
    // Spela bara ljudet i exakt samma frame som kraschen startar (0.42 är startvärdet i ship-physics)
    if (Math.abs(race.crashTimer - 0.42) < 0.02) {
      raceAudio.playSfx('crash');
    }
  }
  
  // 1. Beräkna nuvarande hastighet i KM/H
const displaySpeed = Math.round(race.currentSpeed * 3.6 * 3.25);
  race.topSpeed = Math.max(race.topSpeed, displaySpeed);
  speedDisplay.textContent = String(displaySpeed);
  document.querySelector('#race-top-speed').textContent = `MAX ${race.topSpeed} KM/H`;
  
  const thrustPercent = THREE.MathUtils.clamp(Math.max(0, race.throttleTarget), 0, 1);
const segments = document.querySelectorAll('.thrust-segment');
const activeCount = Math.round(thrustPercent * segments.length);

segments.forEach((seg, index) => {
  if (shipPhysics.boostTimer > 0 || index < activeCount) {
    seg.classList.add('active');
  } else {
    seg.classList.remove('active');
  }
});

/*
  const thrustPercent = THREE.MathUtils.clamp(Math.max(0, race.throttleTarget) * 100, 0, 100);
  const thrustFill = document.querySelector('#thrust-meter-fill');
  thrustFill.style.width = `${shipPhysics.boostTimer > 0 ? 100 : thrustPercent}%`;
  thrustFill.style.background = shipPhysics.boostTimer > 0 ? '#58f442' : 'linear-gradient(90deg, #5de8df 0%, #ff397b 100%)';

  */
  const braking = race.throttleTarget < -0.1;
  const thrusting = race.throttleTarget > 0.1 || shipPhysics.boostTimer > 0;
  document.querySelector('.brake-status').classList.toggle('active', braking);
  document.querySelector('.thrust-status').classList.toggle('active', thrusting);
  document.querySelector('#hud-brake-state').textContent = braking ? 'ENGAGED' : 'OFF';
  document.querySelector('#hud-thrust-state').textContent = shipPhysics.boostTimer > 0 ? 'BOOST' : thrusting ? `${Math.round(thrustPercent)}%` : 'IDLE';
  document.querySelector('#hud-gyro-state').textContent = mobileInput.gyroEnabled ? 'GYRO ACTIVE' : 'TOUCH / PAD';
  document.querySelector('#gyro-meter-needle').style.left = `${50 + THREE.MathUtils.clamp(race.steering, -1, 1) * 46}%`;
  const playerProgress = ((race.distance / curve.getLength()) % 1) * 100;
  document.querySelector('#minimap-progress').textContent = playerProgress < 1 ? 'START' : `${Math.floor(playerProgress)}%`;

  // Kör det nya integrerade kamerapasset
  cameraSystem.update(craft.position, craft.quaternion, shipPhysics.velocity, delta, trackFrame);
  
  panoramaBackdrop.position.copy(camera.position);

  const kick = race.state === 'racing' ? raceAudio.channels.kick : { hitValue: 0 };
  const bass = race.state === 'racing' ? raceAudio.channels.bass : { value: 0 };
  bloomPass.strength = 0.62 + kick.hitValue * 0.55 + bass.value * 0.12;
  const pulse = 0.78 + Math.sin(clock.elapsedTime * 19) * 0.12 + kick.hitValue * 0.75;
  engineMaterials.forEach((material) => material.color.setRGB(0.28 * pulse, 0.95 * pulse, 0.9 * pulse));
  const thrusterPower = 1;//0.72 + bass.value * 0.85 + kick.hitValue * 0.72;
  thrusters.forEach((thruster, index) => {
    thruster.visible = race.state === 'racing';
    thruster.scale.set(
      0.82 + thrusterPower * 0.22,
      thrusterPower * (1 + Math.sin(clock.elapsedTime * 31 + index * Math.PI) * 0.08),
      0.82 + thrusterPower * 0.22,
    );
  });

// Update each craft's ion exhaust behind its paired rear nozzles.
for (const {
  system,
  emitter,
  group,
  nozzleOffset,
  previousExhaustPos
} of thrusterSystems) {

  // 1. Beräkna nuvarande utblåsposition i världsrymden
  const exhaustPos = nozzleOffset.clone()
    .applyQuaternion(group.quaternion)
    .add(group.position);

  // Initiera förra positionen vid start om den är tom
  if (previousExhaustPos.lengthSq() === 0) {
    previousExhaustPos.copy(exhaustPos);
  }

  emitter.position.copy(exhaustPos);

  const euler = new THREE.Euler().setFromQuaternion(group.quaternion);
  emitter.rotation.x = euler.x;
  emitter.rotation.y = euler.y;
  emitter.rotation.z = euler.z;

  // Spara vilka partiklar som fanns före denna frame
 const existingParticles = new Set(emitter.particles);
  const configureParticle = (particle) => {
    if (!particle.sprite || !particle.sprite.material) return;
    const material = particle.sprite.material;
    material.depthWrite = false;
    material.depthTest = true;
    material.alphaTest = 0.02;
    material.renderOrder = 10;
    material.blending = THREE.AdditiveBlending;
    material.transparent = true;
    particle.sprite.renderOrder = 10;
  };

  // Configure existing sprites before simulation and newly spawned sprites after it.
  emitter.particles.forEach(configureParticle);
  system.update(delta);
  emitter.particles.forEach(configureParticle);

  // Interpolate only particles spawned during this frame.
  const newParticles = emitter.particles.filter(p => !existingParticles.has(p));
  const totalNew = newParticles.length;

  newParticles.forEach((particle, index) => {
    configureParticle(particle);

    // Ren standardinterpolering från förra positionen till nuvarande (0 till 1)
    const t = totalNew > 1 ? index / (totalNew - 1) : 1;
    particle.position.lerpVectors(previousExhaustPos, exhaustPos, t);
  });

  // Spara nuvarande position till nästa frame
  previousExhaustPos.copy(exhaustPos);
}
  
 
  // NYTT: Räkna ut en hastighetsfaktor. Är 1.0 vid normal maxfart, över 1.0 vid boost, och nära 0 vid inbromsning/krasch.
  const speedFactor = race.state === 'racing' ? THREE.MathUtils.clamp(race.currentSpeed / baseSpeed, 0.1, 1.8) : 0;
  
 /* thrusterMaterials.forEach((material) => {
    material.opacity = race.state === 'racing' ? THREE.MathUtils.clamp(0.36 + thrusterPower * 0.14, 0.36, 0.82) : 0;
  });*/
  //glow.intensity = 2.4 + pulse * 1.2 + kick.hitValue * 5.5 + bass.value * 2.4;
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
import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#090d19');
scene.fog = new THREE.FogExp2('#090d19', 0.035);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 7.2, 12.8);
camera.lookAt(0, 0.25, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

scene.add(new THREE.HemisphereLight(0x91caff, 0x101321, 1.8));
const keyLight = new THREE.DirectionalLight(0xdceaff, 3.2);
keyLight.position.set(-4, 8, 5);
scene.add(keyLight);
const cyanLight = new THREE.PointLight(0x32f4e8, 35, 12);
cyanLight.position.set(2.5, 2.2, 1.5);
scene.add(cyanLight);
const pinkLight = new THREE.PointLight(0xff397b, 28, 11);
pinkLight.position.set(-3, 1.2, -2);
scene.add(pinkLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x0a0e1a, roughness: 0.82, metalness: 0.22 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.75;
scene.add(floor);

const grid = new THREE.GridHelper(42, 42, 0x16474e, 0x182333);
grid.position.y = -0.735;
grid.material.transparent = true;
grid.material.opacity = 0.3;
scene.add(grid);

const stage = new THREE.Group();
scene.add(stage);
const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(4.35, 4.55, 0.32, 96),
  new THREE.MeshStandardMaterial({ color: 0x111a2a, metalness: 0.72, roughness: 0.38 }),
);
platform.position.y = -0.47;
stage.add(platform);

function neonRing(radius, tube, color, y, opacity = 1) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 128), material);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  stage.add(ring);
  return ring;
}

neonRing(4.18, 0.035, 0x47eae0, -0.28);
neonRing(3.76, 0.012, 0x42778e, -0.27, 0.8);
neonRing(4.48, 0.014, 0xff397b, -0.27, 0.75);

// A deliberately static, unpiloted craft-shaped study: it is only a rendered prop.
const craft = new THREE.Group();
craft.position.set(0, 0.18, 0.2);
stage.add(craft);
const hullMaterial = new THREE.MeshStandardMaterial({
  color: 0xbac8df, metalness: 0.82, roughness: 0.24,
  emissive: 0x102a3d, emissiveIntensity: 0.5,
});
const hull = new THREE.Mesh(new THREE.ConeGeometry(0.84, 2.45, 6, 1), hullMaterial);
hull.rotation.x = Math.PI / 2;
hull.scale.set(1, 1, 0.66);
craft.add(hull);
const canopy = new THREE.Mesh(
  new THREE.SphereGeometry(0.43, 24, 16),
  new THREE.MeshPhysicalMaterial({ color: 0x143a50, metalness: 0.52, roughness: 0.12, clearcoat: 1, emissive: 0x0c5360, emissiveIntensity: 0.7 }),
);
canopy.scale.set(0.76, 0.35, 1.18);
canopy.position.set(0, 0.38, -0.05);
craft.add(canopy);
const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x26364e, metalness: 0.76, roughness: 0.3 });
for (const side of [-1, 1]) {
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.105, 0.62), wingMaterial);
  wing.position.set(side * 0.81, -0.04, 0.24);
  wing.rotation.y = side * -0.12;
  craft.add(wing);
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(1.16, 0.035, 0.045),
    new THREE.MeshBasicMaterial({ color: side < 0 ? 0xff397b : 0x55f4e8 }),
  );
  strip.position.set(side * 0.92, 0.025, 0.46);
  strip.rotation.y = side * -0.12;
  craft.add(strip);
}
for (const side of [-1, 1]) {
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.2, 0.38, 16),
    new THREE.MeshBasicMaterial({ color: 0x65f4ec }),
  );
  engine.rotation.x = Math.PI / 2;
  engine.position.set(side * 0.42, -0.1, 1.13);
  craft.add(engine);
}

// Minimal vertical pylons frame the prototype stage and provide visual scale.
const pylonMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2940, metalness: 0.65, roughness: 0.36, emissive: 0x071b25 });
for (const [x, z, height] of [[-4.05, -2.4, 2.2], [4.05, -2.4, 2.2], [-3.5, 2.8, 1.45], [3.5, 2.8, 1.45]]) {
  const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.16), pylonMaterial);
  pylon.position.set(x, -0.32 + height / 2, z);
  stage.add(pylon);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: x < 0 ? 0xff397b : 0x55f4e8 }));
  beacon.position.set(x, 0.2 + height - 0.32, z);
  stage.add(beacon);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.fov = width < 700 ? 49 : 42;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize, { passive: true });
resize();

const clock = new THREE.Clock();
function render() {
  const elapsed = clock.getElapsedTime();
  // Subtle ambient motion only; the prop does not respond to player input.
  stage.rotation.y = Math.sin(elapsed * 0.12) * 0.035;
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();

window.addEventListener('pagehide', () => {
  window.removeEventListener('resize', resize);
  renderer.dispose();
}, { once: true });

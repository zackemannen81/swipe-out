import * as THREE from 'three';
import { makeHullTexture } from './craft-grounding.js';

/**
 * Garage composition. The backdrop is a fixed photo, while the craft is live 3D.
 * Coordinates (x/y) refer to the ORIGINAL photo, normalized from top-left.
 * All the values needed to match the concept image live in this one object.
 */
export const GARAGE_FRAMING = {
  photoX: 0.62,             // Center of the ship in the original background (left=0, right=1)
  photoY: 0.58,             // Center of the ship in the original background (top=0, bottom=1)
  screenWidth: 0.40,        // Ship's target width as fraction of the VISIBLE screen
  eyeX: -6.5,              // Camera side-to-side: more negative = more side-on
  eyeY: 2.0,               // Camera height: lower = more dramatic, less top-down
  eyeZ: 3.0,               // Front/back view angle, relative to the model's axes
  yawDegrees: -35,           // Rotate the ship if the camera angle still isn't right
  hoverY: 1.0,            // World-space center height of craft
  bobAmplitude: 0.03,
};

// Eight corners of a local bounding box, used to estimate screen width of the ship.
const corners = [
  [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
  [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
];

export function createGarage(templates) {
  let disposed = false;
  let backdrop = null;
  let glow = 1;
  let owned = [];
  let needsFit = true;
  let lastWidth = 0;
  let lastHeight = 0;
  const framing = { ...GARAGE_FRAMING };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#090f17');
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  new THREE.TextureLoader().load(
    '/images/zacke/sweden.png',
    texture => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      backdrop = texture;
      scene.background = texture;
      needsFit = true;
    },
    undefined,
    error => console.warn('Garage background unavailable.', error),
  );

  scene.add(new THREE.HemisphereLight('#c2d9ef', '#293d42', 3));
  for (const [color, intensity, x, y, z] of [
    [0xc8eaff, 80, 3, 6, 2],
    [0xff2244, 90, -5, 3, -3],
    [0x9acfff, 45, 5, 2, 4],
  ]) {
    const light = new THREE.PointLight(color, intensity, 30);
    light.position.set(x, y, z);
    scene.add(light);
  }

  // ship is the stable camera target; content is re-centered inside it.
  const ship = new THREE.Group();
  ship.position.y = framing.hoverY;
  scene.add(ship);
  const content = new THREE.Group();
  ship.add(content);
const shadowGeometry = new THREE.PlaneGeometry(1, 1);
shadowGeometry.rotateX(-Math.PI / 2);

const shadowMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.99,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
});

const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
shadow.visible = false;
scene.add(shadow);

let shadowResources = null;


  const point = new THREE.Vector3();

  function setCraft(id, paint) {
    owned.forEach(material => material.dispose());
    owned = [];
    content.clear();
    content.position.set(0, 0, 0);

    const source = templates[id] ?? templates.racer;
    if (!source) {
      console.warn('Garage: no craft template for', id);
      needsFit = true;
      return;
    }

    for (const child of source.children) {
      if (child.isLight) continue;
      const copy = child.clone(true);
      copy.traverse(object => {
        if (!object.isMesh) return;
        const sourceMaterials = Array.isArray(object.material)
          ? object.material : [object.material];
        const clonedMaterials = sourceMaterials.map(material => {
          const clone = material.clone();
          if (paint && clone.color) clone.color.multiply(new THREE.Color(paint));
          owned.push(clone);
          return clone;
        });
        object.material = Array.isArray(object.material)
          ? clonedMaterials : clonedMaterials[0];
      });
      content.add(copy);
    }

    // Align the MODEL's visible center to the camera target. Without this,
    // enlarging the ship also amplifies any offset in its source model origin.
    const previousY = ship.position.y;
    const previousYaw = ship.rotation.y;
    ship.position.y = 0;
    ship.rotation.y = 0;
    ship.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(content);
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new THREE.Vector3());
      content.position.sub(center);
    }
    ship.position.y = previousY;
    ship.rotation.y = previousYaw;
    // Dispose previous craft shadow
if (shadowResources) {
  shadowResources.silhouette.dispose();
  shadowResources.soft.dispose();
}

// Generate shadow from actual craft silhouette
shadowResources = makeHullTexture(content);

shadowMaterial.map = shadowResources?.soft ?? null;
shadowMaterial.needsUpdate = true;

shadow.visible = !!shadowResources;

if (shadowResources) {
  shadow.scale.set(
    shadowResources.width * 1.2,
    1,
    shadowResources.length * 1.2
  );
}
    needsFit = true;
  }

  /** Calculate the visible width of the actual model in normalized screen units. */
  function projectedCraftWidth() {
    let minX = Infinity;
    let maxX = -Infinity;
    ship.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    content.traverse(object => {
      if (!object.isMesh || !object.visible || !object.geometry) return;
      const geometry = object.geometry;
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (!box || box.isEmpty()) return;

      for (const [ix, iy, iz] of corners) {
        point.set(
          ix ? box.max.x : box.min.x,
          iy ? box.max.y : box.min.y,
          iz ? box.max.z : box.min.z,
        );
        point.applyMatrix4(object.matrixWorld).project(camera);
        if (!Number.isFinite(point.x)) continue;
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
      }
    });

    return Number.isFinite(minX) && Number.isFinite(maxX)
      ? (maxX - minX) / 2 : 0;
  }

  function render(renderer, time, motion, draw) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!w || !h) return;
    const aspect = w / h;

    camera.aspect = aspect;
    camera.position.set(framing.eyeX, framing.eyeY, framing.eyeZ);
    camera.lookAt(0, framing.hoverY, 0);

    // Keep the photographic background in 'cover' mode, without stretching.
    const imageAspect = backdrop?.image
      ? backdrop.image.width / backdrop.image.height
      : 2730 / 1536;
    const repeatX = Math.min(1, aspect / imageAspect);
    const repeatY = Math.min(1, imageAspect / aspect);
    const offsetX = (1 - repeatX) / 2;
    const offsetY = (1 - repeatY) / 2;
    if (backdrop) {
      backdrop.repeat.set(repeatX, repeatY);
      backdrop.offset.set(offsetX, offsetY);
    }

    // Map desired location in the un-cropped photo onto the current viewport.
    const anchorX = THREE.MathUtils.clamp(
      (framing.photoX - offsetX) / repeatX, 0.05, 0.95,
    );
    const anchorY = THREE.MathUtils.clamp(
      (framing.photoY - offsetY) / repeatY, 0.05, 0.95,
    );
    camera.setViewOffset(w, h, (0.5 - anchorX) * w, (0.5 - anchorY) * h, w, h);

    ship.position.y = framing.hoverY;
    ship.rotation.y = THREE.MathUtils.degToRad(framing.yawDegrees);

    if (needsFit || w !== lastWidth || h !== lastHeight) {
      // Fit by the model's projected width, not an arbitrary hardcoded zoom.
      // This also holds the size steady when the browser is resized.
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      const width = projectedCraftWidth();
      camera.zoom = width > 0
        ? THREE.MathUtils.clamp(framing.screenWidth / width, 0.35, 8)
        : 1;
      camera.updateProjectionMatrix();
      needsFit = false;
      lastWidth = w;
      lastHeight = h;
    }

    ship.position.y = framing.hoverY
      + (motion ? Math.sin(time * 0.8) * framing.bobAmplitude : 0);
    ship.rotation.y = THREE.MathUtils.degToRad(framing.yawDegrees)
      + (motion ? Math.sin(time * 0.06) * 0.06 : 0);

    for (const material of owned) {
      if (material.emissiveIntensity === undefined) continue;
      material.userData.garageBaseGlow ??= material.emissiveIntensity;
      material.emissiveIntensity = material.userData.garageBaseGlow * glow;
    }

// Keep shadow on the garage floor
shadow.position.set(0, 0.01, 0);

// Follow craft heading, but not its hovering motion
shadow.rotation.y = ship.rotation.y;

// Slight change in shadow strength when craft hovers
const hover = ship.position.y - framing.hoverY;

shadowMaterial.opacity =
  THREE.MathUtils.clamp(0.95 - hover * 0.9, 0.5, 0.99);


    draw(scene, camera);
  }

  return {
    setCraft,
    render,
    setGlow(value) { glow = value; },
    // Optional: tweak composition at runtime without replacing this module.
    setFraming(values) { Object.assign(framing, values); needsFit = true; },
    getFraming() { return { ...framing }; },
    dispose() {
        shadowResources?.silhouette.dispose();
shadowResources?.soft.dispose();

shadowGeometry.dispose();
shadowMaterial.dispose();
scene.remove(shadow);

      disposed = true;
      backdrop?.dispose();
      owned.forEach(material => material.dispose());
      owned = [];
      content.clear();
    },
  };
}

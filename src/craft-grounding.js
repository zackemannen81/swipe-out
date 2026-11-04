import * as THREE from 'three';

// A one-time projected silhouette, not a second scene render or screen-space reflection.
// Once the model changes we rasterize its top-down outline, then reuse the texture.
function makeHullTexture(root) {
  if (typeof document === 'undefined') return null;
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const meshes = [];
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const temp = new THREE.Vector3();
  root.traverse(object => {
    if (!object.isMesh || !object.geometry?.getAttribute('position')) return;
    const position = object.geometry.getAttribute('position');
    const matrix = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
    meshes.push({ position, index: object.geometry.index, matrix });
    for (let i = 0; i < position.count; i++) {
      temp.fromBufferAttribute(position, i).applyMatrix4(matrix);
      minX = Math.min(minX, temp.x); maxX = Math.max(maxX, temp.x);
      minZ = Math.min(minZ, temp.z); maxZ = Math.max(maxZ, temp.z);
    }
  });
  if (!meshes.length || !Number.isFinite(minX)) return null;
  const width = Math.max(0.5, maxX - minX), length = Math.max(0.5, maxZ - minZ);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  const coords = [new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
  const px = x => 12 + (x - minX) / width * 104;
  const py = z => 12 + (z - minZ) / length * 104;
  for (const { position, index, matrix } of meshes) {
    const count = index ? index.count : position.count;
    for (let i = 0; i + 2 < count; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = index ? index.getX(i + k) : i + k;
        coords[k].fromBufferAttribute(position, v).applyMatrix4(matrix);
      }
      ctx.beginPath();
      ctx.moveTo(px(coords[0].x), py(coords[0].z));
      ctx.lineTo(px(coords[1].x), py(coords[1].z));
      ctx.lineTo(px(coords[2].x), py(coords[2].z));
      ctx.closePath();
      ctx.fill();
    }
  }
  const silhouette = new THREE.CanvasTexture(canvas);
  silhouette.colorSpace = THREE.NoColorSpace;
  silhouette.minFilter = THREE.LinearMipmapLinearFilter;
  silhouette.magFilter = THREE.LinearFilter;
  silhouette.generateMipmaps = true;

  const blur = document.createElement('canvas');
  blur.width = blur.height = 128;
  const blurCtx = blur.getContext('2d');
  blurCtx.filter = 'blur(6px)';
  blurCtx.drawImage(canvas, 0, 0);
  const soft = new THREE.CanvasTexture(blur);
  soft.colorSpace = THREE.NoColorSpace;
  soft.minFilter = THREE.LinearMipmapLinearFilter;
  soft.magFilter = THREE.LinearFilter;
  soft.generateMipmaps = true;
  return { silhouette, soft, width: width * 1.12, length: length * 1.12 };
}

export function createCraftGrounding(scene, root, accentColor = 0x43f6ea) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.rotateX(-Math.PI / 2); // road-frame normal is local +Y
  const shadowMaterial = new THREE.MeshBasicMaterial({
    // Neutral contact shadow. A cyan tint here looked like a light leaking through the hull.
    color: 0x050505, transparent: true, opacity: 0, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide, toneMapped: false,
  });
  const reflectionMaterial = new THREE.MeshBasicMaterial({
    // Subtle wet-road hint, not a cyan glowing decal on top of the shadow.
    color: new THREE.Color(0x9ba6ac).lerp(new THREE.Color(accentColor), 0.07),
    transparent: true, opacity: 0, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, side: THREE.DoubleSide, toneMapped: true,
  });
  const shadow = new THREE.Mesh(geometry, shadowMaterial);
  const reflection = new THREE.Mesh(geometry, reflectionMaterial);
  // The grey faux-reflection was drawn on top of the shadow and washed it out.
  // Keep the reflection mesh available for a future proper reflection pass,
  // but do not draw it as a light silhouette over the contact shadow.
  shadow.renderOrder = 7;
  reflection.renderOrder = 6;
  reflection.visible = false;
  scene.add(shadow, reflection);
  let resources = null;
  // Reused scratch objects: no per-frame matrix/vector allocations for orientation.
  const heading = new THREE.Vector3();
  const sideways = new THREE.Vector3();
  const groundBasis = new THREE.Matrix4();
  const groundRotation = new THREE.Quaternion();

  function setCraft(nextRoot) {
    if (resources) {
      resources.silhouette.dispose();
      resources.soft.dispose();
    }
    resources = makeHullTexture(nextRoot);
    shadowMaterial.map = resources?.soft ?? null;
    reflectionMaterial.map = resources?.silhouette ?? null;
    shadowMaterial.needsUpdate = reflectionMaterial.needsUpdate = true;
    if (resources) {
      shadow.scale.set(resources.width * 1.3, 1, resources.length * 1.4);
      reflection.scale.set(resources.width * 1.02, 1, resources.length * 1.10);
    }
  }

  function update(frame, physics, craft, enabled = true) {
    const visible = enabled && !!frame && !!resources && !!craft?.visible &&
      !physics?.flight && !physics?.airborne && physics?.recoveryTimer <= 0;
    shadow.visible = visible;
    reflection.visible = false; // Disabled: bright grey image on top of black shadow.
    if (!visible) return;
    // Frame axes and normal already include track banking, loops and shortcuts.
    const lane = physics.lateralOffset || 0;
    const base = frame.center.clone().addScaledVector(frame.right, lane);
    const height = Math.max(0, craft.position.clone().sub(base).dot(frame.normal));
    if (height > 9) { shadow.visible = reflection.visible = false; return; }
    const fade = Math.max(0, 1 - height / 9);
    shadow.position.copy(base).addScaledVector(frame.normal, 0.065);
    reflection.position.copy(base).addScaledVector(frame.normal, 0.075)
      .addScaledVector(frame.tangent, -Math.min(0.8, height * 0.3));
    // Keep the surface normal from the road, but steer the silhouette with the
    // craft's actual heading. Project its local +Z onto the road tangent plane;
    // this automatically handles yaw, banked turns and fully inverted loops.
    heading.set(0, 0, 1).applyQuaternion(craft.quaternion);
    heading.addScaledVector(frame.normal, -heading.dot(frame.normal));
    if (heading.lengthSq() < 1e-6) heading.copy(frame.tangent);
    heading.normalize();
    sideways.crossVectors(frame.normal, heading).normalize();
    groundBasis.makeBasis(sideways, frame.normal, heading);
    groundRotation.setFromRotationMatrix(groundBasis);
    shadow.quaternion.copy(groundRotation);
    reflection.quaternion.copy(groundRotation);
    const stretch = 1 + Math.min(1.5, height * 0.10);
    shadow.scale.z = resources.length * 1.4 * stretch;
    reflection.scale.z = resources.length * 1.1;
    // Strong enough to darken the wet sky reflection without hiding the hull shape.
    shadowMaterial.opacity = 0.72 * fade;
    reflectionMaterial.opacity = 0;
  }
  function dispose() {
    scene.remove(shadow, reflection);
    geometry.dispose();
    shadowMaterial.dispose();
    reflectionMaterial.dispose();
    resources?.silhouette.dispose();
    resources?.soft.dispose();
  }
  setCraft(root);
  return { update, setCraft, dispose };
}

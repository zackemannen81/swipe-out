import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const craftModelLoader = new GLTFLoader();

export async function createCraft(definition = {}) {
  const group = new THREE.Group();
  
  try {
    await loadCraftModel({ group }, definition.modelUrl);
  } catch (error) {
    console.warn(`Unable to load model`, error);
  }

  // Hämta accentfärgen från definitionen
  const color = new THREE.Color(definition.accentColor || 0x43f6ea);

  // Original single-source underglow, close to the craft's underside.
  const underGlow = new THREE.PointLight(color, 1.8, 4);
  underGlow.name = 'vehicleUnderglow';
  underGlow.position.set(0, -0.01, 0.1);
  underGlow.castShadow = false;
  group.add(underGlow);
  return { group, color };
}

export function loadCraftModel(craft, url = '/models/racer_optimized.glb') {
  return new Promise((resolve, reject) => {
    craftModelLoader.load(url, (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const largestDimension = Math.max(size.x, size.y, size.z);
      
      if (!largestDimension || !Number.isFinite(largestDimension)) {
        reject(new Error('Craft model has no measurable geometry'));
        return;
      }

      model.position.set(-center.x, -center.y, -center.z);
      model.scale.setScalar(3.15 / largestDimension);
      model.rotation.y = Math.PI / 2;
      
      model.traverse((object) => {
        if (object.isMesh) object.frustumCulled = false;
      });
      
      craft.group.add(model);
      resolve(model);
    }, undefined, reject);
  });
}


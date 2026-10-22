import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { particleSystem } from './game';
import { thruster_material } from './shaders';

const craftModelLoader = new GLTFLoader();

export async function createCraft(definition = {}) {
  const group = new THREE.Group();
  
  try {
    await loadCraftModel({ group }, definition.modelUrl);
  } catch (error) {
    console.warn(`Unable to load model`, error);
  }

  const color = new THREE.Color(definition.accentColor || 0x43f6ea);

  const localOffsets = [
    new THREE.Vector3(-0.34 ,0.0, -1.42),
    new THREE.Vector3(0.34, 0.0, -1.42),
    new THREE.Vector3(-0.34 ,0.0, -1.62),
    new THREE.Vector3(0.34, 0.0, -1.62),
    new THREE.Vector3(-0.34 ,0.0, -1.32),
    new THREE.Vector3(0.34, 0.0, -1.32),
    new THREE.Vector3(-0.34 ,0.0, -1.32),
    new THREE.Vector3(0.34, 0.0, -1.22)

  ];

  // Uppdaterade inställningar för en lång, sammanhängande svans
const emitters = localOffsets.map(offset => particleSystem.createEmitter({
    position: new THREE.Vector3(),
    rate: 35,             
    particleLifetime: 0.04, 
    particleScale: 1.0,
    particleSize: 2.8,     
    startAlpha: 0.8,       // Fullt synlig i motorn
    endAlpha: 0.0,         // Tonar mjukt ut till helt osynlig i slutet av svansen
    emissionVelocity: new THREE.Vector3(0, 0, 0), 
    particleMaterial: thruster_material 
  }));

  return {
    group,
    color,
    emitters,
    localOffsets,
    
updateThrusters(craftPosition, craftQuaternion, craftVelocity, throttle, boostActive) {
      let currentRate = THREE.MathUtils.lerp(4, 1, Math.max(0, throttle));
      if (boostActive) currentRate = 2; 

      // 1. SÄKERHET: Skapa en noll-vektor om skeppet inte har någon hastighet än
      const safeVelocity = craftVelocity ? craftVelocity : new THREE.Vector3(0, 0, 0);

      // 2. Beräkna den exakta lokala motkraften så partiklarna fryser i luften
      const invQuat = craftQuaternion.clone().invert();
      const localCraftVelocity = safeVelocity.clone().applyQuaternion(invQuat);
      
      const utskjutningsFart = localCraftVelocity.negate();
      utskjutningsFart.z += boostActive ? -20 : -10;

      this.emitters.forEach((emitter, index) => {
        const localOffset = this.localOffsets[index];
        
        emitter.position.copy(localOffset).applyQuaternion(craftQuaternion).add(craftPosition);
        emitter.quaternion.copy(craftQuaternion);
        
        // Nu kan vi säkert kopiera in safeVelocity
        emitter.craftVelocity.copy(safeVelocity);
        
        emitter.rate = currentRate;
        emitter.emissionVelocity.copy(utskjutningsFart);
        emitter.active = true;
      });
    }
  };
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
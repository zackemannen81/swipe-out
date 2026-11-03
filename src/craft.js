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

  // Broad, soft chassis glow instead of a point-light specular hotspot.

  const underGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.8,5.2),new THREE.ShaderMaterial({
    uniforms:{glowColor:{value:color.clone()}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending,
    vertexShader:'varying vec2 uvGlow; void main(){uvGlow=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 glowColor; varying vec2 uvGlow; void main(){float r=length((uvGlow-.5)*2.0); float a=pow(max(0.0,1.0-r),1.5)*.55; gl_FragColor=vec4(glowColor,a); #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }'.replace('; #include',';\n #include')
  }));
  underGlow.name='vehicleUnderglow';underGlow.rotation.x=-Math.PI/2;
  
  // Normal hover is 0.62 units; keep the glow just above the road surface.
  underGlow.position.set(0, -0.5, 0.1);


  // Lägg till ljuset i skeppets grupp så det följer med per automatik
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


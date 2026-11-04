import * as THREE from 'three';
import {forestMap} from './vitrum-materials.js';
import { createVitrumRoad } from './VitrumRoadMaterial.js';

// Per-track ownership: disposeTrackGroup releases every map when rebuilding.
export function createForestMaps(surface, repeat = [1, 1]) {
  if (typeof document === 'undefined') return {};
  const loader = new THREE.TextureLoader();
  const load = (channel, color = false) => {
    const texture = loader.load(forestMap(surface, channel));
    texture.name = `Vitrum/${surface}/${channel}`;
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.anisotropy = 8;
    return texture;
  };
  return {
    map: load('basecolor', true),
    normalMap: load('normal_approx'),
    roughnessMap: load('roughness'),
    ...(surface === 'mycelium' ? {emissiveMap: load('emissive_mask', true)} : {}),
  };
}

export function createVitrumDeckMaterial(roadUvRepeats = 1) {
  // Each track build owns its material and generated data textures.
  const vitrum = createVitrumRoad({
    width: 512,
    height: 1024,
    seed: 1981,
    roots: 7,
    glow: 2.4,
    flowSpeed: 0.11,
    roadUvRepeats,
  });

  const material = vitrum.material;
  material.name = 'Vitrum/mycelium-deck';
  material.side = THREE.DoubleSide;    // Magnetic loops and inverted surfaces.
  material.vertexColors = true;       // Preserve the road's weathered vertex colors.
  material.envMap = createDeckEnvironment();
  material.envMapIntensity = 0.55;
  material.userData.vitrumRoad = vitrum; // Track owns update + disposal.
  return material;
}

function createDeckEnvironment() {
  if (typeof document === 'undefined') return null;
  // Reuse the supplied sky, downsampled before GPU upload. Keeping ownership
  // with the road also works in the editor and frees Three's cached PMREM.
  const texture = new THREE.Texture();
  texture.name = 'Vitrum/deck-environment';
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  let disposed = false;
  texture.addEventListener('dispose', () => { disposed = true; });
  new THREE.ImageLoader().load('/images/backdrop_track-017.jpg', image => {
    if (disposed) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    canvas.getContext('2d').drawImage(image, 0, 0, 1024, 512);
    texture.image = canvas;
    texture.needsUpdate = true;
  });
  return texture;
}

/**
 * VitrumRoadMaterial.js
 * Procedural 2D vein growth + old-school plasma LUT + real Three.js PBR glasscoat.
 * WebGLRenderer / MeshPhysicalMaterial (onBeforeCompile).
 * No canvas, no per-frame texture uploads, no fragment-shader sin/cos.
 *
 * UV convention: U = across road (0..1), V = distance along road (0..1).
 * V should be continuous between track mesh segments for uninterrupted patterns.
 */
import * as THREE from 'three';

// Stable pseudorandom generator (same seed => same road).
function rng32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function smooth(x) { return x * x * (3 - 2 * x); }

// CPU ONLY: grow 2D lines in a low-resolution flow field, then rasterize RGBA data.
// Channels: R=vein coverage, G=distance along vein, B=apparent depth, A=branch class.
function generateVeinTexture(width, height, seed, rootCount) {
  const rand = rng32(seed);
  const pixels = new Uint8Array(width * height * 4);
  const fieldSize = 24;
  const field = new Float32Array(fieldSize * fieldSize);
  for (let i = 0; i < field.length; i++) field[i] = rand() * 2 - 1;

  // Smoothly sample a fixed coarse flow field. No trigonometry.
  function flowAt(x, y) {
    const fx = clamp(x / width, 0, 0.99999) * (fieldSize - 1);
    const fy = clamp(y / height, 0, 0.99999) * (fieldSize - 1);
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = smooth(fx - ix), ty = smooth(fy - iy);
    const ix1 = Math.min(ix + 1, fieldSize - 1);
    const iy1 = Math.min(iy + 1, fieldSize - 1);
    const a = field[iy * fieldSize + ix] * (1 - tx) + field[iy * fieldSize + ix1] * tx;
    const b = field[iy1 * fieldSize + ix] * (1 - tx) + field[iy1 * fieldSize + ix1] * tx;
    return a * (1 - ty) + b * ty;
  }

  function stamp(x, y, radius, strength, distance, generation) {
    const x0 = Math.max(0, Math.floor(x - radius - 1));
    const x1 = Math.min(width - 1, Math.ceil(x + radius + 1));
    const y0 = Math.max(0, Math.floor(y - radius - 1));
    const y1 = Math.min(height - 1, Math.ceil(y + radius + 1));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const d = Math.hypot(px + 0.5 - x, py + 0.5 - y);
        const coverage = clamp(radius + 0.5 - d, 0, 1) * strength;
        const intensity = Math.round(coverage * 255);
        const i = (py * width + px) * 4;
        if (intensity <= pixels[i]) continue; // strongest vein wins at crossings
        pixels[i] = intensity;
        pixels[i + 1] = Math.round(clamp(distance / (height * 2.5), 0, 1) * 255);
        pixels[i + 2] = Math.round(clamp(0.18 + generation * 0.19, 0, 1) * 255);
        pixels[i + 3] = Math.round(clamp(generation / 4, 0, 1) * 255);
      }
    }
  }

  function drawStroke(a, b, radius, strength, distance, gen) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(length / 0.65));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      stamp(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t,
        radius, strength, distance + length * t, gen);
    }
  }

  const tips = [];
  let spawned = 0;
  function spawn(x, y, dx, energy, generation, distance = 0) {
    if (spawned >= 150) return;
    tips.push({ x, y, dx, energy, generation, distance });
    spawned++;
  }

  for (let n = 0; n < rootCount; n++) {
    // Main roots enter from bottom; a few start later to avoid one huge tuft.
    const x = width * (0.12 + 0.76 * rand());
    const y = n < rootCount * 0.7 ? 2 : rand() * height * 0.25;
    spawn(x, y, (rand() - 0.5) * 0.65, 0.9 + rand() * 0.1, 0);
  }

  let iterations = 0;
  while (tips.length && iterations++ < 160000) {
    // Work backwards because branches can be appended during the loop.
    for (let i = tips.length - 1; i >= 0; i--) {
      const tip = tips[i];
      const old = { x: tip.x, y: tip.y };
      const drift = flowAt(tip.x, tip.y) * 0.11 + (rand() - 0.5) * 0.12;
      const centerBias = (0.5 - tip.x / width) * 0.025;
      tip.dx = clamp(tip.dx * 0.93 + drift + centerBias, -1.5, 1.5);
      const step = 1.65;
      const scale = step / Math.hypot(tip.dx, 1.0);
      tip.x += tip.dx * scale;
      tip.y += scale; // always moves predominantly along +V
      const travel = Math.hypot(tip.x - old.x, tip.y - old.y);
      tip.distance += travel;
      tip.energy -= 0.0018 + tip.generation * 0.00045;

      const radius = Math.max(0.5, (2.7 - tip.generation * 0.5) * Math.sqrt(Math.max(0.1, tip.energy)));
      drawStroke(old, tip, radius, clamp(tip.energy, 0, 1), tip.distance - travel, tip.generation);

      if (rand() < 0.012 && tip.generation < 3 && tip.energy > 0.4 && spawned < 150) {
        const side = rand() < 0.5 ? -1 : 1;
        spawn(tip.x, tip.y, tip.dx + side * (0.5 + 0.35 * rand()),
          tip.energy * (0.68 + 0.12 * rand()), tip.generation + 1, tip.distance);
      }

      if (tip.energy <= 0.12 || tip.y >= height - 2 || tip.x < 2 || tip.x >= width - 2) {
        tips.splice(i, 1);
      }
    }
  }

  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping; // No discontinuity at mirrored tile boundaries.
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace; // channel data, not RGB colors
  texture.needsUpdate = true;
  return texture;
}

// 256 x 256 periodic 8-bit plasma. One LUT initialization; zero sin/cos in GLSL.
function generatePlasmaTexture(size = 256) {
  const wave = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) wave[i] = Math.sin(i * 2 * Math.PI / 1024);
  const pixels = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = wave[(x * 4 + y * 8) & 1023];
      const b = wave[(x * 12 - y * 4 + 240) & 1023];
      const c = wave[(x * 8 + 116) & 1023] * wave[(y * 8 + 450) & 1023];
      const d = wave[(x * 4 - y * 12 + 630) & 1023];
      const v = (a * 0.35 + b * 0.30 + c * 0.20 + d * 0.15) * 0.5 + 0.5;
      pixels[y * size + x] = Math.round(clamp(v, 0, 1) * 255);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

// 256 x 1 pastel rainbow palette (zero sin/cos, even when generating the palette).
function generatePaletteTexture() {
  const stops = [
    [115, 236, 224], [145, 198, 255], [200, 168, 250],
    [255, 176, 211], [255, 214, 169], [255, 235, 163], [115, 236, 224]
  ];
  const pixels = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 256 * (stops.length - 1);
    const a = Math.floor(t), f = t - a;
    for (let c = 0; c < 3; c++) {
      pixels[i * 4 + c] = Math.round(stops[a][c] * (1 - f) + stops[a + 1][c] * f);
    }
    pixels[i * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace; // these pixels ARE colors
  texture.needsUpdate = true;
  return texture;
}

/**
 * createVitrumRoad(options)
 * Returns { material, textures, uniforms, update(timeSeconds), regenerate(seed), dispose() }.
 * Use material on an EXISTING mesh with valid UVs; don't change racing physics.
 */
export function createVitrumRoad({
  width = 512,
  height = 1024,
  seed = 1981,
  roots = 7,
  glow = 2.4,
  flowSpeed = 0.11,
  plasmaSpeed = 1.0,
  roughness = 0.19,
  clearcoat = 1.0,
  clearcoatRoughness = 0.075,
  iridescence = 0.35,
  roadUvRepeats = 1,
} = {}) {
  const veinTex = generateVeinTexture(width, height, seed, roots);
  const plasmaTex = generatePlasmaTexture();
  const paletteTex = generatePaletteTexture();
  // Track UVs are (distance * roadUvRepeats, across), opposite to the original shader.
  // An EVEN number of mirrored vein tiles ensures a seamless lap closure.
  const repeats = Math.max(1, roadUvRepeats);
  const veinTiles = Math.max(2, 2 * Math.round(repeats / 10));
  const plasmaTiles = Math.max(1, Math.round(repeats / 10));

  const uniforms = {
    uVitrumTime: { value: 0 },
    uVitrumVeins: { value: veinTex },
    uVitrumPlasma: { value: plasmaTex },
    uVitrumPalette: { value: paletteTex },
    uVitrumGlow: { value: glow },
    uVitrumFlowSpeed: { value: flowSpeed },
    uVitrumPlasmaSpeed: { value: plasmaSpeed },
    uVitrumVeinUvScale: { value: veinTiles / repeats },
    uVitrumPlasmaUvScale: { value: plasmaTiles / repeats },
  };

  // Real reflections, clearcoat and iridescence. No separate transparent meshes.
  // Three.js handles scene lights, shadows, tone mapping, color space and scene.fog.
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness,
    metalness: 0.0,
    clearcoat,
    clearcoatRoughness,
    iridescence,
    iridescenceIOR: 1.3,
    envMapIntensity: 1.0,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms); // share holders; update() does not force shader rebuild

    const vertexMarker = '#include <uv_vertex>';
    const fragmentHeader = '#include <common>';
    const colorMarker = '#include <color_fragment>';
    const emissionMarker = '#include <emissivemap_fragment>';
    if (!shader.vertexShader.includes(vertexMarker) ||
        !shader.fragmentShader.includes(colorMarker) ||
        !shader.fragmentShader.includes(emissionMarker)) {
      throw new Error('VitrumRoad: Three.js shader chunks changed. Check current version.');
    }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>', '#include <common>\nvarying vec2 vVitrumUv;'
    ).replace(vertexMarker, `${vertexMarker}\n vVitrumUv = uv;`);

    shader.fragmentShader = shader.fragmentShader.replace(fragmentHeader, `${fragmentHeader}
      varying vec2 vVitrumUv;
      uniform float uVitrumTime;
      uniform float uVitrumGlow;
      uniform float uVitrumFlowSpeed;
      uniform float uVitrumPlasmaSpeed;
      uniform float uVitrumVeinUvScale;
      uniform float uVitrumPlasmaUvScale;
      uniform sampler2D uVitrumVeins;
      uniform sampler2D uVitrumPlasma;
      uniform sampler2D uVitrumPalette;
    `);

    shader.fragmentShader = shader.fragmentShader.replace(colorMarker, `${colorMarker}
      // 1. Smoke / opal body: animated, tiling, two cheap plasma LUT samples.
      vec2 veinUv = vec2(vVitrumUv.y, vVitrumUv.x * uVitrumVeinUvScale);
      vec2 plasmaUv = vec2(vVitrumUv.y, vVitrumUv.x * uVitrumPlasmaUvScale);
      float t = uVitrumTime * uVitrumPlasmaSpeed;
      float cloudA = texture2D(uVitrumPlasma, plasmaUv * vec2(1.8, 3.0) + vec2(t * 0.006, t * 0.002)).r;
      float cloudB = texture2D(uVitrumPlasma, plasmaUv * vec2(3.5, 2.0) + vec2(-t * 0.003, t * 0.005)).r;
      float cloud = mix(cloudA, cloudB, 0.38);

      vec3 deepPetrol = vec3(0.045, 0.09, 0.14);
      vec3 turquoise = vec3(0.055, 0.27, 0.255);
      vec3 softViolet = vec3(0.15, 0.08, 0.23);
      vec3 stone = mix(deepPetrol, turquoise, smoothstep(0.12, 0.84, cloud));
      stone = mix(stone, softViolet, smoothstep(0.67, 0.95, cloud) * 0.36);
      diffuseColor.rgb *= stone;

      // 2. Static biological network with moving rainbow energy within it.
      vec4 network = texture2D(uVitrumVeins, veinUv);
      float mask = network.r;
      float flow = fract(network.g * 5.0 - uVitrumTime * uVitrumFlowSpeed);
      vec3 rainbow = texture2D(uVitrumPalette, vec2(flow, 0.5)).rgb;
      float depthAttenuation = mix(1.0, 0.46, network.b);
      float cloudyAttenuation = mix(0.60, 1.0, cloud);
      vec3 vitrumEmission = rainbow * mask * depthAttenuation * cloudyAttenuation * uVitrumGlow;
      diffuseColor.rgb = mix(diffuseColor.rgb, rainbow * 0.14, mask * 0.24);
    `);

    shader.fragmentShader = shader.fragmentShader.replace(
      emissionMarker, `${emissionMarker}\n totalEmissiveRadiance += vitrumEmission;`
    );
  };
  material.customProgramCacheKey = () => 'vitrum-road-pbr-v1';

  return {
    material,
    textures: { veins: veinTex, plasma: plasmaTex, palette: paletteTex },
    uniforms,
    update(timeSeconds) { uniforms.uVitrumTime.value = timeSeconds; },
    regenerate(newSeed = seed) {
      const next = generateVeinTexture(width, height, newSeed, roots);
      uniforms.uVitrumVeins.value.dispose();
      uniforms.uVitrumVeins.value = next;
      this.textures.veins = next;
      // No material.needsUpdate needed: same sampler uniform, new texture value.
    },
    dispose() {
      material.dispose();
      uniforms.uVitrumVeins.value.dispose();
      plasmaTex.dispose();
      paletteTex.dispose();
    },
  };
}

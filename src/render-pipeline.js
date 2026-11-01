import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Construct passes only after the scene and camera have their initial state.
// Nothing is drawn here: effects run exclusively inside render().
export function createRenderPipeline({ scene, camera, renderer, getTrack }) {
  const composer = new EffectComposer(renderer);
  const scenePass = new RenderPass(scene, camera);
  composer.addPass(scenePass);

  // A corrupt/negative/NaN HDR pixel can spread over many pixels during bloom
  // filtering. Protect every fresh session; F5 toggles a diagnostic comparison.
  // It operates on the fully rendered HDR image, not individual materials.
  const hdrSanitizer = new ShaderPass({
    name: 'HDRFiniteSanitizer',
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      float cleanHDR(float v) {
        // Both comparisons are false for NaN; infinities fail one bound.
        if (!(v >= 0.0 && v <= 65500.0)) return 0.0;
        return min(v, 128.0);
      }
      void main() {
        vec4 pixel = texture2D(tDiffuse, vUv);
        gl_FragColor = vec4(
          cleanHDR(pixel.r),
          cleanHDR(pixel.g),
          cleanHDR(pixel.b),
          1.0
        );
      }
    `,
  });
  hdrSanitizer.enabled = true;
  composer.addPass(hdrSanitizer);

  const unrealBloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.7, 0.78);
  composer.addPass(unrealBloom);
  const standardBloom = new BloomPass(0.30, 25, 4);
  standardBloom.enabled = false;
  composer.addPass(standardBloom);
  const output = new OutputPass();
  output.enabled = false;
  composer.addPass(output);

  // Keep diagnostics until the rectangular artifact has been isolated.
  const modes = [
    'composer + bloom (legacy)',
    'direct renderer',
    'composer without bloom (direct)',
    'composer offscreen + output (NO bloom)',
    'composer + bloom + output',
    'composer + standard BloomPass + output',
  ];
  let mode = 0;
  let sanitizeHDR = true;
  const nativePixelRatio = renderer.getPixelRatio();
  const resolutionScales = [1, 0.75, 0.5, 0.25];
  let resolutionIndex = 0;
  const configuredFog = scene.fog;
  let bloomEnabled = true;
  const label = document.createElement('div');
  label.className = 'render-debug';
  Object.assign(label.style, {
    position: 'fixed', bottom: '36px', left: '14px', zIndex: '99999',
    color: '#4ef4e5', background: '#07131de0', padding: '7px 10px',
    font: '12px monospace', pointerEvents: 'none',
  });
  document.body.appendChild(label);

  function updateLabel() {
    label.textContent = 'F6: ' + modes[mode]
      + ' | F5: HDR sanitize ' + (sanitizeHDR ? 'ON' : 'OFF')
      + ' | F10: composer ' + Math.round(resolutionScales[resolutionIndex] * 100) + '%'
      + ' | F7: fog ' + (scene.fog ? 'ON' : 'OFF');
  }

  function handleDebugKey(event) {
    if (event.code === 'F5') {
      event.preventDefault();
      sanitizeHDR = !sanitizeHDR;
      updateLabel();
    } else if (event.code === 'F10') {
      event.preventDefault();
      resolutionIndex = (resolutionIndex + 1) % resolutionScales.length;
      composer.setPixelRatio(renderer.getPixelRatio() * resolutionScales[resolutionIndex]);
      console.log('[Render debug] framebuffer:', composer.readBuffer.width, composer.readBuffer.height,
        'screen:', renderer.domElement.width, renderer.domElement.height);
      updateLabel();
    } else if (event.code === 'F6') {
      event.preventDefault();
      mode = (mode + 1) % modes.length;
      updateLabel();
    } else if (event.code === 'F7') {
      event.preventDefault();
      scene.fog = scene.fog ? null : configuredFog;
      updateLabel();
    } else if (event.code === 'F8') {
      event.preventDefault();
      const scenery = scene.getObjectByName('customTrackObjects');
      if (scenery) scenery.visible = !scenery.visible;
      console.log('[Render debug] scenery:', scenery?.visible ?? 'not loaded');
    } else if (event.code === 'F9') {
      event.preventDefault();
      const track = getTrack();
      if (track) track.visible = !track.visible;
      console.log('[Render debug] track:', track?.visible ?? 'not loaded');
    }
  }
  window.addEventListener('keydown', handleDebugKey);
  updateLabel();

  function resize() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    camera.aspect = width / height;
    camera.fov = width < 700 ? 54 : 46;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio() * resolutionScales[resolutionIndex]);
    composer.setSize(width, height);
    console.log('[Render debug] framebuffer:', composer.readBuffer.width, composer.readBuffer.height,
      'screen:', renderer.domElement.width, renderer.domElement.height);
    return { width, height };
  }

  function setBloomStrength(strength) {
    unrealBloom.strength = strength;
  }

  // Called once per frame, strictly after physics, scene transforms and camera.
  function render(activeScene = scene, activeCamera = camera) {
    scenePass.scene=activeScene;scenePass.camera=activeCamera;
    if (mode === 1) {
      renderer.setRenderTarget(null);
      renderer.render(activeScene, activeCamera);
      return;
    }
    composer.renderToScreen = true;
    hdrSanitizer.enabled = sanitizeHDR && (mode === 0 || mode === 4 || mode === 5);
    unrealBloom.enabled = bloomEnabled && (mode === 0 || mode === 4);
    standardBloom.enabled = bloomEnabled && mode === 5;
    output.enabled = mode >= 3;
    composer.render();
  }

  function dispose() {
    window.removeEventListener('keydown', handleDebugKey);
    label.remove();
    composer.dispose();
  }

  function setPreferences(settings) {
    bloomEnabled=settings.bloom;
    resolutionIndex={high:0,balanced:1,low:2}[settings.quality]??0;
    renderer.setPixelRatio(Math.min(nativePixelRatio,{high:2,balanced:1.5,low:1}[settings.quality]??2));
    resize();
  }
  return { resize, setBloomStrength, render, dispose, setPreferences };
}

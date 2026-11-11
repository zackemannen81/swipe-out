import {updateAmbientParticles} from './ambient-particles.js';
import {updateScenery} from './scenery-motion.js';
import {updateVitrumSpores} from './vitrum-spores.js';
import { updateWeaponPads } from './weapon-pads.js';
import { updateTrackPresentation, padPlacement } from './track-pads.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { createTrack, spawnTrackObjects, disposeTrackGroup } from './track.js';
import { hasSurface, createTrackCurve } from './track-path.js';

export function createEditorView(canvas, { onSelect, onMove, onCommit, onError }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080f1a');
  let skyPath='', skyTexture=null, skyRequest=0;
  const skyLoader=new THREE.TextureLoader();
  function setSky(path) {
    if(path===skyPath)return;
    skyPath=path??'';
    const request=++skyRequest;
    if(skyTexture){skyTexture.dispose();skyTexture=null;}
    scene.background=new THREE.Color('#080f1a');
    if(!skyPath)return;
    skyLoader.load(skyPath,texture=>{
      if(request!==skyRequest){texture.dispose();return;}
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.mapping=THREE.EquirectangularReflectionMapping;
      skyTexture=texture;
      scene.background=texture;
    },undefined,error=>{
      if(request===skyRequest)onError?.('Sky preview failed: '+(error?.message??skyPath));
    });
  }
  const fillLight=new THREE.HemisphereLight(0xc5edff, 0x182238, 2.4);
  scene.add(fillLight);
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(200, 500, 100);
  scene.add(light);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200000);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.minDistance = 3;
  orbit.maxDistance = 100000;
  const transform = new TransformControls(camera, canvas);
  transform.setSize(0.8);
  scene.add(transform.getHelper());
  const anchor = new THREE.Object3D();
  scene.add(anchor);
  const markers = new THREE.Group();
  let markerSelections = [];
  scene.add(markers);
  // Selection boxes stay separate from authored scenery and never get saved.
  const selectionHelpers = new THREE.Group();
  scene.add(selectionHelpers);
  let selectedObjects = new Set();
  let helperTargets = [];
  let flyMode = false;
  const flyKeys = new Set();
  let flyPointer = null;
  let flyYaw = 0, flyPitch = 0;
  let previousFrame = performance.now();
  let lastHighlightRefresh = 0;
  const flyForward = new THREE.Vector3();
  const flyRight = new THREE.Vector3();
  const flyMove = new THREE.Vector3();
  const flyUp = new THREE.Vector3(0, 1, 0);
  const isTyping = target => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));

  function syncHighlights() {
    const roots = scene.getObjectByName('customTrackObjects')?.children ?? [];
    const next = [...selectedObjects].map(index => roots[index]).filter(Boolean);
    if (helperTargets.length === next.length && next.every((root, index) => helperTargets[index] === root)) return;
    for (const helper of [...selectionHelpers.children]) {
      selectionHelpers.remove(helper);
      helper.geometry.dispose();
      helper.material.dispose();
    }
    helperTargets = next;
    next.forEach(root => {
      const helper = new THREE.BoxHelper(root, 0x5de8df);
      helper.material.depthTest = false;
      helper.material.transparent = true;
      helper.renderOrder = 15;
      selectionHelpers.add(helper);
    });
  }

  function setFlyMode(enabled) {
    flyMode = Boolean(enabled);
    flyKeys.clear();
    flyPointer = null;
    orbit.enabled = !flyMode;
    transform.enabled = !flyMode;
    transform.getHelper().visible = !flyMode;
    if (flyMode) {
      const direction = camera.getWorldDirection(new THREE.Vector3());
      flyYaw = Math.atan2(-direction.x, -direction.z);
      flyPitch = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));
      camera.up.set(0, 1, 0);
      camera.rotation.order = 'YXZ';
      camera.rotation.set(flyPitch, flyYaw, 0);
      canvas.focus({ preventScroll: true });
    } else {
      camera.getWorldDirection(flyForward);
      orbit.target.copy(camera.position).addScaledVector(flyForward, 40);
      orbit.update();
      syncSelection();
    }
    return flyMode;
  }
  function onFlyKeyDown(event) {
    if (!flyMode || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(event.code)) {
      flyKeys.add(event.code);
      event.preventDefault();
    }
  }
  function onFlyKeyUp(event) { flyKeys.delete(event.code); }
  function stopFlyMovement() { flyKeys.clear(); flyPointer = null; }
  window.addEventListener('keydown', onFlyKeyDown);
  window.addEventListener('keyup', onFlyKeyUp);
  window.addEventListener('blur', stopFlyMovement);
  function updateFly(delta) {
    if (!flyMode) return;
    camera.rotation.set(flyPitch, flyYaw, 0, 'YXZ');
    camera.getWorldDirection(flyForward);
    flyRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    const forward = Number(flyKeys.has('KeyW') || flyKeys.has('ArrowUp')) - Number(flyKeys.has('KeyS') || flyKeys.has('ArrowDown'));
    const strafe = Number(flyKeys.has('KeyD') || flyKeys.has('ArrowRight')) - Number(flyKeys.has('KeyA') || flyKeys.has('ArrowLeft'));
    const vertical = Number(flyKeys.has('KeyE')) - Number(flyKeys.has('KeyQ'));
    flyMove.set(0, 0, 0).addScaledVector(flyForward, forward).addScaledVector(flyRight, strafe).addScaledVector(flyUp, vertical);
    if (flyMove.lengthSq() > 0) {
      const speed = flyKeys.has('ShiftLeft') || flyKeys.has('ShiftRight') ? 300 : 65;
      camera.position.addScaledVector(flyMove.normalize(), delta * speed);
    }
    orbit.target.copy(camera.position).addScaledVector(flyForward, 40);
  }
  const markerGeometry = new THREE.SphereGeometry(1, 12, 8);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: '#b6ffff', depthTest: false });
  const selectedMaterial = new THREE.MeshBasicMaterial({ color: '#ff5f98', depthTest: false });
  const grid = new THREE.GridHelper(2000, 40, 0x1d3542, 0x10212c);
  scene.add(grid);
  let track, road, selection = { kind: 'point', index: 0 };
  let sceneryKey = '', dirty = false, lastBuild = 0;
  const bounds = new THREE.Box3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  let wasDragging = false;

  function build() {
    const vitrum=track.id==='vitrum-neural-ascent';
    light.intensity=vitrum?0.28:3;
    light.color.setHex(vitrum?0xffdfa0:0xffffff);
    fillLight.intensity=vitrum?0.25:2.4;
    fillLight.color.setHex(vitrum?0xc8d8ac:0xc5edff);
    fillLight.groundColor.setHex(vitrum?0x29351c:0x182238);
    if (road) { scene.remove(road); disposeTrackGroup(road); }
    const assets = createTrack(track);
    road = assets.group;
    // A thin centerline keeps the route legible at editing distances where
    // the actual road and rails become sub-pixel; geometry still comes from game.
    const points = [], colors = [];
    for (let i = 0; i < 600; i++) {
      points.push(assets.curve.getPointAt(i / 600), assets.curve.getPointAt((i + 1) / 600));
      const color = new THREE.Color(hasSurface(assets.curve, (i + 0.5) / 600 * assets.length) ? 0x45c4ce : 0xffa344);
      colors.push(...color.toArray(), ...color.toArray());
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const guide = new THREE.LineSegments(geometry,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, depthTest: false }));
    guide.renderOrder = 5;
    road.add(guide);
    scene.add(road);
    const nextSceneryKey = JSON.stringify([track.horizontalScale, track.objects]);
    if (nextSceneryKey !== sceneryKey) {
      spawnTrackObjects(scene, track);
      sceneryKey = nextSceneryKey;
    }
    syncHighlights();
    dirty = false;
    lastBuild = performance.now();
  }

  function syncSelection() {
    markers.children.forEach((mesh, i) => { const s=markerSelections[i]; mesh.material = s.kind===selection.kind && s.index===selection.index && s.branch===selection.branch ? selectedMaterial : markerMaterial; });
    const source = selection.kind === 'point' ? track.centerline[selection.index] : selection.kind === 'branch' ? track.branches?.[selection.branch]?.points[selection.index] : track.objects[selection.index]?.position;
    if (!source) { transform.detach(); return; }
    if (!transform.dragging) anchor.position.set(source[0] * track.horizontalScale, source[1], source[2] * track.horizontalScale);
    transform.attach(anchor);
  }

  transform.addEventListener('dragging-changed', event => {
    orbit.enabled = !event.value;
    if (event.value) wasDragging = true;
    else { onCommit(); if (dirty) build(); }
  });
  transform.addEventListener('objectChange', () => {
    const p = anchor.position;
    onMove(selection, [p.x / track.horizontalScale, p.y, p.z / track.horizontalScale].map(n => Math.round(n * 100) / 100));
  });
  canvas.addEventListener('pointerdown', event => {
    if (flyMode) {
      if (event.button === 0) {
        flyPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
      }
      return;
    }
    down = [event.clientX, event.clientY];
    wasDragging = Boolean(transform.axis);
  });
  canvas.addEventListener('pointermove', event => {
    if (!flyMode || !flyPointer || flyPointer.id !== event.pointerId) return;
    const dx = event.clientX - flyPointer.x, dy = event.clientY - flyPointer.y;
    flyPointer.x = event.clientX; flyPointer.y = event.clientY;
    flyYaw -= dx * 0.003;
    flyPitch = THREE.MathUtils.clamp(flyPitch - dy * 0.003, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
  });
  canvas.addEventListener('pointercancel', () => { flyPointer = null; down = null; });
  canvas.addEventListener('contextmenu', event => { if (flyMode) event.preventDefault(); });
  canvas.addEventListener('pointerup', event => {
    if (flyMode) { flyPointer = null; return; }
    if (!down || wasDragging || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const pointHit = raycaster.intersectObjects(markers.children)[0];
    const scenery = scene.getObjectByName('customTrackObjects');
    const objectHit = scenery && raycaster.intersectObjects(scenery.children)[0];
    if (pointHit) onSelect({ ...markerSelections[markers.children.indexOf(pointHit.object)] });
    else if (objectHit) {
      let root = objectHit.object;
      while (root.parent && root.parent !== scenery) root = root.parent;
      if (root.parent === scenery) onSelect({kind:'object',index:scenery.children.indexOf(root)}, { additive: event.shiftKey || event.ctrlKey || event.metaKey });
    }
  });

  function setTrack(value, nextSelection = selection, indexes = [...selectedObjects]) {
    track = value;
    selection = nextSelection;
    selectedObjects = new Set(indexes.filter(i => i >= 0 && i < track.objects.length));
    const sources = track.centerline.map((p,index)=>({p,selection:{kind:'point',index}}));
    (track.branches??[]).forEach((b,branch)=>b.points.forEach((p,index)=>sources.push({p,selection:{kind:'branch',branch,index}})));
    markerSelections = sources.map(s=>s.selection);
    while (markers.children.length < sources.length) {
      const mesh = new THREE.Mesh(markerGeometry, markerMaterial);
      mesh.renderOrder = 10;
      markers.add(mesh);
    }
    while (markers.children.length > sources.length) markers.remove(markers.children.at(-1));
    bounds.makeEmpty();
    sources.forEach(({p}, i) => {
      markers.children[i].position.set(p[0] * track.horizontalScale, p[1], p[2] * track.horizontalScale);
      bounds.expandByPoint(markers.children[i].position);
    });
    grid.position.y = bounds.min.y - 10;
    dirty = true;
    syncSelection();
  }

  function fit(top = false) {
    const center = bounds.getCenter(new THREE.Vector3());
    const size = Math.max(bounds.getSize(new THREE.Vector3()).length(), 30);
    const distance = size / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.min(camera.aspect, 1) * 0.9;
    orbit.target.copy(center);
    camera.up.set(0, 1, 0);
    const direction = top === 'side' ? new THREE.Vector3(1, 0.001, 0) : new THREE.Vector3(top ? 0 : 0.7, top ? 1 : 0.9, top ? 0.001 : 1);
    camera.position.copy(center).addScaledVector(direction.normalize(), distance);
    orbit.update();
  }

  const observer = new ResizeObserver(() => {
    const { width, height } = canvas.getBoundingClientRect();
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  });
  observer.observe(canvas);
  const initialRect = canvas.getBoundingClientRect();
  camera.aspect = initialRect.width / Math.max(initialRect.height, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(initialRect.width, initialRect.height, false);
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const delta = Math.min(0.05, Math.max(0, (now - previousFrame) / 1000));
    previousFrame = now;
    if (dirty && (!transform.dragging || now - lastBuild > 120)) build();
    if (flyMode) updateFly(delta);
    else orbit.update();
    if (selectionHelpers.children.length && (transform.dragging || now - lastHighlightRefresh > 120)) {
      for (const helper of selectionHelpers.children) helper.update();
      lastHighlightRefresh = now;
    }
    for (const marker of markers.children) {
      marker.scale.setScalar(camera.position.distanceTo(marker.position) * 0.006);
    }
    updateTrackPresentation(road, performance.now()/1000);
    const particleTime=document.getElementById('scenery-preview')?.checked?performance.now()/1000:0;
    updateVitrumSpores(road,particleTime);
    updateAmbientParticles(road,particleTime);
    updateWeaponPads(road, performance.now()/1000, null, true);
    const errors=scene.getObjectByName('customTrackObjects')?.userData.loadErrors;
    if(errors?.length)onError?.('GLB: '+errors.splice(0).join('; '));
    updateScenery(scene, performance.now()/1000, {preview:document.getElementById('scenery-preview')?.checked,helpers:true});
    renderer.render(scene, camera);
  });
  return {
    setTrack, setSky, fit, setFlyMode,
    focusPad(pad) {
      const assets = createTrackCurve(track), p = padPlacement(assets,pad), f = p.frameAt(p.d);
      orbit.target.copy(f.center).addScaledVector(f.right,p.offset);
      camera.up.copy(f.normal);
      camera.position.copy(orbit.target).addScaledVector(f.normal,14).addScaledVector(f.tangent,-18);
      orbit.update();
    },
    select(value, indexes = []) {
      selection = value;
      selectedObjects = new Set(indexes);
      syncSelection();
      syncHighlights();
    },
    focus() {
      const positions = selection.kind === 'object' && selectedObjects.size
        ? [...selectedObjects].map(i => track.objects[i]?.position).filter(Boolean).map(([x,y,z]) => new THREE.Vector3(x * track.horizontalScale,y,z * track.horizontalScale))
        : [anchor.position.clone()];
      const bounds = new THREE.Box3().setFromPoints(positions);
      const center = bounds.getCenter(new THREE.Vector3());
      const direction = camera.position.clone().sub(orbit.target).normalize();
      const distance = Math.max(track.width * 7, 60, bounds.getSize(new THREE.Vector3()).length() * 1.3);
      orbit.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, distance);
      if (flyMode) setFlyMode(false);
      orbit.update();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      transform.dispose(); orbit.dispose();
      skyRequest++;skyTexture?.dispose();
      window.removeEventListener('keydown', onFlyKeyDown);
      window.removeEventListener('keyup', onFlyKeyUp);
      window.removeEventListener('blur', stopFlyMovement);
      for (const helper of selectionHelpers.children) { helper.geometry.dispose(); helper.material.dispose(); }
      disposeTrackGroup(scene); renderer.dispose();
    },
  };
}

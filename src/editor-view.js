import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { createTrack, spawnTrackObjects, disposeTrackGroup } from './track.js';
import { hasSurface } from './track-path.js';

export function createEditorView(canvas, { onSelect, onMove, onCommit }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080f1a');
  scene.add(new THREE.HemisphereLight(0xc5edff, 0x182238, 2.4));
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
  scene.add(markers);
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
    dirty = false;
    lastBuild = performance.now();
  }

  function syncSelection() {
    markers.children.forEach((mesh, i) => { mesh.material = selection.kind === 'point' && selection.index === i ? selectedMaterial : markerMaterial; });
    const source = selection.kind === 'point' ? track.centerline[selection.index] : track.objects[selection.index]?.position;
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
    down = [event.clientX, event.clientY];
    wasDragging = Boolean(transform.axis);
  });
  canvas.addEventListener('pointerup', event => {
    if (!down || wasDragging || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const pointHit = raycaster.intersectObjects(markers.children)[0];
    const scenery = scene.getObjectByName('customTrackObjects');
    const objectHit = scenery && raycaster.intersectObjects(scenery.children)[0];
    if (pointHit) onSelect({ kind: 'point', index: markers.children.indexOf(pointHit.object) });
    else if (objectHit) onSelect({ kind: 'object', index: scenery.children.indexOf(objectHit.object) });
  });

  function setTrack(value, nextSelection = selection) {
    track = value;
    selection = nextSelection;
    while (markers.children.length < track.centerline.length) {
      const mesh = new THREE.Mesh(markerGeometry, markerMaterial);
      mesh.renderOrder = 10;
      markers.add(mesh);
    }
    while (markers.children.length > track.centerline.length) markers.remove(markers.children.at(-1));
    bounds.makeEmpty();
    track.centerline.forEach((p, i) => {
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
    if (dirty && (!transform.dragging || performance.now() - lastBuild > 120)) build();
    orbit.update();
    for (const marker of markers.children) {
      marker.scale.setScalar(camera.position.distanceTo(marker.position) * 0.006);
    }
    renderer.render(scene, camera);
  });
  return {
    setTrack, fit,
    select(value) { selection = value; syncSelection(); },
    focus() {
      const offset = camera.position.clone().sub(orbit.target).normalize().multiplyScalar(Math.max(track.width * 7, 60));
      orbit.target.copy(anchor.position);
      camera.position.copy(anchor.position).add(offset);
      orbit.update();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      transform.dispose(); orbit.dispose();
      disposeTrackGroup(scene); renderer.dispose();
    },
  };
}

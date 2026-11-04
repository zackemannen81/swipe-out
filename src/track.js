import {createVitrumDeckMaterial,createForestMaps} from './vitrum-deck.js';
import {createVitrumForestScreen} from './vitrum-forest-screen.js';
import {createVitrumLighting} from './vitrum-lighting.js';
import {createVitrumSpores} from './vitrum-spores.js';
import {addWorldAmbience} from './world-ambience.js';
import {bindScenery} from './scenery-motion.js';
import { loadGlb } from './glb-scenery.js';
import { clone as cloneModel } from 'three/addons/utils/SkeletonUtils.js';
import { automaticWeaponPads, addWeaponPads } from './weapon-pads.js';
import * as THREE from 'three';
import { addAuthoredPads, addCornerSigns } from './track-pads.js';
import { NEON_CAUSEWAY } from './track-data.js';
import { createTrackCurve, getTrackFrame, getTrackWidth, hasSurface } from './track-path.js';
import { addBranchGeometry } from './branch-geometry.js';
export { getTrackFrame } from './track-path.js';

function addInstances(group, geometry, material, transforms) {
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3(1, 1, 1);
  transforms.forEach(({ position, quaternion }, index) => {
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  group.add(mesh);
  mesh.renderOrder = 4;
}


export function createTrack(definition = NEON_CAUSEWAY) {
  const necros=/necros/i.test(definition.name??'');
  const vitrum=definition.id==='vitrum-neural-ascent';
  const curve = createTrackCurve(definition);
  const junctionClear = d => !curve.track.branches.some(b => [b.start,b.end].some(u => Math.abs(d-u*curve.getLength()) < 35));
  const group = new THREE.Group();
  // Node-based physics/tests have no document or image loader.
  const trackTexture = typeof document === 'undefined' || vitrum
    ? null : new THREE.TextureLoader().load('/images/track.png');
  if (trackTexture) {
    trackTexture.colorSpace = THREE.SRGBColorSpace;
    trackTexture.wrapS = THREE.RepeatWrapping;
    trackTexture.wrapT = THREE.ClampToEdgeWrapping;
    trackTexture.anisotropy = 8;
  }
  // Legacy source is 3:1; the supplied forest maps are square.
  // Round the count so the UV seam closes exactly where the lap closes.
  const roadTextureRepeats = Math.max(
    1, Math.round(curve.getLength() / (Math.max(1, getTrackWidth(curve, 0)) * (vitrum ? 1 : 3)))
  );

  const roadMaterial = vitrum ? createVitrumDeckMaterial(roadTextureRepeats) : new THREE.MeshStandardMaterial({
    map: trackTexture,
    color: 0xffffff, metalness: 0.88, roughness: 0.78,
    emissive: curve.track.magnetic ? 0x0b2138 : 0x06121c,
    emissiveIntensity: curve.track.magnetic ? 0.65 : 0.1,
    // An opaque, gently emissive magnetic deck stays legible on the dark side
    // of loops and prevents background/other road sections showing through it.
    transparent: !curve.track.magnetic, opacity: curve.track.magnetic ? 1 : 0.85,
    depthWrite: curve.track.magnetic, side: curve.track.magnetic ? THREE.DoubleSide : THREE.FrontSide,
  });
  const cyanMaterial = new THREE.MeshStandardMaterial({
    color: (necros ? 0xa80010 : 0x58f4e8), emissive: (necros ? 0xa80010 : 0x23dace), emissiveIntensity: necros ? 12 : 6.1,
    metalness: 0.25, roughness: 0.32,
  });
  const pinkMaterial = new THREE.MeshStandardMaterial({
    color: (necros ? 0xa80010 : 0xff4b91), emissive: (necros ? 0xa80010 : 0xd51e63), emissiveIntensity: necros ? 12 : 7.5,
    metalness: 0.2, roughness: 0.36,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x101827, metalness: 0.0, roughness: 0.38 });
  const transparentDarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x101827, metalness: 0.0, roughness: 0.38,
    transparent: true, opacity: 0.85, depthWrite: false,
  });

  function ribbon(offset, width, material, yOffset = 0.025, samples = 600) {
    const positions = [];
    const uvs = [];
    const indices = [];
    const weathered=vitrum && material===roadMaterial,columns=weathered?8:1,colors=[];
    const stops = [...new Set([...Array.from({ length: samples + 1 }, (_, i) => i / samples),
      ...curve.track.gaps.flatMap(gap => [gap.start, gap.end])])].sort((a, b) => a - b);
    const previousRight = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i < stops.length; i += 1) {
      const u = stops[i];
      const frame = getTrackFrame(curve, u);
      const right = frame.right;
      if (right.lengthSq() > 0.5) previousRight.copy(right);
      else right.copy(previousRight);
      const center = frame.center.addScaledVector(right, typeof offset === 'function' ? offset(u) : offset).addScaledVector(frame.normal, yOffset);
      const localWidth = typeof width === 'function' ? width(u) : width;
      // UV x follows track distance; UV y spans the road from edge to edge.
      // Only the road material samples the texture; other ribbons ignore UVs.
      const uvAlong = u * roadTextureRepeats;
      for(let column=0;column<=columns;column++){
        const across=column/columns;
        positions.push(...center.clone().addScaledVector(right,(across-.5)*localWidth).toArray());
        uvs.push(uvAlong,across);
        if(weathered){
          const edge=Math.abs(across*2-1)**4;
          const stain=(.5+.5*Math.sin(u*Math.PI*114+across*4)*Math.sin(u*Math.PI*42))*edge;
          const value=.94-edge*.28-stain*.16;
          colors.push(value*(.96+edge*.04),value,value*(1-edge*.28));
        }
      }
      if (i < stops.length - 1 && hasSurface(curve, (u + stops[i + 1]) * 0.5 * curve.getLength())) {
        for(let column=0;column<columns;column++){
          const a = i*(columns+1)+column,b=a+columns+1;
          indices.push(a,b,a+1,a+1,b,b+1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    if(weathered)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    if (weathered) {
      // Keep Vitrum's plasma/energy moving without uploading textures every frame.
      mesh.onBeforeRender = () => material.userData.vitrumRoad?.update(performance.now() * 0.001);
    }
    group.add(mesh);
  }

  const trackWidth = getTrackWidth(curve, 0);
  const widthAt = u => getTrackWidth(curve,u);
  ribbon(0, widthAt, roadMaterial, 0, 900);
  if(vitrum){
    const edgeMaterial=new THREE.MeshStandardMaterial({color:0xffbd55,emissive:0xffa326,emissiveIntensity:1.7,roughness:.5,side:THREE.DoubleSide});
    for(const side of [-1,1])ribbon(u=>side*(widthAt(u)/2-.46),.32,edgeMaterial,.035,900);
  }else{
    ribbon(u => -(widthAt(u)/2-0.18), 0.19, pinkMaterial, 0.075);
    ribbon(u => widthAt(u)/2-0.18, 0.19, cyanMaterial, 0.075);
  }
  //ribbon(-trackWidth / 2 - 0.15, 0.1, transparentDarkMaterial, 0.14);
  //ribbon(trackWidth / 2 + 0.15, 0.1, transparentDarkMaterial, 0.14);

  // Floating neon guardrails make the road edge readable at race speed.
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x101827, metalness: 0.7, roughness: 0.38,
  });
  const pinkRailMaterial = new THREE.MeshStandardMaterial({
    color: (necros ? 0xa80010 : 0xff4b91), emissive: (necros ? 0xa80010 : 0xff2678), emissiveIntensity: necros ? 12 : 7.5,
    metalness: 0.05, roughness: 0.3,
  });
  const cyanRailMaterial = new THREE.MeshStandardMaterial({
    color: (necros ? 0xa80010 : 0x58f4e8), emissive: (necros ? 0xa80010 : 0x23dace), emissiveIntensity: necros ? 12 : 8.5,
    metalness: 0.05, roughness: 0.3,
  });
  if(vitrum){
    for(const m of [pinkMaterial,pinkRailMaterial]){m.color.setHex(0xe6bd67);m.emissive.setHex(0xd69424);m.emissiveIntensity=2.0;}
    for(const m of [cyanMaterial,cyanRailMaterial]){m.color.setHex(0x89dcc2);m.emissive.setHex(0x36a98e);m.emissiveIntensity=1.7;}
    railMaterial.color.setHex(0x67754b);
  }
  group.userData.railMaterials=[cyanMaterial,pinkMaterial,pinkRailMaterial,cyanRailMaterial];
  const railGeometry = new THREE.CylinderGeometry(0.07, 0.07, 8.5, 8);
  const railTransforms = [];
  for (let distance = 4.25; distance < curve.getLength(); distance += 34) {
    if (!junctionClear(distance)) continue;
    if (!hasSurface(curve, distance, 5)) continue;
    const frame = getTrackFrame(curve, distance / curve.getLength());
    const trackWidth = widthAt(distance / curve.getLength());
    for (const side of [-1, 1]) {
      const position = frame.center.clone()
        .addScaledVector(frame.right, side * (trackWidth / 2 + 1.15))
        .addScaledVector(frame.normal, 1.18);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        frame.tangent,
      );
      railTransforms.push({ position, quaternion });
    }
  }
  addInstances(group, railGeometry, railMaterial, railTransforms);
  const railLightGeometry = new THREE.CylinderGeometry(0.045, 0.045, 8.5, 6);
  const pinkRailTransforms = [];
  const cyanRailTransforms = [];
  for (let distance = 4.25; distance < curve.getLength(); distance += 8.5) {
    if (!junctionClear(distance)) continue;
    if (!hasSurface(curve, distance, 5)) continue;
    const frame = getTrackFrame(curve, distance / curve.getLength());
    const trackWidth = widthAt(distance / curve.getLength());
    for (const side of [-1, 1]) {
      const position = frame.center.clone()
        .addScaledVector(frame.right, side * (trackWidth / 2 + 1.15))
        .addScaledVector(frame.normal, 1.18);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        frame.tangent,
      );
      (side < 0 ? pinkRailTransforms : cyanRailTransforms).push({ position, quaternion });
    }
  }
  addInstances(group, railLightGeometry, pinkRailMaterial, pinkRailTransforms);
  addInstances(group, railLightGeometry, cyanRailMaterial, cyanRailTransforms);

  // Directional chevrons sit just above the road and point into the flow of the course.
  const arrowGeometry = new THREE.BoxGeometry(0.5, 0.06, 0.86);
  const pinkArrowTransforms = [];
  const cyanArrowTransforms = [];
  for (let distance = 10; distance < curve.getLength(); distance += 22) {
    if (!hasSurface(curve, distance, 1)) continue;
    const frame = getTrackFrame(curve, distance / curve.getLength());
    const trackWidth = widthAt(distance / curve.getLength());
    const side = Math.floor(distance / 22) % 2 === 0 ? -1 : 1;
    const basePosition = frame.center.clone()
      .addScaledVector(frame.right, side * (trackWidth / 2 - 0.85))
      .addScaledVector(frame.normal, 0.12);
    for (const angle of [-0.62, 0.62]) {
      const position = basePosition.clone().addScaledVector(frame.right, angle * 0.48);
      const quaternion = frame.rotation.clone();
      quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle));
      (side < 0 ? pinkArrowTransforms : cyanArrowTransforms).push({ position, quaternion });
    }
  }
  addInstances(group, arrowGeometry, pinkMaterial, pinkArrowTransforms);
  addInstances(group, arrowGeometry, cyanMaterial, cyanArrowTransforms);
// NYTT MATERIAL FÖR BOOST
  const greenMaterial = new THREE.MeshStandardMaterial({
    color: 0x58f442, emissive: 0x23da32, emissiveIntensity: 9.0,
    metalness: 0.2, roughness: 0.32,
  });
  
  // LOGIK FÖR BOOST-PILARNA
  const greenArrowTransforms = [];
  const boostPadPlacements = []; // Vi sparar positionerna för fysiken

  for (let distance = 50; definition.pads === undefined && distance < curve.getLength(); distance += 150) {
    if (!hasSurface(curve, distance, 6)) continue;
    const frame = getTrackFrame(curve, distance / curve.getLength());
    const trackWidth = widthAt(distance / curve.getLength());
    
    // Växla position: 0 = mitten, 1 = vänster, 2 = höger
    const posType = Math.floor(distance / 150) % 3;
    let offset = 0;
    if (posType === 1) offset = -(trackWidth / 2 - 2.5); // Vänster
    if (posType === 2) offset = (trackWidth / 2 - 2.5);  // Höger
    
    boostPadPlacements.push({ d: distance, offset: offset });

    // Skapa 3 pilar med kort mellanrum (bakåt längs tangenten)
    const basePos = frame.center.clone()
      .addScaledVector(frame.right, offset)
      .addScaledVector(frame.normal, 0.12);

    for (let i = 0; i < 3; i++) {
      const chevronPos = basePos.clone().addScaledVector(frame.tangent, i * -2.0);
      for (const angle of [-0.62, 0.62]) {
        const position = chevronPos.clone().addScaledVector(frame.right, angle * 0.48);
        const quaternion = frame.rotation.clone();
        quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle));
        greenArrowTransforms.push({ position, quaternion });
      }
    }
  }
  addInstances(group, arrowGeometry, greenMaterial, greenArrowTransforms);


  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0x182234 , transparent: true, opacity: 0.5, depthWrite: false });
  const dash = new THREE.BoxGeometry(definition.roadStyle === 'raceway' ? 0.18 : 3.565, 0.045, 5.05,2);
  const markerTransforms = [];
  for (let distance = 4.5; distance < curve.getLength(); distance += 9) {
    if (!hasSurface(curve, distance, 3)) continue;
    const frame = getTrackFrame(curve, distance / curve.getLength());
    markerTransforms.push({
      position: frame.center.addScaledVector(frame.normal, 0.045),
      quaternion: frame.rotation,
    });
  }
  addInstances(group, dash, laneMaterial, markerTransforms);

  const railPost = new THREE.BoxGeometry(0.22, 1.05, 0.22);
  const beaconGeometry = new THREE.SphereGeometry(0.13, 10, 8);
  const postTransforms = [];
  const pinkBeaconTransforms = [];
  const cyanBeaconTransforms = [];
  for (let distance = 5.5; distance < curve.getLength(); distance += 11) {
    if (!junctionClear(distance)) continue;
    if (!hasSurface(curve, distance, 1)) continue;
    const frame = getTrackFrame(curve, distance / curve.getLength());
    const trackWidth = widthAt(distance / curve.getLength());
    for (const side of [-1, 1]) {
      const base = frame.center.clone()
        .addScaledVector(frame.right, side * (trackWidth / 2 + 1.15));
      const postPosition = base.clone().addScaledVector(frame.normal, 0.525);
      postTransforms.push({ position: postPosition, quaternion: curve.track.magnetic ? frame.rotation : new THREE.Quaternion() });
      const beaconPosition = base.clone().addScaledVector(frame.normal, 1.16);
      (side < 0 ? pinkBeaconTransforms : cyanBeaconTransforms).push({
        position: beaconPosition,
        quaternion: new THREE.Quaternion(),
      });
    }
  }
  addInstances(group, railPost, darkMaterial, postTransforms);
  addInstances(group, beaconGeometry, pinkMaterial, pinkBeaconTransforms);
  addInstances(group, beaconGeometry, cyanMaterial, cyanBeaconTransforms);

  const startFrame = getTrackFrame(curve, 0);
  const gateWidth = trackWidth - 0.9;
  const gate = new THREE.Group();
  gate.position.copy(startFrame.center);
  gate.quaternion.copy(startFrame.rotation);
  const gatePostGeometry = new THREE.BoxGeometry(0.34, 2.8, 0.38);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(gatePostGeometry, side < 0 ? pinkMaterial : cyanMaterial);
    post.position.set(side * (trackWidth / 2 - 0.55), 1.4, 0);
    gate.add(post);
  }
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(gateWidth, 0.28, 0.38), darkMaterial);
  crossbar.position.set(0, 2.72, 0);
  gate.add(crossbar);
  const gateLight = new THREE.Mesh(new THREE.BoxGeometry(gateWidth - 0.4, 0.09, 0.44), cyanMaterial);
  gateLight.position.set(0, 2.72, 0);
  gate.add(gateLight);
  const tileWidth = gateWidth / 16;
  for (let i = 0; i < 16; i += 1) {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(tileWidth, 0.035, 0.72),
      i % 2 === 0 ? cyanMaterial : darkMaterial,
    );
    tile.position.set(-gateWidth / 2 + tileWidth * (i + 0.5), 0.055, 0);
    gate.add(tile);
  }
  group.add(gate);

  for (const gap of curve.track.gaps) {
    for (const [progress, color, direction] of [[gap.start, 0xffb344, -1], [gap.end, 0x42ffbc, 1]]) {
      const trackWidth = widthAt(progress);
      const frame = getTrackFrame(curve, progress + direction * 0.8 / curve.getLength());
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3 });
      const lip = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.12, 0.7), material);
      lip.position.copy(frame.center).addScaledVector(frame.normal, 0.09);
      lip.quaternion.copy(frame.rotation);
      lip.userData.gapMarker = true;
      group.add(lip);
      for (const side of [-1, 1]) {
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), material);
        beacon.position.copy(frame.center).addScaledVector(frame.right, side * trackWidth / 2).addScaledVector(frame.normal, 2);
        beacon.quaternion.copy(frame.rotation);
        group.add(beacon);
      }
    }
  }


  
  addBranchGeometry(group, curve, boostPadPlacements, definition.pads === undefined);
  if (definition.pads) addAuthoredPads(group, curve, definition.pads.filter(p=>p.type!=='weapon'), boostPadPlacements);
  if (definition.roadStyle === 'raceway' || necros) addCornerSigns(group, curve);
  if (definition.pads) boostPadPlacements.sort((a,b)=>a.d-b.d);
  const authoredWeapons=definition.pads?.filter(p=>p.type==='weapon')??[];
  const weaponPads=addWeaponPads(group,curve,authoredWeapons.length?authoredWeapons:automaticWeaponPads(curve,boostPadPlacements));
  addWorldAmbience(group,curve);
  if(vitrum)group.add(createVitrumForestScreen(curve));
  if(vitrum)group.add(createVitrumLighting(curve));
  if(vitrum)group.add(createVitrumSpores(curve));
return { group, curve, length: curve.getLength(), boostPads: boostPadPlacements, weaponPads };
}



const textureLoader = new THREE.TextureLoader();
export function disposeTrackGroup(group) {
  group.userData.disposed = true;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  group.traverse(object => {
    if(object.userData.mixer){object.userData.mixer.stopAllAction();object.userData.mixer.uncacheRoot(object.userData.mixer.getRoot());delete object.userData.mixer;}
    if (object.geometry) geometries.add(object.geometry);
    for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
    // InstancedMesh also owns GPU instance buffers independent of its geometry.
    if (object.isInstancedMesh) object.dispose();
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => {
    const controller = material.userData?.vitrumRoad;
    if (controller) {
      controller.dispose(); // Includes the three generated DataTextures.
      delete material.userData.vitrumRoad;
    } else material.dispose();
  });
  geometries.forEach(geometry => geometry.dispose());
}
// Läs av opacity och säkra variabeln
//const objectOpacity = typeof obj.opacity === 'number' ? obj.opacity : parseFloat(String(obj.opacity || 1).replace(',', '.')) || 1.0;
//const isTransparent = objectOpacity < 0.99;
/*export function spawnTrackObjects(scene, trackData) {
  const existingGroup = scene.getObjectByName('customTrackObjects');
  if (existingGroup) { scene.remove(existingGroup); disposeTrackGroup(existingGroup); }

  if (!trackData || !Array.isArray(trackData.objects)) return;

  const objectGroup = new THREE.Group();
  objectGroup.name = 'customTrackObjects';

  const hScale = trackData.horizontalScale ?? 1;

  trackData.objects.forEach((obj) => { // <-- Säkerställt att variabeln heter obj här
    let geometry;
if (obj.type === 'cylinder') {
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    } else if (obj.type === 'sphere') {
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
    } else if (obj.type === 'cone') {
      // En cylinder med radie 0 i toppen blir en kon i Three.js
      geometry = new THREE.CylinderGeometry(0, 0.5, 1, 32); 
    } else {
      geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const rawOpacity = typeof obj.opacity === 'string' ? obj.opacity.replace(',', '.') : obj.opacity;
    const parsedOpacity = parseFloat(rawOpacity);
    const opacity = !isNaN(parsedOpacity) ? parsedOpacity : 1.0;

    let material;
    if (obj.texture) {
      const tex = textureLoader.load(obj.texture);
      tex.colorSpace = THREE.SRGBColorSpace;
      material = new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.2,
        transparent: opacity < 1,
        opacity: opacity,
        depthWrite: opacity >= 1,
        roughness: 0.3,
        metalness: 0.7
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: obj.type === 'cylinder' ? 0xffd166 : obj.type === 'sphere' ? 0xb58cff : 0xff7aa8,
        transparent: opacity < 1,
        opacity: opacity,
        depthWrite: opacity >= 1,
        roughness: 0.2,
        metalness: 0.8
      });
    }

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      obj.position[0] * hScale,
      obj.position[1],
      obj.position[2] * hScale
    );

    if (obj.rotation) {
      mesh.rotation.set(
        (obj.rotation[0] * Math.PI) / 180,
        (obj.rotation[1] * Math.PI) / 180,
        (obj.rotation[2] * Math.PI) / 180
      );
    }

    if (obj.scale) {
      mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
    }

    mesh.userData = { animType: obj.animType || 'none' };
    bindScenery(mesh,obj);
    objectGroup.add(mesh);
  });

  scene.add(objectGroup);
}*/
export function spawnTrackObjects(scene, trackData) {
  const existingGroup = scene.getObjectByName('customTrackObjects');
  const contentKey=JSON.stringify((trackData?.objects??[]).map(({position,rotation,scale,...content})=>content));
  const setTransform=(holder,obj)=>{
    const h=trackData.horizontalScale??1;
    holder.position.set(obj.position[0]*h,obj.position[1],obj.position[2]*h);
    holder.rotation.set(...(obj.rotation??[0,0,0]).map(THREE.MathUtils.degToRad));
    holder.scale.set(...(obj.scale??[1,1,1]));holder.userData.baseScale=[...(obj.scale??[1,1,1])];bindScenery(holder,obj);
  };
  // Keep loaded models/materials alive while dragging or changing transforms.
  if(existingGroup?.userData.contentKey===contentKey){
    (trackData?.objects??[]).forEach((obj,i)=>setTransform(existingGroup.children[i],obj));return;
  }
  if (existingGroup) { scene.remove(existingGroup); disposeTrackGroup(existingGroup); }

  if (!trackData || !Array.isArray(trackData.objects)) return;

  const objectGroup = new THREE.Group();
  objectGroup.name = 'customTrackObjects';
  objectGroup.userData.contentKey=contentKey;

  const modelLoads = new Map();
  objectGroup.userData.loadErrors = [];
  const hScale = trackData.horizontalScale ?? 1;

  // Ownership stays inside this group so editor rebuilds / track changes can
  // dispose everything once. Static duplicates share GPU resources. Scrolling
  // maps stay independent because each object's animation mutates its offset.
  const geometries = new Map(), textures = new Map(), materials = new Map();

  trackData.objects.forEach((obj) => {
    if(obj.type==='light'){
      const holder=new THREE.Group();setTransform(holder,obj);
      const light=new THREE.PointLight(obj.color??0xb60012,obj.lightIntensity??100,obj.lightRange??50,2);
      const marker=new THREE.Mesh(new THREE.SphereGeometry(.35,12,8),new THREE.MeshBasicMaterial({color:obj.color??0xb60012}));
      holder.add(light,marker);holder.userData.light=light;holder.userData.marker=marker;
      marker.visible=false;objectGroup.add(holder);return;
    }
    if (obj.type === 'glb') {
      const holder = new THREE.Group();
      holder.position.set(obj.position[0]*hScale,obj.position[1],obj.position[2]*hScale);
      holder.rotation.set(...obj.rotation.map(THREE.MathUtils.degToRad));
      holder.scale.set(...obj.scale);holder.userData.baseScale=[...obj.scale];
      setTransform(holder,obj);
      objectGroup.add(holder);
      if(!modelLoads.has(obj.model))modelLoads.set(obj.model,loadGlb(obj.model).then(model=>{
        if(objectGroup.userData.disposed){disposeTrackGroup(model);return null;}
        if(obj.model.startsWith('/models/stage2/organic/'))model.traverse(child=>{
          for(const material of (Array.isArray(child.material)?child.material:[child.material])){
            if(!material)continue;
            for(const value of Object.values(material))if(value?.isTexture)value.anisotropy=8;
          }
        });
        return model;
      }));
      modelLoads.get(obj.model).then(model=>{
        if(!model || objectGroup.userData.disposed)return;
        const instance=cloneModel(model);holder.add(instance);holder.userData.loaded=true;
        if(obj.playClip && model.animations.length){
          const mixer=new THREE.AnimationMixer(instance);
          // Unnamed GLTF nodes use UUID bindings; clones receive new UUIDs.
          const originals=[],copies=[];model.traverse(n=>originals.push(n));instance.traverse(n=>copies.push(n));
          const clip=model.animations[0].clone();
          for(const track of clip.tracks){
            const node=THREE.PropertyBinding.parseTrackName(track.name).nodeName;
            const index=originals.findIndex(n=>n.uuid===node);
            if(index>=0)track.name=track.name.replace(node,copies[index].uuid);
          }
          mixer.clipAction(clip).play();holder.userData.mixer=mixer;
        }
      }).catch(error=>{
        if(objectGroup.userData.disposed)return;
        holder.userData.error=error.message;objectGroup.userData.loadErrors.push(error.message);
        console.warn('Scenery GLB:', error.message);
      });
      return;
    }
    let geometry = geometries.get(obj.type);
    if (!geometry && obj.type === 'cylinder') {
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    } else if (!geometry && obj.type === 'sphere') {
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
    } else if (!geometry && obj.type === 'cone') {
      // En cylinder med radie 0 i toppen blir en kon i Three.js
      geometry = new THREE.CylinderGeometry(0, 0.5, 1, 32); 
    } else if (!geometry) {
      geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    geometries.set(obj.type, geometry);

    const rawOpacity = typeof obj.opacity === 'string' ? obj.opacity.replace(',', '.') : obj.opacity;
    const parsedOpacity = parseFloat(rawOpacity);
    const opacity = !isNaN(parsedOpacity) ? parsedOpacity : 1.0;

    const scrolling = obj.animType === 'scroll-x' || obj.animType === 'scroll-y';
    const textureAlpha = obj.textureAlpha ?? 'cutout';
    const materialKey = JSON.stringify([obj.texture || null, obj.type, obj.color, obj.emissive, opacity, textureAlpha]);
    let material = scrolling ? null : materials.get(materialKey);
    if (!material && obj.texture) {
      let tex = scrolling ? null : textures.get(obj.texture);
      if (!tex) {
        tex = textureLoader.load(obj.texture);
        if (!scrolling) textures.set(obj.texture, tex);
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      
      // Static cutouts must not sample the opposite edge. Scrolling still tiles.
      tex.wrapS = tex.wrapT = scrolling ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;

      material = new THREE.MeshStandardMaterial({
        color: obj.color ?? 0xffffff,
        map: tex,
        emissiveMap: tex,
        emissive: obj.emissive ?? 0xffffff,
        emissiveIntensity: obj.emissive !== undefined ? 4.0 : 0.2,
        // Image alpha is independent of whole-object opacity. Cutouts keep
        // correct depth between overlapping foliage; blend preserves soft alpha.
        alphaTest: textureAlpha === 'blend' ? 0.001 : 0.1 * opacity,
        transparent: textureAlpha === 'blend' || opacity < 1,
        opacity: opacity,
        depthWrite: textureAlpha !== 'blend' && opacity >= 1,
        roughness: 0.3,
        metalness: 0.7
      });
    } else if (!material) {
      // TILLÄGG 2: Tillåter egna färger och neonglöd från JSON-filen (bra för Abyssal Circuit)
      const colorHex = obj.color !== undefined ? obj.color : 
        (obj.type === 'cylinder' ? 0xffd166 : obj.type === 'sphere' ? 0xb58cff : 0xff7aa8);
      const isNeon = obj.emissive !== undefined && new THREE.Color(obj.emissive).getHex() !== 0;

      material = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: isNeon ? obj.emissive : 0x000000,
        emissiveIntensity: isNeon ? 4.0 : 0,
        transparent: opacity < 1,
        opacity: opacity,
        depthWrite: opacity >= 1,
        roughness: isNeon ? 0.1 : 0.2,
        metalness: isNeon ? 0.1 : 0.8
      });
    }

    if(trackData.id==='vitrum-neural-ascent'){
      material.metalness=0.08;material.roughness=0.85;
      if(obj.id==='vitrum-0' && obj.type==='sphere' && !obj.texture){
        Object.assign(material,createForestMaps('moss',[120,60]));
        material.color.setHex(0x8e9c7d);material.normalScale.set(.3,.3);
      }
    }
    if (!scrolling) materials.set(materialKey, material);

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      obj.position[0] * hScale,
      obj.position[1],
      obj.position[2] * hScale
    );

    if (obj.rotation) {
      mesh.rotation.set(
        (obj.rotation[0] * Math.PI) / 180,
        (obj.rotation[1] * Math.PI) / 180,
        (obj.rotation[2] * Math.PI) / 180
      );
    }

    if (obj.scale) {
      mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
    }

    // TILLÄGG 3: Spara baseScale så 'pulse' kan räkna ut rätt storlek i render-loopen
    mesh.userData = { 
      animType: obj.animType || 'none',
      baseScale: obj.scale ? [...obj.scale] : [1, 1, 1]
    };
    
    bindScenery(mesh,obj);
    objectGroup.add(mesh);
  });

  scene.add(objectGroup);
}

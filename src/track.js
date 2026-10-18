import * as THREE from 'three';
import { NEON_CAUSEWAY } from './track-data.js';

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
  const points = definition.centerline.map(([x, y, z]) =>
    new THREE.Vector3(x * (definition.horizontalScale ?? 1), y, z * (definition.horizontalScale ?? 1)));
  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.42);
  curve.arcLengthDivisions = 1800;
  const group = new THREE.Group();
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x182234, metalness: 0.35, roughness: 0.48,
    emissive: 0x06121c, emissiveIntensity: 0.8,
    transparent: true, opacity: 0.75, depthWrite: false,
  });
  const cyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x58f4e8, emissive: 0x23dace, emissiveIntensity: 7.1,
    metalness: 0.25, roughness: 0.32,
  });
  const pinkMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4b91, emissive: 0xd51e63, emissiveIntensity: 9.5,
    metalness: 0.2, roughness: 0.36,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x101827, metalness: 0.7, roughness: 0.38 });
  const transparentDarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x101827, metalness: 0.7, roughness: 0.38,
    transparent: true, opacity: 0.85, depthWrite: false,
  });

  function ribbon(offset, width, material, yOffset = 0.025, samples = 600) {
    const positions = [];
    const indices = [];
    const previousRight = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i <= samples; i += 1) {
      const u = i / samples;
      const frame = getTrackFrame(curve, u);
      const right = frame.right;
      if (right.lengthSq() > 0.5) previousRight.copy(right);
      else right.copy(previousRight);
      const center = frame.center.addScaledVector(right, offset).addScaledVector(frame.normal, yOffset);
      const leftPoint = center.clone().addScaledVector(right, -width / 2);
      const rightPoint = center.clone().addScaledVector(right, width / 2);
      positions.push(
        leftPoint.x, leftPoint.y, leftPoint.z,
        rightPoint.x, rightPoint.y, rightPoint.z,
      );
      if (i < samples) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry, material));
  }

  const trackWidth = definition.width;
  const edgeOffset = trackWidth / 2 - 0.18;
  ribbon(0, trackWidth, roadMaterial, 0, 900);
  ribbon(-edgeOffset, 0.19, pinkMaterial, 0.075);
  ribbon(edgeOffset, 0.19, cyanMaterial, 0.075);
  ribbon(-trackWidth / 2 - 0.15, 0.1, transparentDarkMaterial, 0.14);
  ribbon(trackWidth / 2 + 0.15, 0.1, transparentDarkMaterial, 0.14);

  // Floating neon guardrails make the road edge readable at race speed.
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x101827, metalness: 0.7, roughness: 0.38,
  });
  const pinkRailMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4b91, emissive: 0xff2678, emissiveIntensity: 8.5,
    metalness: 0.05, roughness: 0.3,
  });
  const cyanRailMaterial = new THREE.MeshStandardMaterial({
    color: 0x58f4e8, emissive: 0x23dace, emissiveIntensity: 8.5,
    metalness: 0.05, roughness: 0.3,
  });
  const railGeometry = new THREE.CylinderGeometry(0.07, 0.07, 8.5, 8);
  const railTransforms = [];
  for (let distance = 4.25; distance < curve.getLength(); distance += 8.5) {
    const frame = getTrackFrame(curve, distance / curve.getLength());
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
  for (let distance = 4.25; distance < curve.getLength(); distance += 17) {
    const frame = getTrackFrame(curve, distance / curve.getLength());
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
    const frame = getTrackFrame(curve, distance / curve.getLength());
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

  for (let distance = 50; distance < curve.getLength(); distance += 150) {
    const frame = getTrackFrame(curve, distance / curve.getLength());
    
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


  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0x182234 });
  const dash = new THREE.BoxGeometry(3.565, 0.045, 5.05,2);
  const markerTransforms = [];
  for (let distance = 4.5; distance < curve.getLength(); distance += 9) {
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
    const frame = getTrackFrame(curve, distance / curve.getLength());
    for (const side of [-1, 1]) {
      const base = frame.center.clone()
        .addScaledVector(frame.right, side * (trackWidth / 2 + 1.15));
      const postPosition = base.clone().addScaledVector(frame.normal, 0.525);
      postTransforms.push({ position: postPosition, quaternion: new THREE.Quaternion() });
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


  
return { group, curve, length: curve.getLength(), boostPads: boostPadPlacements };
}


export function getTrackFrame(curve, progress) {
  const u = ((progress % 1) + 1) % 1;
  const center = curve.getPointAt(u);
  const tangent = curve.getTangentAt(u).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  else right.normalize();
  const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();
  const rotation = new THREE.Matrix4().makeBasis(right, normal, tangent);
  return {
    center,
    tangent,
    right,
    normal,
    rotation: new THREE.Quaternion().setFromRotationMatrix(rotation),
    yaw: Math.atan2(tangent.x, tangent.z),
  };
}
const textureLoader = new THREE.TextureLoader();
// Läs av opacity och säkra variabeln
//const objectOpacity = typeof obj.opacity === 'number' ? obj.opacity : parseFloat(String(obj.opacity || 1).replace(',', '.')) || 1.0;
//const isTransparent = objectOpacity < 0.99;
export function spawnTrackObjects(scene, trackData) {
  const existingGroup = scene.getObjectByName('customTrackObjects');
  if (existingGroup) scene.remove(existingGroup);

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
    objectGroup.add(mesh);
  });

  scene.add(objectGroup);
}
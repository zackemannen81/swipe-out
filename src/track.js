import * as THREE from 'three';

const TRACK_POINTS = [
  [0, 0, 48], [17, 0, 46], [31, 0, 35], [37, 0, 17],
  [32, 0, 1], [19, 0, -9], [17, 0, -25], [28, 0, -41],
  [20, 0, -53], [0, 0, -51], [-20, 0, -47], [-34, 0, -33],
  [-38, 0, -14], [-27, 0, 2], [-29, 0, 20], [-18, 0, 39],
];

export function createTrack() {
  const points = TRACK_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.42);
  curve.arcLengthDivisions = 1800;
  const group = new THREE.Group();
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x182234, metalness: 0.55, roughness: 0.48,
    emissive: 0x06121c, emissiveIntensity: 0.7,
  });
  const cyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x58f4e8, emissive: 0x23dace, emissiveIntensity: 2.1,
    metalness: 0.25, roughness: 0.32,
  });
  const pinkMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4b91, emissive: 0xd51e63, emissiveIntensity: 1.5,
    metalness: 0.2, roughness: 0.36,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x101827, metalness: 0.7, roughness: 0.38 });

  function ribbon(offset, width, material, yOffset = 0.025, samples = 600) {
    const positions = [];
    const indices = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= samples; i += 1) {
      const u = i / samples;
      const center = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
      center.addScaledVector(right, offset);
      positions.push(
        center.x - right.x * width / 2, center.y + yOffset, center.z - right.z * width / 2,
        center.x + right.x * width / 2, center.y + yOffset, center.z + right.z * width / 2,
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

  ribbon(0, 10, roadMaterial, 0, 900);
  ribbon(-4.82, 0.19, pinkMaterial, 0.075);
  ribbon(4.82, 0.19, cyanMaterial, 0.075);
  ribbon(-5.15, 0.1, darkMaterial, 0.14);
  ribbon(5.15, 0.1, darkMaterial, 0.14);

  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0x6f899f, transparent: true, opacity: 0.46 });
  const dash = new THREE.BoxGeometry(0.065, 0.035, 1.05);
  for (let u = 0.012; u < 1; u += 0.032) {
    const center = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const marker = new THREE.Mesh(dash, laneMaterial);
    marker.position.set(center.x, 0.045, center.z);
    marker.rotation.y = Math.atan2(tangent.x, tangent.z);
    group.add(marker);
  }

  const railPost = new THREE.BoxGeometry(0.22, 1.05, 0.22);
  const beaconGeometry = new THREE.SphereGeometry(0.13, 10, 8);
  for (let u = 0.018; u < 1; u += 0.035) {
    const center = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
    for (const side of [-1, 1]) {
      const position = center.clone().addScaledVector(right, side * 6.15);
      const post = new THREE.Mesh(railPost, darkMaterial);
      post.position.set(position.x, 0.55, position.z);
      group.add(post);
      const beacon = new THREE.Mesh(beaconGeometry, side < 0 ? pinkMaterial : cyanMaterial);
      beacon.position.set(position.x, 1.16, position.z);
      group.add(beacon);
    }
  }

  const startFrame = getTrackFrame(curve, 0);
  const gate = new THREE.Group();
  gate.position.copy(startFrame.center);
  gate.rotation.y = startFrame.yaw;
  const gatePostGeometry = new THREE.BoxGeometry(0.34, 2.8, 0.38);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(gatePostGeometry, side < 0 ? pinkMaterial : cyanMaterial);
    post.position.set(side * 4.45, 1.4, 0);
    gate.add(post);
  }
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.28, 0.38), darkMaterial);
  crossbar.position.set(0, 2.72, 0);
  gate.add(crossbar);
  const gateLight = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.09, 0.44), cyanMaterial);
  gateLight.position.set(0, 2.72, 0);
  gate.add(gateLight);
  for (let i = 0; i < 16; i += 1) {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(0.625, 0.035, 0.72),
      i % 2 === 0 ? cyanMaterial : darkMaterial,
    );
    tile.position.set(-4.6875 + i * 0.625, 0.055, 0);
    gate.add(tile);
  }
  group.add(gate);

  return { group, curve, length: curve.getLength() };
}

export function getTrackFrame(curve, progress) {
  const u = ((progress % 1) + 1) % 1;
  const center = curve.getPointAt(u);
  const tangent = curve.getTangentAt(u).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
  return { center, tangent, right, yaw: Math.atan2(tangent.x, tangent.z) };
}

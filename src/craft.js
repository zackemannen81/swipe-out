import * as THREE from 'three';

export function createCraft({
  hullColor = 0xc1d0e7,
  canopyColor = 0x123f55,
  wingColor = 0x293a55,
  accentColor = 0x5cf5ec,
  secondaryAccentColor = 0xff4388,
  engineColor = 0x75fff4,
  glowColor = 0x43f6ea,
  showGlow = true,
} = {}) {
  const craft = new THREE.Group();
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: hullColor, metalness: 0.76, roughness: 0.25,
    emissive: 0x102b3a, emissiveIntensity: 0.65,
  });
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.72, 2.35, 6), hullMaterial);
  hull.rotation.x = Math.PI / 2;
  hull.scale.set(1, 1, 0.72);
  craft.add(hull);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 20, 14),
    new THREE.MeshPhysicalMaterial({
      color: canopyColor, metalness: 0.42, roughness: 0.13,
      clearcoat: 1, emissive: canopyColor, emissiveIntensity: 0.28,
    }),
  );
  canopy.scale.set(0.72, 0.39, 1.12);
  canopy.position.set(0, 0.35, 0.02);
  craft.add(canopy);

  const wingMaterial = new THREE.MeshStandardMaterial({ color: wingColor, metalness: 0.72, roughness: 0.3 });
  const engineMaterials = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.12, 0.62), wingMaterial);
    wing.position.set(side * 0.76, -0.04, -0.04);
    wing.rotation.y = side * -0.1;
    craft.add(wing);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 0.04, 0.07),
      new THREE.MeshBasicMaterial({ color: side < 0 ? secondaryAccentColor : accentColor }),
    );
    stripe.position.set(side * 0.84, 0.035, 0.29);
    stripe.rotation.y = side * -0.1;
    craft.add(stripe);

    const engineMaterial = new THREE.MeshBasicMaterial({ color: engineColor });
    const engine = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.82, 12), engineMaterial);
    engine.rotation.x = -Math.PI / 2;
    engine.position.set(side * 0.38, -0.08, -1.28);
    craft.add(engine);
    engineMaterials.push(engineMaterial);
  }

  if (showGlow) {
    const glow = new THREE.PointLight(glowColor, 3, 7);
    glow.position.set(0, 0.25, -1.1);
    craft.add(glow);
  }

  return { group: craft, engineMaterials, glow: craft.children.find((child) => child.isPointLight) ?? null };
}

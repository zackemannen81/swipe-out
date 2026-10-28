import * as THREE from 'three';

// World-space history at 240 Hz keeps even the fastest ships continuous at 30 fps.
const SAMPLE_STEP = 1 / 240;
const HISTORY_SIZE = 128;
const SPARK_CAPACITY = 2048;
const NOZZLES = [-0.34, 0.34].map(x => new THREE.Vector3(x, 0, -1.42));
const clamp = THREE.MathUtils.clamp;

function makeTrailMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `
      attribute float age;
      attribute float power;
      attribute vec3 color; // NYTT: Ta emot färg
      
      varying vec2 vUv;
      varying float vAge;
      varying float vPower;
      varying vec3 vColor;  // NYTT: Skicka till fragment
      
      void main() {
        vUv = uv; vAge = age; vPower = power; vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 vUv;
      varying float vAge;
      varying float vPower;
      varying vec3 vColor;
      
      void main() {
        float radius = abs(vUv.x * 2.0 - 1.0);
        float halo = pow(max(0.0, 1.0 - radius), 2.5);
        float core = exp(-radius * radius * 32.0);
        float fade = pow(max(0.0, 1.0 - vAge), 2.0);
        
        // NYTT: Mixa accentfärgen till en glödande vit/blå-kärna
        vec3 hot = mix(vColor, vec3(1.5, 1.8, 2.0), exp(-vAge * 9.0));
        vec3 finalColor = mix(vColor * 0.2, hot, core); 
        
        float filament = 0.92 + 0.08 * sin(vUv.y * 100.0 + radius * 9.0);
        float alpha = (halo * 0.42 + core * 0.9) * fade * vPower * filament;
        
        gl_FragColor = vec4(finalColor * 1.6, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function createNozzle(scene, material) {
  const geometry = new THREE.BufferGeometry();
  const count = (HISTORY_SIZE + 1) * 2;
  // NYTT: Lade till 'color', 3
  for (const [name, size] of [['position', 3], ['uv', 2], ['age', 1], ['power', 1], ['color', 3]]) {
    geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * size), size)
      .setUsage(THREE.DynamicDrawUsage));
  }
  const indices = [];
  for (let i = 0; i < HISTORY_SIZE; i++) {
    const v = i * 2;
    indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
  }
  geometry.setIndex(indices);
  geometry.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.name = 'thruster-wake';
  scene.add(mesh);
  return {
    mesh, geometry, head: new THREE.Vector3(),
    samples: Array.from({ length: HISTORY_SIZE }, () => ({
      position: new THREE.Vector3(), velocity: new THREE.Vector3(),
      age: 1, lifetime: 0, power: 0, width: 0,
    })),
    cursor: 0, count: 0,
  };
}

export class ThrusterSystem {
  constructor(scene, { random = Math.random } = {}) {
    this.scene = scene;
    this.random = random;
    this.emitters = [];
    this.material = makeTrailMaterial();
    this.time = 0;
    this.sparkCursor = 0;
    // NYTT: Spark har nu en color
    this.sparks = Array.from({ length: SPARK_CAPACITY }, () => ({
      position: new THREE.Vector3(), velocity: new THREE.Vector3(),
      age: 1, lifetime: 0, size: 0, color: new THREE.Color()
    }));
    this.sparkGeometry = new THREE.BufferGeometry();
    
    // NYTT: Lade till 'color', 3
    for (const [name, size] of [['position', 3], ['size', 1], ['life', 1], ['color', 3]]) {
      this.sparkGeometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY * size), size)
        .setUsage(THREE.DynamicDrawUsage));
    }
    this.sparkGeometry.setDrawRange(0, 0);
    this.sparkMaterial = new THREE.ShaderMaterial({
      uniforms: { viewportHeight: { value: 900 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float viewportHeight;
        attribute float size;
        attribute float life;
        attribute vec3 color; // NYTT
        
        varying float vLife;
        varying vec3 vColor;  // NYTT
        void main() {
          vLife = life;
          vColor = color;
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(size * viewportHeight * projectionMatrix[1][1] / max(0.1, -2.0 * p.z), 1.0, 24.0);
          gl_Position = projectionMatrix * p;
        }`,
      fragmentShader: `
        varying float vLife;
        varying vec3 vColor; // NYTT
        void main() {
          float r = length(gl_PointCoord * 2.0 - 1.0);
          float glow = pow(max(0.0, 1.0 - r), 2.0);
          
          // NYTT: Mixa accentfärgen till glödande vit
          vec3 sparkColor = mix(vColor, vec3(1.6, 2.0, 2.4), vLife);
          gl_FragColor = vec4(sparkColor, glow * vLife * vLife);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.sparkMesh = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    this.sparkMesh.frustumCulled = false;
    this.sparkMesh.name = 'thruster-particles';
    scene.add(this.sparkMesh);
    this._position = new THREE.Vector3();
    this._rotation = new THREE.Quaternion();
    this._direction = new THREE.Vector3();
    this._tangent = new THREE.Vector3();
    this._view = new THREE.Vector3();
    this._side = new THREE.Vector3();
    this._center = new THREE.Vector3();
    this._next = new THREE.Vector3();
  }

  // NYTT: Tar emot färg från skeppet
  addCraft(craft, color = new THREE.Color(0xffffff)) {
    const emitter = {
      craft, color, previousPosition: new THREE.Vector3(), previousRotation: new THREE.Quaternion(),
      initialized: false, active: false, power: 0, remainder: 0,
      nozzles: NOZZLES.map(() => createNozzle(this.scene, this.material)),
    };
    this.emitters.push(emitter);
    return emitter;
  }

  resetEmitter(emitter) {
    emitter.initialized = false;
    emitter.active = false;
    emitter.power = 0;
    emitter.remainder = 0;
    for (const nozzle of emitter.nozzles) {
      nozzle.count = 0;
      nozzle.cursor = 0;
      for (const sample of nozzle.samples) sample.lifetime = 0;
      nozzle.geometry.setDrawRange(0, 0);
    }
  }

  reset() {
    for (const emitter of this.emitters) this.resetEmitter(emitter);
    for (const spark of this.sparks) spark.lifetime = 0;
    this.sparkGeometry.setDrawRange(0, 0);
  }

  updateCraft(emitter, delta, throttle, boost = false, active = true) {
    if (!(delta > 0)) return;
    const { craft, color } = emitter;
    const target = active ? (boost ? 1.25 : 0.22 + clamp(throttle, 0, 1) * 0.78) : 0;
    const previousPower = emitter.power;
    const response = target > previousPower ? 12 : 7;
    emitter.power = THREE.MathUtils.damp(previousPower, target, response, delta);
    
    if (!emitter.initialized || emitter.previousPosition.distanceToSquared(craft.position) > 400) {
      this.resetEmitter(emitter);
      emitter.previousPosition.copy(craft.position);
      emitter.previousRotation.copy(craft.quaternion);
      emitter.initialized = true;
      emitter.power = target;
    }
    emitter.active = active;
    for (let n = 0; n < NOZZLES.length; n++) {
      const nozzle = emitter.nozzles[n];
      nozzle.head.copy(NOZZLES[n]).applyQuaternion(craft.quaternion).add(craft.position);
      for (const sample of nozzle.samples) sample.age += delta;
    }
    if (active) {
      let birth = SAMPLE_STEP - emitter.remainder;
      for (; birth <= delta + 1e-9; birth += SAMPLE_STEP) {
        const fraction = clamp(birth / delta, 0, 1);
        this._position.lerpVectors(emitter.previousPosition, craft.position, fraction);
        this._rotation.slerpQuaternions(emitter.previousRotation, craft.quaternion, fraction);
        this._direction.set(0, 0, -1).applyQuaternion(this._rotation);
        const power = THREE.MathUtils.lerp(previousPower, emitter.power, fraction);
        for (let n = 0; n < NOZZLES.length; n++) {
          const nozzle = emitter.nozzles[n];
          const sample = nozzle.samples[nozzle.cursor];
          sample.position.copy(NOZZLES[n]).applyQuaternion(this._rotation).add(this._position);
          sample.velocity.copy(this._direction).multiplyScalar(7 + power * 8);
          sample.age = Math.max(0, delta - birth);
          sample.lifetime = 0.06 + power * 0.05;
          sample.width = 0.19 + power * 0.23;
          sample.power = power;
          nozzle.cursor = (nozzle.cursor + 1) % HISTORY_SIZE;
          nozzle.count = Math.min(nozzle.count + 1, HISTORY_SIZE);
          
          if (this.random() < (35 + power * 95) * SAMPLE_STEP) this.emitSpark(sample, color); // NYTT: Skickar color
        }
      }
      emitter.remainder = (emitter.remainder + delta) % SAMPLE_STEP;
      if (emitter.remainder < 1e-9 || SAMPLE_STEP - emitter.remainder < 1e-9) emitter.remainder = 0;
    } else {
      emitter.remainder = 0;
    }
    emitter.previousPosition.copy(craft.position);
    emitter.previousRotation.copy(craft.quaternion);
  }

  // NYTT: Tar emot och applicerar color
  emitSpark(sample, color) {
    const spark = this.sparks[this.sparkCursor];
    this.sparkCursor = (this.sparkCursor + 1) % SPARK_CAPACITY;
    spark.position.copy(sample.position);
    spark.velocity.copy(sample.velocity);
    spark.color.copy(color); 
    spark.velocity.x += (this.random() - 0.5) * 3.5;
    spark.velocity.y += (this.random() - 0.5) * 3.5;
    spark.velocity.z += (this.random() - 0.5) * 3.5;
    spark.lifetime = sample.lifetime * (0.8 + this.random() * 0.5);
    spark.age = sample.age;
    spark.bornAt = this.time;
    spark.size = 0.025 + this.random() * 0.055;
  }

  // NYTT: Tar emot color
  writeSection(nozzle, index, center, tangent, camera, age, power, width, color) {
    this._view.subVectors(camera.position, center).normalize();
    this._side.crossVectors(tangent, this._view);
    if (this._side.lengthSq() < 1e-6) this._side.set(1, 0, 0).applyQuaternion(camera.quaternion);
    this._side.normalize().multiplyScalar(width * (1 + age * 0.35));
    const attributes = nozzle.geometry.attributes;
    for (let side = 0; side < 2; side++) {
      const vertex = index * 2 + side;
      const sign = side ? 1 : -1;
      attributes.position.setXYZ(vertex, center.x + this._side.x * sign, center.y + this._side.y * sign, center.z + this._side.z * sign);
      attributes.uv.setXY(vertex, side, age);
      attributes.age.setX(vertex, age);
      attributes.power.setX(vertex, power);
      attributes.color.setXYZ(vertex, color.r, color.g, color.b); // NYTT: Skriver färgen
    }
  }

  update(delta, camera, viewportHeight) {
    for (const emitter of this.emitters) {
      for (const nozzle of emitter.nozzles) {
        let sections = 0;
        this._tangent.set(0, 0, -1).applyQuaternion(emitter.craft.quaternion);
        if (emitter.active) {
          // NYTT: Skickar med emitter.color
          this.writeSection(nozzle, sections++, nozzle.head, this._tangent, camera, 0, emitter.power, 0.19 + emitter.power * 0.23, emitter.color);
        }
        for (let i = 0; i < nozzle.count; i++) {
          const sample = nozzle.samples[(nozzle.cursor - 1 - i + HISTORY_SIZE) % HISTORY_SIZE];
          if (sample.age >= sample.lifetime) break;
          this._center.copy(sample.position).addScaledVector(sample.velocity, sample.age);
          if (i + 1 < nozzle.count) {
            const older = nozzle.samples[(nozzle.cursor - 2 - i + HISTORY_SIZE) % HISTORY_SIZE];
            this._next.copy(older.position).addScaledVector(older.velocity, older.age);
            this._tangent.subVectors(this._next, this._center).normalize();
          }
          // NYTT: Skickar med emitter.color
          this.writeSection(nozzle, sections++, this._center, this._tangent, camera, sample.age / sample.lifetime, sample.power, sample.width, emitter.color);
        }
        nozzle.geometry.setDrawRange(0, Math.max(0, sections - 1) * 6);
        for (const attribute of Object.values(nozzle.geometry.attributes)) attribute.needsUpdate = true;
      }
    }
    const attributes = this.sparkGeometry.attributes;
    let count = 0;
    for (const spark of this.sparks) {
      if (spark.bornAt !== this.time) spark.age += delta;
      if (spark.age >= spark.lifetime) continue;
      this._center.copy(spark.position).addScaledVector(spark.velocity, spark.age);
      attributes.position.setXYZ(count, this._center.x, this._center.y, this._center.z);
      attributes.size.setX(count, spark.size);
      attributes.life.setX(count, 1 - spark.age / spark.lifetime);
      attributes.color.setXYZ(count, spark.color.r, spark.color.g, spark.color.b); // NYTT: Skriver färgen till Array-buffern
      count++;
    }
    this.sparkGeometry.setDrawRange(0, count);
    for (const attribute of Object.values(attributes)) attribute.needsUpdate = true;
    this.sparkMaterial.uniforms.viewportHeight.value = viewportHeight;
    this.time += delta;
  }

  dispose() {
    for (const emitter of this.emitters) for (const nozzle of emitter.nozzles) {
      this.scene.remove(nozzle.mesh);
      nozzle.geometry.dispose();
    }
    this.scene.remove(this.sparkMesh);
    this.sparkGeometry.dispose();
    this.sparkMaterial.dispose();
    this.material.dispose();
  }
}
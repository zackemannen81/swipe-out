import * as THREE from 'three';

export class ThrusterParticles {
  constructor(scene, maxParticles = 3000) {
    this.maxParticles = maxParticles;
    this.currentIndex = 0;

    // Buffer-arrayer för all data (Pre-allokerat minne = 0 hack i spelet)
    this.positions = new Float32Array(maxParticles * 3);
    this.velocities = new Float32Array(maxParticles * 3);
    this.lifes = new Float32Array(maxParticles);
    this.colors = new Float32Array(maxParticles * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifes, 1));

    // Custom Shader för extrem prestanda (körs på Grafikkortet)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.createGlowTexture() }
      },
      vertexShader: `
        attribute float aLife;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vLife;
        void main() {
          vColor = color;
          vLife = aLife;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Partiklarna blir mindre när de dör, och skalas korrekt på avstånd
          gl_PointSize = (45.0 * aLife) * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vLife;
        void main() {
          if (vLife <= 0.0) discard;
          
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          
          // Skapa en vit het kärna som tonar ut i din skeppsfärg
          vec3 finalColor = mix(vColor, vec3(1.0), vLife * 0.5);
          
          gl_FragColor = vec4(finalColor, texColor.a * vLife);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false; // Rendera alltid för att undvika pop-in
    scene.add(this.points);
  }

  // Generera en mjuk glöd-textur direkt i minnet
  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(71, 255, 246, 0.8)');
    grad.addColorStop(1, 'rgba(137, 222, 229, 0.79)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  emit(position, velocity, color, lifeTime = 1.0) {
    const i = this.currentIndex;
    const i3 = i * 3;

    // Sätt startposition med liiiite slump för en bredare eldslåga
    this.positions[i3] = position.x + (Math.random() - 0.5) * 0.2;
    this.positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.2;
    this.positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.2;

    // Hastighet (partiklarna sprutar bakåt)
    this.velocities[i3] = velocity.x;
    this.velocities[i3 + 1] = velocity.y;
    this.velocities[i3 + 2] = velocity.z;

    this.colors[i3] = color.r;
    this.colors[i3 + 1] = color.g;
    this.colors[i3 + 2] = color.b;

    this.lifes[i] = lifeTime;

    // Stega index (Ring Buffer loopar tillbaka till 0 när den är full)
    this.currentIndex = (this.currentIndex + 1) % this.maxParticles;
  }

  update(delta) {
    let needsUpdate = false;

    for (let i = 0; i < this.maxParticles; i++) {
      if (this.lifes[i] > 0) {
        this.lifes[i] -= delta * 2.5; // Hur snabbt partikeln dör
        
        const i3 = i * 3;
        this.positions[i3] += this.velocities[i3] * delta;
        this.positions[i3 + 1] += this.velocities[i3 + 1] * delta;
        this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;

        // Lägg till lite friktion (partiklarna stannar upp efter att de sprutats ut)
        this.velocities[i3] *= 0.95;
        this.velocities[i3 + 1] *= 0.95;
        this.velocities[i3 + 2] *= 0.95;
        
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.aLife.needsUpdate = true;
    }
  }
}
import * as THREE from 'three';

export class Particle {
    constructor() {
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.material = null;
        this.size = 1.0;
        this.initialSize = 1.0;
        this.scale = 1.0;
        this.lifetime = 1.0;
        this.age = 0.0;
        
        // NYTT: Alpha-värden
        this.alpha = 1.0;
        this.startAlpha = 1.0;
        this.endAlpha = 0.0;
        
        this.active = false;
    }

    reset(position, velocity, material, size, scale, lifetime, startAlpha = 1.0, endAlpha = 0.0) {
        this.position.copy(position);
        this.velocity.copy(velocity);
        this.material = material;
        this.size = size;
        this.initialSize = size;
        this.scale = scale;
        this.lifetime = lifetime;
        this.age = 0.0;
        
        // NYTT
        this.startAlpha = startAlpha;
        this.endAlpha = endAlpha;
        this.alpha = startAlpha;
        
        this.active = true;
    }
}

export class ParticleEmitter {
    constructor(config = {}) {
        this.position = config.position ? config.position.clone() : new THREE.Vector3();
        this.previousPosition = this.position.clone();
        this.quaternion = config.quaternion ? config.quaternion.clone() : new THREE.Quaternion();
        
        this.rate = config.rate || 5; // Tid i millisekunder mellan varje partikel (t.ex. 50ms)
        this.timeSinceLastParticle = 0.0; // Timer som ökar varje frame

        this.startAlpha = config.startAlpha !== undefined ? config.startAlpha : 1.0;
        this.endAlpha = config.endAlpha !== undefined ? config.endAlpha : 0.0;

        this.particleLifetime = config.particleLifetime || 1.0;
        this.particleSize = config.particleSize || 1.0;
        this.particleScale = config.particleScale || 1.0;
        this.emissionVelocity = config.emissionVelocity ? config.emissionVelocity.clone() : new THREE.Vector3(0, 1, 0);
        this.craftVelocity = config.craftVelocity ? config.craftVelocity.clone() : new THREE.Vector3();
        this.active = config.active !== undefined ? config.active : true;
        this.particleMaterial = config.particleMaterial || null;
        this._isFirstUpdate = true;
    }
}


export class ParticleSystem {
    constructor(maxParticles = 5000, scene = null) {
        this.maxParticles = maxParticles;
        this.scene = scene;
        this.particles = [];
        this.emitters = [];

        // Vi grupperar renderingsresurser per material
        // Nyckel: material-objekt (eller 'default'), Värde: { geometry, points, positions, sizes }
        this.renderBatches = new Map();

        this._worldEmissionVel = new THREE.Vector3();
        this._finalVelocity = new THREE.Vector3();
    }

    initParticleSystem() {
        // Preallokera partikelpoolen
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(new Particle());
        }
    }

    createEmitter(config) {
        const emitter = new ParticleEmitter(config);
        
        // Om emitter inte har ett eget material skapar vi ett standardmaterial
        if (!emitter.particleMaterial) {
            if (!this.defaultMaterial) {
                this.defaultMaterial = new THREE.PointsMaterial({
                    size: 1.0,
                    color: 0xffffff,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
            }
            emitter.particleMaterial = this.defaultMaterial;
        }

        // Säkerställ att det finns en renderings-batch för detta material
        this._getOrCreateBatch(emitter.particleMaterial);

        this.emitters.push(emitter);
        return emitter;
    }

    _getOrCreateBatch(material) {
        if (this.renderBatches.has(material)) {
            return this.renderBatches.get(material);
        }

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxParticles * 3);
        const sizes = new Float32Array(this.maxParticles);
        const alphas = new Float32Array(this.maxParticles); // NYTT

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1)); // NYTT

        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        geometry.setDrawRange(0, this.maxParticles);

        if (this.scene) {
            this.scene.add(points);
        }
        const batch = { geometry, points, positions, sizes, alphas };

        this.renderBatches.set(material, batch);
        return batch;
    }

createParticle(position, velocity, material, size, scale, lifetime, startAlpha, endAlpha) { // NYTT
    this._getOrCreateBatch(material);
        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particles[i];
            if (!p.active) {
                p.reset(position, velocity, material, size, scale, lifetime, startAlpha, endAlpha); // NYTT
                return p;
            }
        }
        return null;
    }

updateEmitter(emitter, deltaTime) {
        if (!emitter.active || emitter.rate <= 0) return;

        if (emitter._isFirstUpdate) {
            emitter.previousPosition.copy(emitter.position);
            emitter._isFirstUpdate = false;
            return;
        }

        // Öka timern med millisekunder (deltaTime är i sekunder, så * 1000)
        emitter.timeSinceLastParticle += deltaTime * 1000.0;

        const distanceMoved = emitter.previousPosition.distanceTo(emitter.position);

        // Så länge timern har nått eller passerat 'rate'-gränsen i millisekunder
        while (emitter.timeSinceLastParticle >= emitter.rate) {
            emitter.timeSinceLastParticle -= emitter.rate;

            // Beräkna mjuk position mellan förra framen och nuvarande (för att slippa hackiga hopp)
            const progress = distanceMoved > 0.001 
                ? THREE.MathUtils.clamp(1.0 - (emitter.timeSinceLastParticle / (deltaTime * 1000.0)), 0, 1) 
                : 1.0;

            const spawnPos = new THREE.Vector3().lerpVectors(
                emitter.previousPosition,
                emitter.position,
                progress
            );

            this._worldEmissionVel.copy(emitter.emissionVelocity).applyQuaternion(emitter.quaternion);
            this._finalVelocity.copy(emitter.craftVelocity).add(this._worldEmissionVel);

this.createParticle(
                spawnPos,
                this._finalVelocity,
                emitter.particleMaterial,
                emitter.particleSize,
                emitter.particleScale,
                emitter.particleLifetime,
                emitter.startAlpha, // NYTT
                emitter.endAlpha    // NYTT
            );
        }

        // Spara nuvarande position till nästa frame
        emitter.previousPosition.copy(emitter.position);
    }

updateParticles(deltaTime) {
    for (let i = 0; i < this.maxParticles; i++) {
        const p = this.particles[i];
        if (!p.active) continue;

        p.age += deltaTime;
        if (p.age >= p.lifetime) {
            p.active = false;
            continue;
        }

        // 1. Flytta partikeln
        p.position.addScaledVector(p.velocity, deltaTime);

        // 2. Skala över livslängd (0.0 = nyskapad, 1.0 = döende)
        const lifeProgress = p.age / p.lifetime;
        
        // Exempel A: Linjär krympning (börjar på full storlek, slutar på 0)
        p.size = p.initialSize * (1.0 - lifeProgress);

        // NYTT: Tona ut alpha mjukt från start till slut
        p.alpha = THREE.MathUtils.lerp(p.startAlpha, p.endAlpha, lifeProgress);
        // Exempel B (Alternativ): Om du vill att p.scale ska styra hur mycket den krymper/växer:
        // p.size = p.initialSize * Math.pow(p.scale, lifeProgress);
    }
}


updateBuffers() {
        for (let [material, batch] of this.renderBatches) {
            batch.positions.fill(0);
            batch.sizes.fill(0);
            batch.alphas.fill(0); // NYTT
        }

        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particles[i];
            if (!p.active || !p.material) continue;

            const batch = this.renderBatches.get(p.material);
            if (batch) {
                batch.positions[i * 3]     = p.position.x;
                batch.positions[i * 3 + 1] = p.position.y;
                batch.positions[i * 3 + 2] = p.position.z;
                batch.sizes[i]             = p.size * p.scale;
                batch.alphas[i]            = p.alpha; // NYTT
            }
        }

        for (let [material, batch] of this.renderBatches) {
            batch.geometry.attributes.position.needsUpdate = true;
            batch.geometry.attributes.size.needsUpdate = true;
            batch.geometry.attributes.alpha.needsUpdate = true; // NYTT
        }
    }


    

    updateSystem(deltaTime) {
        for (let i = 0; i < this.emitters.length; i++) {
            this.updateEmitter(this.emitters[i], deltaTime);
        }

        this.updateParticles(deltaTime);
        this.updateBuffers();
    }
}
import * as THREE from 'three';

    export const shader_material_001 = new THREE.ShaderMaterial({
      uniforms: {
          pointTexture: { value: createGlowTexture() } 
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
          
          // Skapa en 3-stegs färgskala baserad på partikelns ålder
          vec3 darkColor = vColor * 0.15; // Mörk och subtil färg för svansen
          
          // Mix 1: Från mörk svans till intensiv huvudfärg
          vec3 finalColor = mix(darkColor, vColor, smoothstep(0.0, 0.6, vLife));
          
          // Mix 2: Från huvudfärg till kritvit kärna när den precis skjutits ut
          finalColor = mix(finalColor, vec3(1.0), smoothstep(0.7, 1.0, vLife));
          
          // Mjuk in- och uttoning av opaciteten (undvik att de "poppar" in eller ut)
          float alpha = texColor.a * smoothstep(0.0, 0.15, vLife);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      blending: THREE.AdditiveBlending, // (VIKTIGT: Utan dessa tre rader blir elden mörk/fyrkantig)
      depthWrite: false,
      transparent: true
    });
    
   export const shader_material_002 = new THREE.ShaderMaterial({
      // Inga uniforms behövs längre!
      vertexShader: `
        attribute float aLife;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vLife;
        void main() {
          vColor = color;
          vLife = aLife;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Öka storleken lite (från 45.0 till 65.0) så de överlappar varandra mer
          gl_PointSize = (65.0 * aLife) * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vLife;
        
        void main() {
          if (vLife <= 0.0) discard;
          
          // 1. Skapa en perfekt rund form matematiskt istället för en bild
          vec2 pt = gl_PointCoord - vec2(0.5);
          float sqDist = dot(pt, pt);
          
          // Klipp bort allt som är utanför cirkeln (tar bort fyrkanterna helt!)
          if (sqDist > 0.25) discard; 
          
          // 2. Mjuk glöd från mitten (1.0) ut till kanten (0.0)
          float dist = sqrt(sqDist) * 2.0;
          float glow = 1.0 - smoothstep(0.0, 1.0, dist);
          glow = pow(glow, 1.5); // Gör kärnan hetare och kanten mjukare
          
          // 3. Färgmix
          vec3 darkColor = vColor * 0.15;
          vec3 finalColor = mix(darkColor, vColor, smoothstep(0.0, 0.6, vLife));
          finalColor = mix(finalColor, vec3(1.0), smoothstep(0.7, 1.0, vLife));
          
          // 4. Multiplicera glöden med livslängden
          float alpha = glow * smoothstep(0.0, 0.2, vLife);
          
          // Premultiplicerad färg för felfri Additive Blending
          gl_FragColor = vec4(finalColor * alpha, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

  // Generera en mjuk glöd-textur direkt i minnet
export function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Mjukare övergångar skapar illusionen av gas/plasma
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(233, 199, 229, 0.8)');
    grad.addColorStop(0.4, 'rgba(239, 172, 241, 0.81)');
    grad.addColorStop(1, 'rgb(240, 195, 230)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }


  export const thruster_materialOne = new THREE.ShaderMaterial({
      uniforms: {
          pointTexture: { value: createGlowTexture() } 
      },
      vertexShader: `
          attribute float size;
          varying vec2 vUv;
          void main() {
              vUv = uv;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
          }
      `,
      fragmentShader: `
          uniform sampler2D pointTexture;
          varying vec2 vUv;
          void main() {
              gl_FragColor = texture2D(pointTexture, gl_PointCoord);
          // 1. Skapa en perfekt rund form matematiskt istället för en bild
          vec2 pt = gl_PointCoord - vec2(0.5);
          float sqDist = dot(pt, pt);
          
          // Klipp bort allt som är utanför cirkeln (tar bort fyrkanterna helt!)
          if (sqDist > 0.25) discard; 
              // Lägg till extra eld-färg/logik här om det behövs
          }
      `,
      blending: THREE.AdditiveBlending, // VIKTIGT: Förhindrar att elden blir mörk/fyrkantig
      depthWrite: false,
      transparent: true
  });
  export const thruster_material = new THREE.ShaderMaterial({
      uniforms: {
          pointTexture: { value: createGlowTexture() } 
      },
      vertexShader: `
          attribute float size;
          attribute float alpha; // NYTT: Ta emot alpha från partikelsystemet
          
          varying vec2 vUv;
          varying float vAlpha;  // NYTT: Skicka vidare till fragment shadern
          
          void main() {
              vUv = uv;
              vAlpha = alpha;    // NYTT: Sätt värdet
              
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
          }
      `,
      fragmentShader: `
          uniform sampler2D pointTexture;
          varying vec2 vUv;
          varying float vAlpha; // NYTT: Ta emot alpha från vertex shadern
          
          void main() {
              vec2 pt = gl_PointCoord - vec2(0.5);
              float sqDist = dot(pt, pt);
              
              if (sqDist > 0.25) discard; 
              
              vec4 texColor = texture2D(pointTexture, gl_PointCoord);
              
              // NYTT: Multiplicera färgen med vår alpha för att tona ut den (viktigt för AdditiveBlending)
              gl_FragColor = texColor * vAlpha;
          }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
  });
export const sparks_material = new THREE.ShaderMaterial({
    uniforms: {
        pointTexture: { value: createGlowTexture() } 
    },
    vertexShader: `
        attribute float size;
        attribute float alpha; 
        
        varying vec2 vUv;
        varying float vAlpha;  
        
        void main() {
            vUv = uv;
            vAlpha = alpha;    
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (350.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec2 vUv;
        varying float vAlpha; 
        
        void main() {
            // Skapa en perfekt cirkel
            vec2 pt = gl_PointCoord - vec2(0.5);
            float sqDist = dot(pt, pt);
            if (sqDist > 0.25) discard; 
            
            // Beräkna avstånd från mitten för att skapa en glöd
            float dist = sqrt(sqDist) * 2.0;
            
            // Vitglödande kärna och mjuk kant
            float core = 1.0 - smoothstep(0.0, 0.4, dist); 
            float edge = 1.0 - smoothstep(0.1, 1.0, dist); 
            
            vec3 coreColor = vec3(1.0, 1.0, 1.0); // Kritvit
            vec3 edgeColor = vec3(1.0, 0.4, 0.0); // Orange-röd
            
            // Mixa färgerna baserat på avståndet från centrum
            vec3 finalColor = mix(edgeColor, coreColor, core);
            
            // Applicera glöd, textur och partikelsystemets alpha (uttoning över tid)
            vec4 texColor = texture2D(pointTexture, gl_PointCoord);
            float finalAlpha = edge * texColor.a * vAlpha;
            
            // Premultiplicerad färg för AdditiveBlending
            gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
        }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
});


const veinUniforms = {
    uTime: { value: 0 },
    uFrostedColor: { value: new THREE.Color('#1a2230') }, 
    uVeinScale: { value: 4.0 },
    uVeinThickness: { value: 0.08 },
    uVeinWarp: { value: 0.35 },
    uVeinGlow: { value: 1.5 },   
    uRoughness: { value: 0.6 },   
    uClearcoat: { value: 1.0 }, 
};

const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        vNormal = normalize(normalMatrix * normal);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform vec3 uFrostedColor;
    uniform float uVeinScale;
    uniform float uVeinThickness;
    uniform float uVeinWarp;
    uniform float uVeinGlow;
    uniform float uRoughness;
    uniform float uClearcoat;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    vec3 getPastelRainbow(float offset) {
        float t = offset * 6.28318 + uTime * 0.5;
        vec3 color = 0.7 + 0.3 * cos(t + vec3(0.0, 2.0, 4.0));
        return clamp(color, 0.0, 1.0);
    }

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // LAYER 1: SMOKY FROSTED GLASS BASE 
        float NdotV = max(dot(normal, viewDir), 0.0);
        float baseFresnel = pow(1.0 - NdotV, 3.0) * uRoughness;
        vec3 baseLayer = mix(uFrostedColor, uFrostedColor * 1.5, baseFresnel);

        // LAYER 2: EMISSIVE RAINBOW VEIN SYSTEM 
        vec3 warpCoord = vWorldPosition * uVeinScale;
        vec3 warpFactor = vec3(
            snoise(warpCoord + vec3(uTime * 0.1)),
            snoise(warpCoord + vec3(22.1 + uTime * 0.1)),
            snoise(warpCoord + vec3(44.3 + uTime * 0.1))
        );
        
        vec3 veinCoord = warpCoord + warpFactor * uVeinWarp;
        float noiseVal = snoise(veinCoord);
        
        float veinMask = smoothstep(1.0 - uVeinThickness, 1.0, 1.0 - abs(noiseVal));
        
        float rainbowOffset = snoise(vWorldPosition * 0.5) * 0.5 + 0.5;
        vec3 veinColor = getPastelRainbow(rainbowOffset) * uVeinGlow;

        vec3 compositeColor = mix(baseLayer, veinColor, veinMask);

        // LAYER 3: REFLECTIVE CLEARCOAT 
        float clearcoatFresnel = pow(1.0 - NdotV, 5.0);
        vec3 reflectionColor = vec3(1.0); 
        
        // TOP LAYER (CLEARCOAT) BLENDING
        vec3 finalColor = mix(compositeColor, reflectionColor, clearcoatFresnel * uClearcoat);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export const alive_trackmaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: veinUniforms,
    transparent: false
});

function animate(timestamp) {
    requestAnimationFrame(animate);
    
    veinUniforms.uTime.value = timestamp * 0.001;

}
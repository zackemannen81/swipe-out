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
    canvas.width = 96; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    
    // Mjukare övergångar skapar illusionen av gas/plasma
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(233, 199, 229, 0.8)');
    grad.addColorStop(0.4, 'rgba(239, 172, 241, 0.81)');
    grad.addColorStop(1, 'rgb(240, 195, 230)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 96, 96);
    
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
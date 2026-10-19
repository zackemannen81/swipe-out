import * as THREE from 'three';
import { Ship } from './ship'; 

export class ChaseCamera {
    camera: THREE.PerspectiveCamera;
    
    // Konfiguration - Trimma dessa för att få rätt "Wipeout"-känsla
    distance: number = 6.0;      // Hur långt bakom
    height: number = 2.0;        // Hur högt över
    positionLerp: number = 5.0;  // Hur snabbt kameran hinner ifatt position (högre = stummare)
    lookAtLerp: number = 10.0;   // Hur snabbt kameran låser blicken på skeppet

    // Interna variabler för att spara föregående bildrutas värden
    private currentPosition: THREE.Vector3;
    private currentLookAt: THREE.Vector3;
    
    // Pre-allokerade vektorer för matte-magin (undviker garbage collection)
    private idealPosition = new THREE.Vector3();
    private idealLookAt = new THREE.Vector3();
    private offset = new THREE.Vector3();

    constructor(camera: THREE.PerspectiveCamera, initialShipPos: THREE.Vector3) {
        this.camera = camera;
        this.currentPosition = new THREE.Vector3().copy(initialShipPos);
        this.currentLookAt = new THREE.Vector3().copy(initialShipPos);
    }

    update(dt: number, ship: Ship) {
        if (!ship.model) return;

        // 1. Räkna ut var kameran HELST vill vara (ideal position)
        // Vi tar skeppets lokala bakåt-riktning (Z) och upp-riktning (Y)
        this.offset.set(0, this.height, this.distance);
        
        // Applicera skeppets aktuella rotation på offseten och addera skeppets världsposition
        this.idealPosition.copy(this.offset)
            .applyQuaternion(ship.model.quaternion)
            .add(ship.position);

        // 2. Räkna ut vad kameran ska titta på (ofta skeppet, eller lite framför skeppet)
        // Att titta något framför skeppet hjälper spelaren att se in i svängar
        this.idealLookAt.copy(ship.position).add(
            new THREE.Vector3(0, 0, -2).applyQuaternion(ship.model.quaternion)
        );

        // 3. MATTEN: Gummisnodden (Lerp)
        // Vi flyttar nuvarande position en viss procent (dt * lerp) mot idealet
        this.currentPosition.lerp(this.idealPosition, dt * this.positionLerp);
        this.currentLookAt.lerp(this.idealLookAt, dt * this.lookAtLerp);

        // 4. Uppdatera den faktiska Three.js-kameran
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
}
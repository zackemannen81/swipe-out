import * as THREE from 'three';

// @ts-ignore -- track.js does not currently provide a declaration file.
import type { Section, TrackFace } from './track.js';
// @ts-ignore -- audio.js does not currently provide a declaration file.
import type { Sfx } from './audio';

// Ship state flags
export enum ShipFlags {
    IN_TOW          = 1 << 0,
    VIEW_REMOTE     = 1 << 1,
    VIEW_INTERNAL   = 1 << 2,
    DIRECTION_FORWARD = 1 << 3,
    FLYING          = 1 << 4,
    LEFT_SIDE       = 1 << 5,
    RACING          = 1 << 6,
    COLL            = 1 << 7,
    ON_JUNCTION     = 1 << 8,
    VISIBLE         = 1 << 9,
    IN_RESCUE       = 1 << 10,
    OVERTAKEN       = 1 << 11,
    JUST_IN_FRONT   = 1 << 12,
    JUNCTION_LEFT   = 1 << 13,
    SHIELDED        = 1 << 14,
    ELECTROED       = 1 << 15,
    REVCONNED       = 1 << 16,
    SPECIALED       = 1 << 17,
}

export class Ship {
    // ... (dina tidigare egenskaper)

    // Pre-allokerade resultatvektorer för att spara minne i loopen
    private _nosePos = new THREE.Vector3();
    private _wingLeftPos = new THREE.Vector3();
    private _wingRightPos = new THREE.Vector3();
    private _cockpitPos = new THREE.Vector3();

    // Lokala offsets (Justera Z och X utifrån din Three.js-modell, Wipeout Z är ofta bakvänt mot Three.js)
    private _noseOffset = new THREE.Vector3(0, 0, -2.5); // Framåt (ofta -Z i Three.js)
    private _wingLeftOffset = new THREE.Vector3(-1.8, 0, 1.0); 
    private _wingRightOffset = new THREE.Vector3(1.8, 0, 1.0);
    private _cockpitOffset = new THREE.Vector3(0, 0.5, 0);

    // ... (din init och update-kod)



    // Timing constants (original NTSC frame units)
    static readonly UPDATE_TIME_INITIAL   = 200 / 30;
    static readonly UPDATE_TIME_THREE     = 150 / 30;
    static readonly UPDATE_TIME_RACE_VIEW = 100 / 30;
    static readonly UPDATE_TIME_TWO       = 100 / 30;
    static readonly UPDATE_TIME_ONE       = 50 / 30;
    static readonly UPDATE_TIME_GO        = 0;

    // Physics constants
    static readonly FIXED_SCALE = 1 / 4096;
    static readonly MIN_RESISTANCE = 20;
    static readonly MAX_RESISTANCE = 74;
    static readonly VELOCITY_SHIFT = 6;
    static readonly TRACK_MAGNET = 64;
    static readonly TRACK_FLOAT = 256;

    static readonly SHIP_PITCH_ACCEL =
        ((30 / 16) / 64) * Math.PI * 2 * 900;

    static readonly SHIP_THRUST_RATE = 16 * 30;
    static readonly SHIP_THRUST_FALLOFF = 8 * 30;
    static readonly SHIP_BRAKE_RATE = 32 * 30;

    // Identity and state
    pilot = 0;
    flags = 0;

    section: Section | null = null;
    prevSection: Section | null = null;

    // Physics
    position = new THREE.Vector3();
    velocity = new THREE.Vector3();
    acceleration = new THREE.Vector3();
    thrust = new THREE.Vector3();

    angle = new THREE.Vector3();
    angularVelocity = new THREE.Vector3();
    angularAcceleration = new THREE.Vector3();

    tempTarget = new THREE.Vector3();

    turnRate = 0;
    turnRateMax = 0;
    turnRateFromHit = 0;

    mass = 0;
    thrustMag = 0;
    thrustMax = 0;
    currentThrustMax = 0;
    speed = 0;
    brakeLeft = 0;
    brakeRight = 0;

    resistance = 0;
    skid = 0;

    remoteThrustMag = 0;
    remoteThrustMax = 0;

    // Remote ship attributes
    fightBack = 0;
    startAccelerateTimer = 0;

    // Weapons
    weaponType = 0;
    weaponTarget: Ship | null = null;

    eboltTimer = 0;
    eboltEffectTimer = 0;
    revconTimer = 0;
    specialTimer = 0;

    // Race control
    positionRank = 0;
    lap = 0;
    maxLap = 0;
    lapTime = 0;

    sectionNum = 0;
    prevSectionNum = 0;
    totalSectionNum = 0;

    updateTimer = 0;
    lastImpactTime = 0;

    // Three.js rendering
    matrix = new THREE.Matrix4();
    model: THREE.Object3D | null = null;
    collisionModel: THREE.Object3D | null = null;
    shadowTexture = 0;

    // Exhaust plumes
    exhaustPlumes = Array.from({ length: 3 }, () => ({
        vertices: [] as THREE.Vector3[],
        initial: new THREE.Vector3(),
    }));

    // Audio
    sfxEngineThrust: Sfx | null = null;
    sfxEngineIntake: Sfx | null = null;
    sfxTurbulence: Sfx | null = null;
    sfxShield: Sfx | null = null;

    constructor(
        section: Section | null = null,
        pilot = 0,
        positionRank = 0,
    ) {
        this.section = section;
        this.pilot = pilot;
        this.positionRank = positionRank;
    }

    // Flag helpers
    hasFlag(flag: ShipFlags): boolean {
        return (this.flags & flag) !== 0;
    }

    setFlag(flag: ShipFlags): void {
        this.flags |= flag;
    }

    clearFlag(flag: ShipFlags): void {
        this.flags &= ~flag;
    }

    // Lifecycle
    init(
        section: Section,
        pilot: number,
        positionRank: number,
    ): void {
        this.section = section;
        this.pilot = pilot;
        this.positionRank = positionRank;

        // Initialize physics and race state here.
    }

    initExhaustPlume(): void {
        // Initialize exhaust plume geometry here.
    }

    resetExhaustPlume(): void {
        // Reset exhaust plume geometry here.
    }

    // Rendering
    draw(): void {
        // Render ship here.
    }

    drawShadow(): void {
        // Render ship shadow here.
    }

    // Simulation
    update(deltaTime: number): void {
        // Move the physics from ship_update() here.
    }

    collideWithTrack(face: TrackFace): void {
        // Move the physics from ship_collide_with_track() here.
    }

    collideWithShip(other: Ship): void {
        // Move the physics from ship_collide_with_ship() here.
    }

    // Geometry helpers
    cockpit(): THREE.Vector3 {
        return new THREE.Vector3();
    }
        nose(): THREE.Vector3 {
        // Kopiera offseten, snurra den efter skeppets vinkel och addera skeppets position
        return this._nosePos.copy(this._noseOffset)
            .applyQuaternion(this.model?.quaternion || new THREE.Quaternion())
            .add(this.position);
    }

    wingLeft(): THREE.Vector3 {
        return this._wingLeftPos.copy(this._wingLeftOffset)
            .applyQuaternion(this.model?.quaternion || new THREE.Quaternion())
            .add(this.position);
    }

    wingRight(): THREE.Vector3 {
        return this._wingRightPos.copy(this._wingRightOffset)
            .applyQuaternion(this.model?.quaternion || new THREE.Quaternion())
            .add(this.position);
    }

}
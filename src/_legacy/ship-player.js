import * as THREE from 'three';
import { RaceAudio } from './audio';

/*
export function createShipPhysics(baseSpeed = 65) {
  return {
    boostTimer: 0,        
    distance: 0,
    speed: baseSpeed,
    lateralOffset: 0,
    lateralVelocity: 0,
    verticalOffset: 0,
    verticalVelocity: 0,
    yaw: 0,
    yawVelocity: 0,
    roll: 0,
    pitch: 0,
    thrust: 0,
    brakeLeft: 0,
    brakeRight: 0,
    airborne: false,
    jumpCooldown: 0,
    previousSlope: 0,
    crashTimer: 0,
    crashCooldown: 0,
    lastImpact: 0,
    // ... dina andra variabler ...
    jumpCooldown: 0,
    previousSlope: 0,
    previousTangent: null, // NY: Håller koll på kurvans riktning
    assistLevel: 1.0,      // NY: 1.0 = Ingen drift (som nu), 0.0 = Full drift
    crashTimer: 0,
  };
}

const damp = (value, target, lambda, dt) =>
  THREE.MathUtils.damp(value, target, lambda, dt);
*/

   ship.angularAcceleration =  THREE.Vector3(0, 0, 0);

	if (input_state(A_LEFT)) {
		if (ship.angularVelocity.y < 0) {
			ship.angularAcceleration.y += ship.turnRate * 2;
		}
		else {
			let turn_target = powf(input_state(A_LEFT), save.analog_response);
			if (turn_target * ship.turnRateMax > ship.angularVelocity.y) {
				ship.angularAcceleration.y += ship.turnRate;
			}
		}
	}
	else if (input_state(A_RIGHT)) {
		if (ship.angularVelocity.y > 0) {
			ship.angularAcceleration.y -= ship.turnRate * 2;
		}
		else {
			let turn_target = powf(input_state(A_RIGHT), save.analog_response);
			if (turn_target * -ship.turnRateMax < ship.angularVelocity.y) {	
				ship.angularAcceleration.y -= ship.turnRate;
			}
		}
	}
	
	if (ship.isElectroed) {
		ship.eboltEffectTimer += system_tick();     
		// Yank the ship every 0.1 seconds
		if (ship.eboltEffectTimer > 0.1) {
			ship.eboltEffectTimer -= 0.1;
			if (ship.currentView == SHIP_VIEW_INTERNAL) {
				cameraSetShake(camera, CAMERA_SHAKE_SHORT);
			}
			ship.angularVelocity.y += THREE.MathUtils.randFloat(-0.5, 0.5);

			if (THREE.MathUtils.randInt(0, 10) == 0) { // approx once per second
				ship.thrustMag *= 0.75;
			}
		}
	}

	ship.angularAcceleration.x += input_state(A_DOWN) * SHIP_PITCH_ACCEL;
	ship.angularAcceleration.x -= input_state(A_UP) * SHIP_PITCH_ACCEL;

	// Handle Stall
	if (ship.updateTimer > 0) {
		if (ship.currentThrustMax < 500) {
			ship.currentThrustMax += THREE.MathUtils.randFloat(0, 165) * system_tick();
		}
		ship.updateTimer -= system_tick();
	}
	else {
		// End stall / boost
		ship.currentThrustMax = ship.thrustMax;
	}

	// Thrust
	if (input_state(A_THRUST)) {
		ship.thrustMag += input_state(A_THRUST) * SHIP_THRUST_RATE * system_tick();
	}
	else {
		ship.thrustMag -= SHIP_THRUST_FALLOFF * system_tick();
	}
	ship.thrustMag = THREE.MathUtils.clamp(ship.thrustMag, 0, ship.currentThrustMax );

	// Brake
	if (input_state(A_BRAKE_RIGHT))	{
		ship.brakeRight += SHIP_BRAKE_RATE * system_tick();
	}
	else if (ship.brakeRight > 0) {
		ship.brakeRight -= SHIP_BRAKE_RATE * system_tick();
	}
	ship.brakeRight = THREE.MathUtils.clamp(ship.brakeRight, 0, 256);

	if (input_state(A_BRAKE_LEFT))	{
		ship.brakeLeft += SHIP_BRAKE_RATE * system_tick();
	}
	else if (ship.brakeLeft > 0) {
		ship.brakeLeft -= SHIP_BRAKE_RATE * system_tick();
	}
	ship.brakeLeft = THREE.MathUtils.clamp(ship.brakeLeft , 0, 256);

	// View
	if (input_pressed(A_CHANGE_VIEW)) {
		if (ship.currentView !== SHIP_VIEW_INTERNAL) {			
			cameraSet(SHIP_VIEW_INTERNAL);
            ship.currentView = SHIP_VIEW_INTERNAL;
		}
		else {
			cameraSet(SHIP_VIEW_EXTERNAL);
            ship.currentView = SHIP_VIEW_EXTERNAL;
		}
	}

	if (ship.weaponType == WEAPON_TYPE_MISSILE || ship.weaponType == WEAPON_TYPE_EBOLT) {
		ship.weaponTarget = ship_player_find_target(ship);
	}
	else {
		ship.weaponTarget = NULL;
	}

	if (input_pressed(A_FIRE) && ship.weaponType != WEAPON_TYPE_NONE) {
		if (flags_not(ship.flags, SHIP_SHIELDED)) {
			weapons_fire(ship, ship.weaponType, ship.weaponTarget);
		}
		else {
			RaceAudio.sfx_play(SFX_MENU_MOVE);
		}
	}
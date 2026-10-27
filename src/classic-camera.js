import * as THREE from 'three';

// camera_update_race_external/internal in the supplied C reference: anchor
// behind the ship, follow heading without hull roll, damp correction toward the
// road. Store correction in the local road frame to stay safe through loops.
export const CLASSIC_CAMERA = Object.freeze({ distance: 6.5, height: 1.55,
  correctionAcceleration: 0.46875, correctionDamping: 3.75, cockpitRoll: 0.2 });

export function createClassicCamera() {
  const correction = new THREE.Vector2();
  let initialized = false, previousSerial = -1, previousMode = '';
  return {
    reset() { initialized = false; correction.set(0, 0); },
    update(camera, position, frame, ship, dt, mode = 'external', serial = 0) {
      const t = CLASSIC_CAMERA;
      const snap = !initialized || serial !== previousSerial || mode !== previousMode;
      if (snap) correction.set(0, 0);
      const attitude = frame.rotation.clone()
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ship.flight ? 0 : ship.yaw))
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ship.flight ? 0 : ship.pitch));
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(attitude);
      const up = frame.normal.clone();
      const internal = mode === 'internal' || mode === 'cockpit';
      if (internal) {
        camera.position.copy(position).addScaledVector(frame.normal, 0.65).addScaledVector(forward, 0.7);
        up.applyAxisAngle(forward, ship.roll * 2 * t.cockpitRoll);
      } else {
        const anchor = position.clone().addScaledVector(forward, -t.distance).addScaledVector(frame.normal, t.height);
        const relative = anchor.clone().sub(frame.center);
        const sideways = relative.dot(frame.right), height = relative.dot(frame.normal);
        // Exact damped integration under constant acceleration: frame-rate safe.
        if (dt > 0) {
          const decay = Math.exp(-t.correctionDamping * dt);
          const gain = (1 - decay) * t.correctionAcceleration / t.correctionDamping;
          correction.x = correction.x * decay - sideways * gain;
          correction.y = correction.y * decay - (height + Math.hypot(sideways, height) * 0.5) * gain;
          correction.clamp(new THREE.Vector2(-1.5, -0.7), new THREE.Vector2(1.5, 0.7));
        }
        camera.position.copy(anchor).addScaledVector(frame.right, correction.x).addScaledVector(frame.normal, correction.y);
        // Heading/pitch cannot bury the low chase camera in the road on braking.
        const clearance = camera.position.clone().sub(frame.center).dot(frame.normal);
        if (clearance < 1) camera.position.addScaledVector(frame.normal, 1 - clearance);
      }
      camera.up.copy(up);
      camera.lookAt(camera.position.clone().addScaledVector(forward, 20));
      initialized = true; previousSerial = serial; previousMode = mode;
    },
  };
}

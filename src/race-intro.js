import * as THREE from 'three';

export const INTRO_DURATION = 3.2;
const smooth = t => t * t * (3 - 2 * t);

// Presentation only. The caller supplies the live chase pose as the destination.
// Restore that pose before the next camera update so smoothing never feeds back
// the cinematic camera into the driving camera.
export function createRaceIntro() {
  let elapsed = 0, active = false, skip = false, restore = false;
  const chasePosition = new THREE.Vector3();
  const chaseRotation = new THREE.Quaternion();
  const chaseUp = new THREE.Vector3();
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  return {
    get elapsed() { return elapsed; },
    start(reducedMotion = false) { elapsed = 0; active = true; skip = reducedMotion; restore = false; },
    skip() { if (active) skip = true; },
    restore(camera) {
      if (!restore) return;
      camera.position.copy(chasePosition); camera.quaternion.copy(chaseRotation); camera.up.copy(chaseUp);
      restore = false;
    },
    update(camera, craftPosition, frame, dt) {
      if (!active) return false;
      elapsed = skip ? INTRO_DURATION : Math.min(INTRO_DURATION, elapsed + Math.max(0, dt));
      if (elapsed >= INTRO_DURATION) { active = false; return true; }
      chasePosition.copy(camera.position); chaseRotation.copy(camera.quaternion); chaseUp.copy(camera.up);
      const t = elapsed / INTRO_DURATION;
      const angle = THREE.MathUtils.lerp(1.05, 0, smooth(Math.min(1, t / 0.7)));
      position.copy(craftPosition).addScaledVector(frame.right, Math.sin(angle) * 4)
        .addScaledVector(frame.tangent, -Math.cos(angle) * 8)
        .addScaledVector(frame.normal, THREE.MathUtils.lerp(3.8, 2.8, t));
      target.copy(craftPosition).addScaledVector(frame.normal, 0.25);
      rotation.setFromRotationMatrix(matrix.lookAt(position, target, frame.normal));
      const blend = smooth(THREE.MathUtils.clamp((t - 0.4) / 0.6, 0, 1));
      camera.position.copy(position).lerp(chasePosition, blend);
      camera.quaternion.copy(rotation).slerp(chaseRotation, blend);
      camera.up.copy(frame.normal).lerp(chaseUp, blend).normalize();
      restore = true;
      return false;
    },
  };
}

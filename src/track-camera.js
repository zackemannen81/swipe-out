import * as THREE from 'three';

// Follow the craft's position directly and damp the local camera offset/rotation.
// World-position lag at racing speed otherwise pulls a camera through a loop.
export function createTrackCamera() {
  let initialized = false, previousSerial = -1, previousMode = '', angle = 0;
  const offset = new THREE.Vector3();
  return {
    reset() { initialized = false; angle = 0; },
    update(camera, position, frame, dt, mode = 'external', serial = 0) {
      let targetOffset = frame.normal.clone().multiplyScalar(mode === 'wipeoutStyle' ? 2.4 : 3.3)
        .addScaledVector(frame.tangent, mode === 'wipeoutStyle' ? -6.5 : -7);
      let target = position.clone().addScaledVector(frame.tangent, 8).addScaledVector(frame.normal, 0.3);
      if (mode === 'internal' || mode === 'cockpit') {
        targetOffset = frame.normal.clone().multiplyScalar(0.7).addScaledVector(frame.tangent, 0.8);
      } else if (mode === 'circle') {
        angle += dt * 0.55;
        targetOffset = frame.right.clone().multiplyScalar(Math.sin(angle) * 10)
          .addScaledVector(frame.tangent, -Math.cos(angle) * 10).addScaledVector(frame.normal, 3.5);
        target = position.clone().addScaledVector(frame.normal, 0.5);
      } else if (mode === 'static') {
        targetOffset = frame.right.clone().multiplyScalar(10).addScaledVector(frame.normal, 3);
        target = position.clone();
      }
      const snap = !initialized || serial !== previousSerial || mode !== previousMode;
      if (snap) offset.copy(targetOffset); else offset.lerp(targetOffset, 1 - Math.exp(-12 * dt));
      camera.position.copy(position).add(offset);
      camera.up.copy(frame.normal);
      const orientation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position, target, frame.normal));
      if (snap) camera.quaternion.copy(orientation); else camera.quaternion.slerp(orientation, 1 - Math.exp(-18 * dt));
      initialized = true; previousSerial = serial; previousMode = mode;
    },
  };
}

import * as THREE from 'three';

// Legacy-like spring follow, with bounded lag and local road clearance for loops.
// The road's up direction is filtered independently instead of snapping each frame.
export function createTrackCamera() {
  let initialized=false, previousSerial=-1, previousMode='', angle=0;
  const followPosition=new THREE.Vector3(), roadRotation=new THREE.Quaternion();
  return {
    reset(){initialized=false;angle=0;},
    update(camera, position, frame, dt, mode='external', serial=0, craftRotation=frame.rotation) {
      const snap=!initialized || serial!==previousSerial || mode!==previousMode;
      if(snap)roadRotation.copy(frame.rotation);
      else roadRotation.slerp(frame.rotation,1-Math.exp(-8*Math.max(0,dt)));
      const up=new THREE.Vector3(0,1,0).applyQuaternion(roadRotation);
      const forward=new THREE.Vector3(0,0,1).applyQuaternion(craftRotation);
      const internal=mode==='internal'||mode==='cockpit';
      let offset=new THREE.Vector3(0,mode==='wipeoutStyle'?2.8:4.6,mode==='wipeoutStyle'?-6.5:-4.8).applyQuaternion(craftRotation);
      let target=position.clone().addScaledVector(forward,8).addScaledVector(up,.3);
      if(internal)offset=up.clone().multiplyScalar(.65).addScaledVector(forward,.7);
      else if(mode==='circle'){
        angle+=dt*.55;offset=frame.right.clone().multiplyScalar(Math.sin(angle)*10).addScaledVector(frame.tangent,-Math.cos(angle)*10).addScaledVector(up,3.5);target=position.clone();
      }else if(mode==='static'){offset=frame.right.clone().multiplyScalar(10).addScaledVector(up,3);target=position.clone();}
      const desired=position.clone().add(offset);
      if(snap||internal||mode==='circle'||mode==='static')followPosition.copy(desired);
      else followPosition.lerp(desired,1-Math.exp(-5.5*Math.max(0,dt)));
      // World lag feels less rigid, but may not trail through the road on loops.
      const relative=followPosition.clone().sub(position).clampLength(0,14);
      if(!internal){const clearance=relative.dot(frame.normal);if(clearance<1.6)relative.addScaledVector(frame.normal,1.6-clearance);}
      followPosition.copy(position).add(relative);camera.position.copy(followPosition);camera.up.copy(up);
      const orientation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position,target,up));
      if(snap||internal)camera.quaternion.copy(orientation);else camera.quaternion.slerp(orientation,1-Math.exp(-10*Math.max(0,dt)));
      initialized=true;previousSerial=serial;previousMode=mode;
    },
  };
}

import * as THREE from 'three';
import { ghostPose } from './time-attack.js';

export function createLapGhost(scene,craft) {
  const group=craft.clone(true);
  const material=new THREE.MeshBasicMaterial({color:0xaab9ff,transparent:true,opacity:0.24,
    depthWrite:false,toneMapped:false});
  group.traverse(child=>{if(child.isMesh)child.material=material;});
  group.name='personal-best-ghost';group.visible=false;scene.add(group);
  return {group,update(record,time,playerPosition,enabled) {
    const pose=enabled?ghostPose(record,time):null;
    group.visible=!!pose;
    if(!pose)return;
    group.position.copy(pose.position);group.quaternion.copy(pose.quaternion);
    // Fade at overlap so a tied PB never obscures the player's cockpit.
    material.opacity=THREE.MathUtils.smoothstep(group.position.distanceTo(playerPosition),0.6,4)*0.28;
  },dispose(){scene.remove(group);material.dispose();}}; // Shared craft geometry stays owned by craft.
}

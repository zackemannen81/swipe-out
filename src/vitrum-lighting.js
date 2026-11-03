import * as THREE from 'three';
import {getTrackFrame} from './track-path.js';

// World-fixed light pools follow edited routes without rewriting saved objects.
export function createVitrumLighting(curve) {
  const group=new THREE.Group();group.name='vitrumLocalLights';
  const stations=[.015,.09,.155,.23,.30,.365,.43,.51,.59,.675,.75,.85,.94];
  stations.forEach((u,i)=>{
    const f=getTrackFrame(curve,u),side=i%2?1:-1;
    const light=new THREE.PointLight(i===5||i===8?0x79d9bf:0xffbc68,850,240,2);
    light.name='Vitrum pool '+(i+1);
    light.position.copy(f.center).addScaledVector(f.right,side*35).addScaledVector(f.normal,24);
    light.castShadow=false;group.add(light);
  });
  return group;
}


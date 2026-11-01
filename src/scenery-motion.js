import * as THREE from 'three';

export function bindScenery(object, data) {
  object.userData.scenery={data,position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()};
}
// Absolute time prevents drift and makes editor preview restart at the saved pose.
export function updateScenery(scene, time, {preview=true, helpers=false}={}) {
  const group=scene.getObjectByName('customTrackObjects');
  if(!group)return;
  const t=preview?time:0;
  for(const object of group.children){
    const state=object.userData.scenery;if(!state)continue;
    const {data,position,rotation,scale}=state;
    object.position.copy(position);object.rotation.copy(rotation);object.scale.copy(scale);
    const m=data.motion;
    if(m && m.type!=='none'){
      const angle=t/m.period*Math.PI*2, axis=m.axis;
      if(m.type==='spin')object.rotation[axis]+=angle;
      if(m.type==='shuttle')object.position[axis]+=Math.sin(angle)*m.distance;
      if(m.type==='orbit'){
        const [a,b]=axis==='x'?['y','z']:axis==='z'?['x','y']:['x','z'];
        object.position[a]+=(Math.cos(angle)-1)*m.distance;
        object.position[b]+=Math.sin(angle)*m.distance;
      }
    }
    if(data.animType==='pulse')object.scale.multiplyScalar(1+Math.sin(t*3.5)*.15);
    if(object.material?.map && data.animType?.startsWith('scroll-'))object.material.map.offset[data.animType==='scroll-x'?'x':'y']=-t*.6%1;
    if(object.userData.light){
      object.userData.light.intensity=(data.lightIntensity??100)*(data.animType==='pulse'?(1+Math.sin(t*3.5))*.5:1);
      object.userData.marker.visible=helpers;
    }
    if(object.userData.mixer)object.userData.mixer.setTime(t*(data.clipSpeed??1));
  }
}

import * as T from 'three';
import {createTrackCamera} from '../src/track-camera.js';
const frame={center:new T.Vector3(),normal:new T.Vector3(0,1,0),right:new T.Vector3(1,0,0),tangent:new T.Vector3(0,0,1),rotation:new T.Quaternion()};
for(const speed of [140,220]){
 const follow=createTrackCamera(),camera=new T.PerspectiveCamera(65,2,0.1,1000);let z=0,prev=0,max=0;
 for(let i=0;i<600;i++) {const dt=i%60===0?.05:1/60;z+=speed*dt;const p=new T.Vector3(0,.62,z);frame.center.set(0,0,z);follow.update(camera,p,frame,dt,'wipeoutStyle');camera.updateMatrixWorld();const y=p.clone().project(camera).y;if(i>100)max=Math.max(max,Math.abs(y-prev));if(i>=178&&i<=182) console.log(speed,i,y,camera.position.clone().sub(p).toArray());prev=y;}console.log('max projected jump',speed,max);
}

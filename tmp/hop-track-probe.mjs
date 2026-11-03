import * as T from 'three';
import {createTrackCamera} from '../src/track-camera.js';
import {createTrackCurve,getTrackFrame} from '../src/track-path.js';
import {VITRUM} from '../src/track-vitrum.js';
const curve=createTrackCurve(VITRUM),speed=240;
for(const hz of [30,60,120]){
const follow=createTrackCamera(),camera=new T.PerspectiveCamera(65,2,.1,10000);let prev=0,deltaPrev=0;const jumps=[];
for(let t=0;t<curve.getLength()/speed;t+=1/hz){let f=getTrackFrame(curve,t*speed/curve.getLength()),p=f.center.clone().addScaledVector(f.normal,.62);follow.update(camera,p,f,1/hz,'wipeoutStyle');camera.updateMatrixWorld();let y=p.clone().project(camera).y,d=y-prev;if(t>1)jumps.push({t,dy:d,jerk:Math.abs(d-deltaPrev),height:camera.position.clone().sub(p).dot(f.normal)});prev=y;deltaPrev=d;}
console.log(hz,jumps.sort((a,b)=>b.jerk-a.jerk).slice(0,3));
}

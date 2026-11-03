import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTrackCamera} from '../src/track-camera.js';
import {createTrackCurve,getTrackFrame} from '../src/track-path.js';
import {VITRUM} from '../src/track-vitrum.js';

test('Swipeout chase does not kick a surface-bound hull vertically on Vitrum rises',()=>{
  const curve=createTrackCurve(VITRUM), speed=240;
  for(const hz of [30,60,120]){
    const camera=new THREE.PerspectiveCamera(65,2,.1,10000),follow=createTrackCamera();
    let previousY=0,previousDelta=0,maxKick=0;
    for(let i=0;i<Math.ceil(curve.getLength()/speed*hz);i++){
      const frame=getTrackFrame(curve,i/hz*speed/curve.getLength());
      const position=frame.center.clone().addScaledVector(frame.normal,.62);
      follow.update(camera,position,frame,1/hz,'wipeoutStyle');
      camera.updateMatrixWorld();
      const y=position.clone().project(camera).y, delta=y-previousY;
      if(i>hz)maxKick=Math.max(maxKick,Math.abs(delta-previousDelta));
      assert.ok(camera.position.clone().sub(position).dot(frame.normal)>=1.6-1e-8);
      assert.ok(camera.position.distanceTo(position)<=14+1e-8);
      previousY=y;previousDelta=delta;
    }
    // Less than one pixel change in vertical frame-to-frame motion at 1080p.
    // Before the fix this reached 5.5 px at 60Hz without any ship physics.
    assert.ok(maxKick<1/540,`${hz}Hz vertical kick: ${maxKick*540}px`);
  }
});

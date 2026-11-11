import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrack,disposeTrackGroup} from '../src/track.js';
import {BUILTIN_TRACKS} from '../src/track-library.js';
import {updateAmbientParticles} from '../src/ambient-particles.js';

test('authored destinations select one particle system and dispose all particle resources',()=>{
 for(const key of ['track1','track19','track20','track21']){
  const {group}=createTrack(BUILTIN_TRACKS[key].data);
  const ambient=group.getObjectByName('AmbientParticles'),spores=group.getObjectByName('vitrumSpores');
  assert.equal(!!ambient,key!=='track20');assert.equal(!!spores,key==='track20');
  const particles=ambient??spores;
  assert.equal(particles.children.length,3);
  const bases=particles.children.map(p=>p.geometry.attributes.position.array.slice());
  if(ambient){
   updateAmbientParticles(group,10,320);updateAmbientParticles(group,10,320);
   ambient.children.forEach((p,i)=>{assert.equal(p.material.uniforms.time.value,10);assert.equal(p.material.uniforms.speed.value,320);assert.deepEqual(p.geometry.attributes.position.array,bases[i]);assert.ok([...bases[i]].every(Number.isFinite));});
   updateAmbientParticles(group,0,-1);assert.equal(ambient.children[0].material.uniforms.speed.value,0);
  }
  let disposed=0;particles.children.forEach(p=>{p.geometry.addEventListener('dispose',()=>disposed++);p.material.addEventListener('dispose',()=>disposed++);});
  disposeTrackGroup(group);assert.equal(disposed,6);
 }
});

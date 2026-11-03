import test from 'node:test';
import assert from 'node:assert/strict';
import {createVitrumSpores,updateVitrumSpores} from '../src/vitrum-spores.js';
import {createTrackCurve} from '../src/track-path.js';
import {VITRUM} from '../src/track-vitrum.js';
import {disposeTrackGroup} from '../src/track.js';
test('spores have bounded deterministic batches, immutable bases and pauseable uniforms',()=>{
 const curve=createTrackCurve(VITRUM),g=createVitrumSpores(curve),other=createVitrumSpores(curve);
 assert.deepEqual(g.children.map(p=>p.geometry.attributes.position.count),[5200,650,350]);
 const bases=g.children[0].geometry.attributes.position.array.slice();
 assert.deepEqual(bases,other.children[0].geometry.attributes.position.array);
 updateVitrumSpores(g,12,320);updateVitrumSpores(g,12,320);
 for(const p of g.children){assert.equal(p.material.uniforms.time.value,12);assert.equal(p.material.uniforms.speed.value,320);assert.equal(p.material.depthWrite,false);assert.ok(p.material.depthTest);assert.ok([...p.geometry.attributes.position.array].every(Number.isFinite));}
 assert.deepEqual(g.children[0].geometry.attributes.position.array,bases);
 updateVitrumSpores(g,12,0);assert.equal(g.children[2].material.uniforms.speed.value,0);
 let disposed=0;g.children.forEach(p=>p.material.addEventListener('dispose',()=>disposed++));disposeTrackGroup(g);assert.equal(disposed,3);disposeTrackGroup(other);
});

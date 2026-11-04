import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createVitrumRoad} from '../src/VitrumRoadMaterial.js';

const road = createVitrumRoad({width:2048,height:2048,roots:32,seed:1981,roadUvRepeats:350});
const shader = {
  uniforms: {},
  vertexShader: THREE.ShaderLib.physical.vertexShader,
  fragmentShader: THREE.ShaderLib.physical.fragmentShader,
};
road.material.onBeforeCompile(shader);
const code = shader.fragmentShader;
assert.ok(code.indexOf('vec4 network = texture2D') >= 0);
assert.ok(code.indexOf('float phaseOffset = network.b') > code.indexOf('vec4 network = texture2D'));
assert.ok(!code.includes('network.g * 5.0'));
assert.ok(code.includes('totalEmissiveRadiance += vitrumEmission'));
const pixels = road.textures.veins.image.data;
const counts = Array(16).fill(0);
for(let y=0;y<2048;y+=4) for(let x=0;x<2048;x+=4) {
  if(pixels[(y*2048+x)*4] > 25) counts[Math.floor(y/128)]++;
}
console.log('Band coverage:', counts.join(', '));
console.log('Minimum:',Math.min(...counts),'Maximum:',Math.max(...counts));
assert.ok(counts.every(x=>x>0), 'Empty band in vein texture');
road.update(10);
assert.equal(road.uniforms.uVitrumTime.value,10);
road.dispose();
console.log('VITRUM_FLOW_FIX_OK');

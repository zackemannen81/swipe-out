import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createVitrumDeckMaterial} from '../src/vitrum-deck.js';

const material = createVitrumDeckMaterial(340);
const road = material.userData.vitrumRoad;
assert.equal(material.side, THREE.DoubleSide);
assert.equal(material.vertexColors, true);
assert.equal(road.textures.veins.wrapT, THREE.MirroredRepeatWrapping);
assert.equal(road.uniforms.uVitrumVeinUvScale.value, 68 / 340);
const shader = {
  uniforms: {},
  vertexShader: THREE.ShaderLib.physical.vertexShader,
  fragmentShader: THREE.ShaderLib.physical.fragmentShader,
};
material.onBeforeCompile(shader);
assert.match(shader.vertexShader, /vVitrumUv = uv/);
assert.match(shader.fragmentShader, /vec2 veinUv = vec2\(vVitrumUv.y/);
assert.match(shader.fragmentShader, /totalEmissiveRadiance \+= vitrumEmission/);
assert.ok(shader.uniforms.uVitrumVeins.value.isDataTexture);
road.update(9.5);
assert.equal(road.uniforms.uVitrumTime.value, 9.5);
road.dispose();
console.log('VITRUM_SHADER_SMOKE_OK');

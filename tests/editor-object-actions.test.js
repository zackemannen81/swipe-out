import test from 'node:test';
import assert from 'node:assert/strict';
import { selectedObjectIndexes, copySceneObjects, createPastedObjects, withoutSceneObjects } from '../src/editor-object-actions.js';

const source = [
  {id:'first',type:'box',position:[1,2,3],scale:[3,4,5],rotation:[0,30,0],texture:'https://example.com/texture.png'},
  {id:'second',type:'glb',position:[8,9,10],scale:[1,1,1],rotation:[0,0,0],model:'/models/one.glb'},
  {id:'third',type:'sphere',position:[-4,5,6],scale:[1,1,1],rotation:[0,0,0]}
];

test('multi-select is sorted and excludes stale indexes', () => {
  assert.deepEqual(selectedObjectIndexes({kind:'object',index:2},new Set([1,99,2,-1]),3),[1,2]);
  assert.deepEqual(selectedObjectIndexes({kind:'point',index:0},new Set(),3),[]);
});

test('multi-copy and paste preserve exact transforms while giving unique IDs', () => {
  const clipboard=copySceneObjects(source,[0,2]);
  source[0].position[0]=999;
  const pasted=createPastedObjects(source,clipboard,(()=>{let i=0;return ()=>`paste-${++i}`;})());
  assert.deepEqual(pasted.map(o=>o.position),[[1,2,3],[-4,5,6]]);
  assert.deepEqual(pasted.map(o=>o.id),['paste-1','paste-2']);
  assert.deepEqual(pasted[0].rotation,[0,30,0]);
  assert.equal(pasted[0].texture,'https://example.com/texture.png');
  assert.deepEqual(withoutSceneObjects(source,[0,2]),[source[1]]);
});

test('paste rejects object and point light capacity overflow', () => {
  const light={type:'light',position:[0,0,0]};
  assert.throws(()=>createPastedObjects(Array(16).fill(light),[light],()=> 'x'),/16 point lights/);
  assert.throws(()=>createPastedObjects(Array(1024).fill(source[0]),[source[0]],()=> 'x'),/1,024/);
});

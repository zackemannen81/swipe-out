import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {VITRUM} from '../src/track-vitrum.js';
import {createTrackCurve,getTrackFrame} from '../src/track-path.js';
import {createTrack,disposeTrackGroup} from '../src/track.js';
import {FOREST_SCREEN_IMAGES,FOREST_SCREEN_LAYERS,layoutVitrumForestScreen,distanceToForestCard,createVitrumForestScreen} from '../src/vitrum-forest-screen.js';

test('forest cutouts ship as real RGBA PNGs and use five instanced depth layers',()=>{
 for(const path of Object.values(FOREST_SCREEN_IMAGES)){
  const b=readFileSync(new URL('../public'+path,import.meta.url));
  assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),1536);assert.equal(b.readUInt32BE(20),1024);assert.equal(b[25],6,'RGBA PNG');
 }
 const group=createVitrumForestScreen(createTrackCurve(VITRUM));
 assert.equal(group.children.length,5);assert.ok(group.userData.cardCount>1200);
 const matrix=new THREE.Matrix4();
 for(const mesh of group.children){
  assert.ok(mesh.isInstancedMesh);assert.ok(mesh.material.alphaTest>0);assert.equal(mesh.material.transparent,false);
  for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.determinant()>0);}
 }
 disposeTrackGroup(group);
});

test('full forest/curtain rectangles leave racing and camera space clear around the lap',()=>{
 const curve=createTrackCurve(VITRUM),layout=layoutVitrumForestScreen(curve);
 let nearest=Infinity;
 for(let i=0;i<1200;i++){
  const frame=getTrackFrame(curve,i/1200),point=frame.center.clone().addScaledVector(frame.normal,4);
  for(const card of layout.cards){
   const bound=Math.hypot(card.width,card.height)/2+26;
   if(point.distanceToSquared(new THREE.Vector3(...card.position))>bound*bound)continue;
   nearest=Math.min(nearest,distanceToForestCard(point,card));
  }
 }
 assert.ok(nearest>25,`nearest whole image plane: ${nearest}`);
});

test('world-fixed forest layers produce different parallax and adapt to edited routes',()=>{
 const curve=createTrackCurve(VITRUM),layout=layoutVitrumForestScreen(curve);
 const origin=new THREE.Vector3(layout.center[0],180,layout.center[2]);
 const shift=card=>{
  const point=new THREE.Vector3(...card.position);point.y=origin.y;
  const local=new THREE.PerspectiveCamera(55,1.5,.1,5000);local.position.copy(origin);local.lookAt(point);local.updateMatrixWorld();
  const before=point.clone().project(local);
  local.position.add(new THREE.Vector3(1,0,0).applyQuaternion(local.quaternion).multiplyScalar(50));local.updateMatrixWorld();
  return Math.abs(point.clone().project(local).x-before.x);
 };
 const near=layout.cards.find(c=>c.layer===FOREST_SCREEN_LAYERS[0].name);
 const far=layout.cards.find(c=>c.layer===FOREST_SCREEN_LAYERS[2].name);
 assert.ok(shift(near)>shift(far)*1.3);
 const edited=structuredClone(VITRUM);edited.centerline.forEach(p=>{p[0]+=500;p[2]-=250;});
 const moved=layoutVitrumForestScreen(createTrackCurve(edited));
 assert.ok(Math.abs(moved.center[0]-layout.center[0]-500)<.001);
 assert.ok(Math.abs(moved.center[2]-layout.center[2]+250)<.001);
 assert.deepEqual(edited.objects,VITRUM.objects,'layout must not rewrite saved objects');
});

test('screen is Vitrum-only and its shared resources are released once on track disposal',()=>{
 const {group}=createTrack(VITRUM),screen=group.getObjectByName('vitrumForestScreen');assert.ok(screen);
 let geometryDisposals=0,materialDisposals=0;
 screen.children[0].geometry.addEventListener('dispose',()=>geometryDisposals++);
 screen.children.forEach(m=>m.material.addEventListener('dispose',()=>materialDisposals++));
 disposeTrackGroup(group);assert.equal(geometryDisposals,1);assert.equal(materialDisposals,5);
 const ordinary=createTrack({...VITRUM,id:'another-world'});assert.equal(ordinary.group.getObjectByName('vitrumForestScreen'),undefined);disposeTrackGroup(ordinary.group);
});

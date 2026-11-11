import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTourBusScene,TOUR_VIEWS} from '../src/tour-bus.js';
import {OBSERVATION_ORIGIN,OBSERVATION_SLOTS} from '../src/tour-observation.js';
test('observation has owned finite geometry, clear camera sightline and grounded replaceable slots',()=>{
 const hub=createTourBusScene();hub.setView('observation',true);hub.scene.updateMatrixWorld(true);
 const objects=hub.registry.filter(r=>r.zoneId==='06'&& !['planet','moon'].includes(r.kind));
 const ray=new THREE.Raycaster(hub.camera.position,new THREE.Vector3(...TOUR_VIEWS.observation.target).sub(hub.camera.position).normalize(),0,50);
 assert.deepEqual(ray.intersectObjects(objects.map(r=>r.group),true),[],'Architecture must not block the centre of the panorama');
 for(const slot of OBSERVATION_SLOTS){const g=hub.scene.getObjectByName(slot.id),bounds=new THREE.Box3().setFromObject(g);
  assert.equal(g.userData.zoneId,'06');assert.ok(Math.abs(bounds.min.y-OBSERVATION_ORIGIN[1])<.02);assert.ok(bounds.min.z>=-17&&bounds.max.z<=17);
 }
 const geos=new Set(),mats=new Set();for(const row of objects)row.group.traverse(o=>{if(o.geometry){geos.add(o.geometry);assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));}if(o.material)for(const m of [].concat(o.material))mats.add(m);});
 let released=0;for(const g of geos)g.addEventListener('dispose',()=>released++);hub.dispose();assert.equal(released,geos.size);
});

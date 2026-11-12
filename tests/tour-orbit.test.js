import test from 'node:test';
import assert from 'node:assert/strict';
import {createTourBusScene} from '../src/tour-bus.js';
test('orbital traffic stays outside carrier, freezes with reduced motion and owns atmosphere disposal',()=>{
 const hub=createTourBusScene();hub.setView('observation',true);
 const ships=hub.registry.filter(r=>r.kind==='orbital-traffic').map(r=>r.group);
 assert.equal(ships.length,3);const before=ships.map(g=>g.position.clone());
 hub.update(10,false);ships.forEach((g,i)=>assert.ok(g.position.equals(before[i])));
 hub.update(10,true);assert.ok(ships.some((g,i)=>!g.position.equals(before[i])));
 for(let n=0;n<100;n++){hub.update(10,true);for(const g of ships){assert.ok(g.position.x<-110);assert.ok(g.position.y>32);}}
 const atmosphere=hub.scene.getObjectByName('tour-atmosphere');let freed=0;
 atmosphere.material.addEventListener('dispose',()=>freed++);
 hub.setWorld('vitrum');assert.equal(atmosphere.material.uniforms.tint.value.getHex(),0x74eec9);
 hub.setView('hangar',true);assert.ok(ships.every(g=>!g.visible));hub.dispose();assert.equal(freed,1);
});

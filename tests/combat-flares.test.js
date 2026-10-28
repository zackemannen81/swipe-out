import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCombat,createCombatView,FLARES,COMBAT} from '../src/combat.js';
import {createTrackCurve,getRacerFrame} from '../src/track-path.js';
import {createShipPhysics} from '../src/ship-physics.js';
import {COMBAT_LAB} from '../src/track-labs.js';
function setup(player=true,type='homing') {
 const curve=createTrackCurve(COMBAT_LAB);
 const racers=[0,1].map(i=>{const physics=createShipPhysics(100);physics.distance=curve.getLength()*.16+i*60;
 const frame=getRacerFrame(curve,physics),group=new THREE.Group();group.position.copy(frame.center).addScaledVector(frame.normal,.62);physics.previousPosition.copy(group.position);
 return {id:i?'defender':'attacker',player:i?player:false,physics,group,frame};});
 const combat=createCombat();combat.reset(true,racers);for(const s of combat.states.values())s.aiTimer=999;
 const p={id:1,owner:'attacker',type,target:type==='homing'?'defender':null,position:racers[0].group.position.clone().addScaledVector(racers[0].frame.normal,.6),velocity:racers[0].frame.tangent.clone().multiplyScalar(220),speed:220,life:3};combat.projectiles.push(p);
 return {combat,curve,racers,p,state:combat.states.get('defender')};
}
function run(a,seconds,hz=120,options={}){for(let i=0;i<Math.round(seconds*hz);i++)a.combat.step(1/hz,a.racers,a.curve,options);}
test('X/touch request deflects homing at 30/60/120 Hz without damage; same cooldown',()=>{
 for(const hz of [30,60,120]){const a=setup();a.combat.step(1/hz,a.racers,a.curve,{flares:true});
 assert.equal(a.state.flareUses,1);assert.equal(a.state.deflected,1);assert.equal(a.p.target,null);assert.ok(a.p.decoy);
 run(a,1,hz);assert.equal(a.state.hitsTaken,0);assert.equal(a.racers[1].physics.speed,100);assert.ok(a.state.flareCooldown>23);
 assert.equal(a.combat.deployFlares(a.racers[1],a.curve),false);run(a,25,hz);assert.equal(a.state.flareCooldown,0);
 assert.equal(a.combat.deployFlares(a.racers[1],a.curve),true);assert.equal(a.state.flareUses,2);}
});
test('CPU uses same flare window, cooldown and homing-only rules',()=>{
 const cpu=setup(false);run(cpu,.05);assert.equal(cpu.state.flareUses,1);assert.equal(cpu.state.deflected,1);assert.ok(cpu.state.flareCooldown<=FLARES.cooldown);assert.ok(cpu.state.flareTime<=FLARES.duration);
 for(const type of ['rocket','minigun']) {const a=setup(true,type);a.combat.step(1/120,a.racers,a.curve,{flares:true});run(a,.5);assert.equal(a.state.deflected,0);assert.equal(a.state.hitsTaken,1);}
 const early=setup();early.combat.projectiles=[];early.combat.deployFlares(early.racers[1],early.curve);run(early,1.3);early.combat.projectiles.push(early.p);run(early,.5);assert.equal(early.state.hitsTaken,1);
});
test('pause, inactive, disabled, retry, recovery and finished eligibility',()=>{
 const a=setup();a.combat.step(1/120,a.racers,a.curve,{flares:true});const snapshot=JSON.stringify([...a.combat.states]);
 a.combat.step(0,a.racers,a.curve,{flares:true});assert.equal(JSON.stringify([...a.combat.states]),snapshot);
 a.combat.step(.5,a.racers,a.curve,{active:false,flares:true});assert.equal(a.combat.projectiles.length,0);assert.equal(a.combat.effects.length,0);
 a.combat.reset(false,a.racers);a.combat.step(.1,a.racers,a.curve,{flares:true});assert.equal(a.combat.states.get('defender').flareUses,0);
 a.combat.reset(true,a.racers);const s=a.combat.states.get('defender');assert.equal(s.flareCooldown,0);assert.equal(s.deflected,0);
 a.racers[1].physics.recoveryTimer=1;assert.equal(a.combat.deployFlares(a.racers[1],a.curve),false);
 a.racers[1].physics.recoveryTimer=0;a.racers[1].finished=true;assert.equal(a.combat.deployFlares(a.racers[1],a.curve),false);
});
test('impact/flare visuals are bounded, fade, expire and dispose',()=>{
 const a=setup(),scene=new THREE.Scene(),view=createCombatView(scene);
 for(let i=0;i<100;i++)a.combat.effect(new THREE.Vector3(),0xffcc44,1,i%2?'flare':'impact');
 assert.equal(a.combat.effects.length,COMBAT.maxEffects);view.update(a.combat);
 assert.ok(scene.children[0].children.every(mesh=>mesh.count<=COMBAT.maxEffects*24));
 run(a,2);view.update(a.combat);assert.equal(a.combat.effects.length,0);view.dispose();assert.equal(scene.children.length,0);
});

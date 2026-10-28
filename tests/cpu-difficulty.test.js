import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CPU_DIFFICULTIES, cpuDifficulty, loadCpuDifficulty, saveCpuDifficulty, shortcutChoice } from '../src/cpu-difficulty.js';
import { RACER_DEFINITIONS, createOpponentState, resetOpponents, updateOpponents } from '../src/opponents.js';
import { updateCatchUp } from '../src/catch-up.js';
import { ION_FOUNDRY } from '../src/track-foundry.js';
import { measureCpuRace } from '../tools/measure-cpu-difficulty.mjs';

test('difficulty settings survive reload and safely reject unavailable/corrupt storage',()=>{
  const values=new Map(), storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  assert.equal(loadCpuDifficulty(storage),'pilot');
  assert.equal(saveCpuDifficulty(storage,'elite'),true);
  assert.equal(loadCpuDifficulty(storage),'elite');
  for(const value of ['__proto__','bad',null,undefined])assert.equal(cpuDifficulty(value),'pilot');
  assert.equal(loadCpuDifficulty({getItem(){throw Error('blocked');}}),'pilot');
  assert.equal(saveCpuDifficulty({setItem(){throw Error('quota');}},'rookie'),false);
});

test('level reset retains tuned physical performance and freezes decisions when inactive',()=>{
  const curve={getLength:()=>10000,getPointAt:u=>new THREE.Vector3(0,0,u*10000),getTangentAt:()=>new THREE.Vector3(0,0,1)};
  const rivals=RACER_DEFINITIONS.map(d=>createOpponentState(d));
  for(const level of Object.keys(CPU_DIFFICULTIES)) {
    resetOpponents(rivals,level);
    rivals.forEach((r,i)=>{assert.equal(r.topSpeed,RACER_DEFINITIONS[i].topSpeed);assert.equal(r.acceleration,RACER_DEFINITIONS[i].acceleration);});
    const before=rivals.map(r=>[r.distance,r.mistakes,r.decisionTimer,r.nextMistake]);
    updateOpponents(rivals,curve,1,100,false);
    assert.deepEqual(rivals.map(r=>[r.distance,r.mistakes,r.decisionTimer,r.nextMistake]),before);
    updateOpponents(rivals,curve,0,100,true);
    assert.deepEqual(rivals.map(r=>[r.distance,r.mistakes,r.decisionTimer,r.nextMistake]),before);
    assert.ok(rivals.every(r=>r.difficulty===level&&r.physics.catchUpBonus===0));
  }
});

test('shortcut decisions reflect level and personality, are repeatable and vary by lap',()=>{
  const rate=(level,risk)=>{
    const r=createOpponentState({...RACER_DEFINITIONS[0],risk});resetOpponents([r],level);
    const choices=Array.from({length:100},(_,lap)=>shortcutChoice(r,lap));
    assert.deepEqual(choices,Array.from({length:100},(_,lap)=>shortcutChoice(r,lap)));
    return choices.filter(Boolean).length;
  };
  assert.ok(rate('rookie',0.5)<rate('pilot',0.5));
  assert.ok(rate('pilot',0.5)<rate('elite',0.5));
  for(const level of Object.keys(CPU_DIFFICULTIES))assert.ok(rate(level,0.15)<rate(level,0.85));
});

test('Elite catch-up is capped at 2% equally for player and CPU',()=>{
  for(const level of Object.keys(CPU_DIFFICULTIES)) {
    const racers=[1000,0,0].map(distance=>({physics:{distance,catchUpBonus:0},topSpeed:100,finished:false}));
    for(let i=0;i<600;i++)updateCatchUp(racers,1/60,10000,true,CPU_DIFFICULTIES[level].catchUp);
    assert.equal(racers[0].physics.catchUpBonus,0);
    assert.equal(racers[1].physics.catchUpBonus,racers[2].physics.catchUpBonus);
    assert.ok(Math.abs(racers[1].physics.catchUpBonus-CPU_DIFFICULTIES[level].catchUp)<0.0002);
  }
});

test('drivers wait behind blocked passing lanes and use a clear lane when available',()=>{
  const curve={getLength:()=>10000,getPointAt:u=>new THREE.Vector3(0,0,u*10000),getTangentAt:()=>new THREE.Vector3(0,0,1)};
  for(const level of Object.keys(CPU_DIFFICULTIES)) {
    const subject=createOpponentState({...RACER_DEFINITIONS[0],gridDistance:0,lane:0});
    resetOpponents([subject],level);
    const traffic=[0,-3,3].map((lane,i)=>({finishTime:null,physics:{distance:5+i,lateralOffset:lane,speed:40}}));
    updateOpponents([subject],curve,1/120,1/120,true,{player:traffic[0],trackWidth:10});
    assert.equal(subject.strategy,'overtake');
    // Put all other craft into the decision list without advancing their physics.
    const blockers=traffic.map((p,i)=>{const r=createOpponentState({...RACER_DEFINITIONS[i+1],gridDistance:p.physics.distance,lane:p.physics.lateralOffset});r.physics.speed=40;return r;});
    resetOpponents([subject],level);
    updateOpponents([subject,...blockers],curve,1/120,1/120,true,{trackWidth:10});
    assert.equal(subject.strategy,'follow');
    assert.ok(subject.trafficSpeedLimit<=40);
  }
});

test('all difficulties complete Foundry with jumps and boosts; Elite beats Rookie by driving',()=>{
  const results=Object.fromEntries(Object.keys(CPU_DIFFICULTIES).map(level=>[level,measureCpuRace(ION_FOUNDRY,level)]));
  for(const rows of Object.values(results))for(const r of rows){assert.ok(r.time!==null,JSON.stringify(r));assert.equal(r.laps.length,3);assert.ok(r.pads>0);}
  const mean=level=>results[level].reduce((n,r)=>n+r.time,0)/4;
  assert.ok(mean('elite')<mean('pilot'));
  assert.ok(mean('pilot')<mean('rookie'));
});

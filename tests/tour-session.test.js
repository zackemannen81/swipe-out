import test from 'node:test';
import assert from 'node:assert/strict';
import {createTourSession} from '../src/tour-session.js';
const memory=()=>{let value=null;return {getItem:()=>value,setItem:(key,v)=>{value=v;}};};
test('carrier reload retains world and station; setup and race restore safe destinations',()=>{
 const store=memory(),s=createTourSession(store);s.visit('observation','vitrum');s.location('bus');
 assert.deepEqual(createTourSession(store).state,{station:'observation',world:'vitrum',location:'bus'});
 s.location('setup');assert.equal(createTourSession(store).state.station,'briefing');
 s.location('race');assert.deepEqual(createTourSession(store).state,{station:'hangar',world:'vitrum',location:'bus'});
 s.returnToHangar();assert.equal(s.state.station,'hangar');s.location('home');assert.equal(createTourSession(store).state.location,'home');
});
test('invalid/unavailable storage falls back safely and cannot introduce unknown destinations',()=>{
 for(const value of ['bad','null','{"station":"unknown","world":"unknown","location":"finished"}']){
  const s=createTourSession({getItem:()=>value,setItem(){throw Error('blocked');}});
  assert.deepEqual(s.state,{station:'hangar',world:'necros',location:'home'});
  s.visit('lounge','vitrum');s.location('bus');assert.equal(s.state.station,'lounge');
 }
 const s=createTourSession();s.location('race');s.visit('unknown','unknown');assert.equal(s.state.world,'necros');
});


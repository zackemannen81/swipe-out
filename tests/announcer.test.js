import test from 'node:test';
import assert from 'node:assert/strict';
import { Announcer,readVoiceVolume,VOICES } from '../src/announcer.js';
import { existsSync } from 'node:fs';
function setup(){
 const sources=[];const context={currentTime:0,state:'running',destination:{},
 createGain:()=>({gain:{value:0,setTargetAtTime(v){this.value=v;}},connect(){}}),
 createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(s);return s;}};
 const a=new Announcer(context);for(const id of Object.keys(VOICES))a.buffers.set(id,{duration:2});
 return {a,context,sources};
}
test('announcer prioritizes and preempts only for imminent missiles; bounded deduplicated queue',()=>{
 const {a,sources}=setup();a.say('minigun_acquired');a.tick(.1);assert.equal(a.current.id,'minigun_acquired');
 a.say('sector_improved');a.say('incoming_missile');assert.equal(a.say('incoming_missile'),false);a.tick(.1);
 assert.equal(sources[0].stopped,true);assert.equal(a.current.id,'incoming_missile');
 a.say('enemy_lock');a.tick(.1);assert.equal(a.current.id,'incoming_missile');
 for(const id of Object.keys(VOICES))a.say(id);assert.ok(a.queue.length<=4);
});
test('announcer expiry, cooldown, pause, reset and countdown protection',()=>{
 const {a,context}=setup();a.countdown(4);a.say('enemy_lock');a.tick(3);assert.equal(a.current,null);assert.equal(a.queue.length,0);
 context.currentTime=5;a.tick(8);assert.equal(a.say('enemy_lock'),true);a.tick(.1);assert.equal(a.current.id,'enemy_lock');
 a.pause(true);const time=a.time;a.tick(10);assert.equal(a.time,time);assert.equal(a.current,null);
 assert.equal(a.say('incoming_missile'),false);a.pause(false);a.say('incoming_missile');a.tick(.1);assert.equal(a.current.id,'incoming_missile');
 a.clear();assert.equal(a.current,null);assert.equal(a.queue.length,0);assert.equal(a.last.size,0);
});
test('missing clips do not block ready clips and stale downloads never speak',()=>{
 const {a}=setup();a.buffers.delete('incoming_missile');a.load=()=>Promise.resolve();a.say('incoming_missile');a.say('personal_best');a.tick(.1);assert.equal(a.current.id,'personal_best');
 a.tick(3);a.buffers.set('incoming_missile',{});a.current.source.onended();a.tick(.1);assert.equal(a.current,null);
});
test('volume defaults, clamps, storage failures and mute clear speech',()=>{
 assert.equal(readVoiceVolume({getItem:()=>null}),.35);assert.equal(readVoiceVolume({getItem:()=> '0'}),0);
 assert.equal(readVoiceVolume({getItem:()=> '9'}),1);assert.equal(readVoiceVolume({getItem:()=> 'bad'}),.35);
 assert.equal(readVoiceVolume({getItem(){throw Error();}}),.35);
 const {a}=setup();a.say('final_lap');a.tick(.1);a.setVolume(0);assert.equal(a.current,null);assert.equal(a.gain.gain.value,0);assert.equal(a.say('final_lap'),false);
 a.setVolume(.5);assert.equal(a.gain.gain.value,.3);
});
test('every integrated voice has an actual WAV asset',()=>{
 for(const id of Object.keys(VOICES))assert.ok(existsSync(new URL('../public/audio/announcer/'+id+'.wav',import.meta.url)),id);
});

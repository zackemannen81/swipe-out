import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,awardCampaign} from '../src/career.js';
import {saveRaceResult,readRaceRecords,timeMedal} from '../src/race-records.js';
import {updateRailGlow} from '../src/rail-glow.js';
import {createTrack,disposeTrackGroup} from '../src/track.js';
import {COMBAT_LAB} from '../src/track-labs.js';
test('glow responds to kick, scales safely, and restores its original baseline',()=>{
 const {group}=createTrack({...COMBAT_LAB,name:'Necros'});const m=group.userData.railMaterials[0];updateRailGlow(group,{glow:1,musicPulse:true},{kick:{hitValue:1}});assert.equal(m.emissiveIntensity,12*2.4);updateRailGlow(group,{glow:1,musicPulse:false},{kick:{hitValue:1}});assert.equal(m.emissiveIntensity,12);updateRailGlow(group,{glow:0});assert.equal(m.emissiveIntensity,0);disposeTrackGroup(group);
});
test('new saved preferences default safely and gold time unlocks its finish',()=>{
 const p=normalizeProfile({version:1,settings:{glow:99,sfx:-2,mute:true}});assert.equal(p.settings.glow,3);assert.equal(p.settings.sfx,0);assert.equal(p.settings.mute,true);assert.equal(p.settings.musicPulse,true);awardCampaign(p,{key:'a',time:100,position:4,medal:'GOLD'});assert.ok(p.trophies.includes('time_gold'));
});
test('records preserve best time and lap, isolate configuration and report storage failures',()=>{
 let data=null;const storage={getItem:()=>data,setItem:(k,v)=>data=v};const result={key:'a',name:'Necros',label:'factory',time:100,bestLap:30,position:2};assert.equal(saveRaceResult(storage,result).improved,true);assert.equal(saveRaceResult(storage,{...result,time:110,bestLap:29}).improved,false);assert.equal(readRaceRecords(storage)[0].time,100);assert.equal(readRaceRecords(storage)[0].bestLap,29);saveRaceResult(storage,{...result,key:'b'});assert.equal(readRaceRecords(storage).length,2);assert.ok(saveRaceResult({getItem:()=>null,setItem:()=>{throw Error();}},result).error);assert.equal(timeMedal(30,1100),'GOLD');
});

test('audio preferences independently control music/effects and preserve voice on unmute',async()=>{
 const {RaceAudio}=await import('../src/audio.js');const old=globalThis.Audio;globalThis.Audio=class{constructor(){this.volume=1;}};
 try{const audio=new RaceAudio('test');audio.voiceVolume=.4;let voice=null;audio.announcer={setVolume:v=>voice=v};audio.sfxGain={gain:{value:1}};audio.sfxCompressor={threshold:{},ratio:{},knee:{}};
 audio.setPreferences({music:.3,sfx:.2,mute:true,mix:'speakers'});assert.equal(audio.audio.volume,0);assert.equal(audio.sfxGain.gain.value,0);assert.equal(voice,0);assert.equal(audio.sfxCompressor.ratio.value,4);
 audio.setPreferences({mute:false});assert.equal(audio.audio.volume,.3);assert.equal(audio.sfxGain.gain.value,.2);assert.equal(voice,.4);
 }finally{globalThis.Audio=old;}
});

test('Necros gets distant animated patrols and raised amber warning signs',async()=>{
 const {updateWorldAmbience}=await import('../src/world-ambience.js');const {NECROS}=await import('../src/track-necros.js');
 const {group,curve}=createTrack(NECROS);assert.equal(group.userData.patrols.length,3);assert.ok(group.children.some(o=>o.userData.cornerSign));
 const maxY=Math.max(...curve.getPoints(100).map(p=>p.y));const patrol=group.userData.patrols[0];updateWorldAmbience(group,0);const x=patrol.drone.position.x;updateWorldAmbience(group,10);assert.notEqual(patrol.drone.position.x,x);assert.ok(patrol.drone.position.y>maxY+60);disposeTrackGroup(group);
});

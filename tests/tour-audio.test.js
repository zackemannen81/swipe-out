import test from 'node:test';
import assert from 'node:assert/strict';
import {createTourAudio} from '../src/tour-audio.js';
import {normalizeProfile,saveProfile,loadProfile} from '../src/career.js';
class Media{
 paused=true;volume=1;src='';plays=0;play(){this.plays++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){}getAttribute(){return this.src;}removeAttribute(){this.src='';}
}
test('voice ducks music, end/skip restores mix, lifecycle pauses both, mute applies to both',()=>{
 const audio=createTourAudio(()=>new Media());audio.preferences({music:.8,sfx:.6,mute:false});audio.setActive(true);audio.track('/music');let ended=0;
 audio.speak('/voice',()=>ended++,()=>{});assert.equal(audio.music.volume,.8*.18);assert.equal(audio.voice.volume,.6);
 audio.voice.onended();assert.equal(ended,1);assert.equal(audio.music.volume,.8);
 audio.speak('/voice',()=>{},()=>{});audio.stopVoice();assert.equal(audio.music.volume,.8);
 audio.preferences({music:.8,sfx:.6,mute:true});assert.equal(audio.music.volume,0);assert.equal(audio.voice.volume,0);
 audio.setActive(false);assert.equal(audio.music.paused,true);assert.equal(audio.voice.paused,true);assert.equal(audio.voice.src,'');audio.dispose();assert.equal(audio.music.src,'');
});
test('failed autoplay retries only on gesture; stale voice rejection cannot alter next presentation',async()=>{
 const audio=createTourAudio(()=>new Media());audio.music.play=()=>{audio.music.plays++;return Promise.reject(Error());};audio.setActive(true);audio.track('/m');for(let i=0;i<100;i++)audio.track('/m');await Promise.resolve();assert.equal(audio.music.plays,1);audio.retry();assert.equal(audio.music.plays,2);
 let reject;audio.voice.play=()=>new Promise((_,r)=>{reject=r;});let failed=0;audio.speak('/v',()=>{},()=>failed++);audio.stopVoice();reject(Error());await Promise.resolve();assert.equal(failed,0);assert.equal(audio.music.volume,.9);audio.dispose();
});
test('visited intros migrate conservatively and survive normalized profile saves',()=>{
 const p=normalizeProfile({version:1,visitedZoneIntros:{'00':true,'01':true,'03':'true','99':true}});assert.deepEqual(p.visitedZoneIntros,{'00':true,'01':true});let value;
 const store={setItem:(k,v)=>value=v,getItem:()=>value};saveProfile(store,p);assert.deepEqual(loadProfile(store).visitedZoneIntros,p.visitedZoneIntros);assert.deepEqual(normalizeProfile({version:1}).visitedZoneIntros,{});
});

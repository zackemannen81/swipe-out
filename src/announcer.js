// Runtime voice policy: threats expire quickly; routine messages never form a backlog.
export const VOICES = Object.freeze({
  incoming_missile:[100,8,2], enemy_lock:[80,10,2], missile_deflected:[75,6,3],
  target_locked:[65,8,2], flares_deployed:[70,12,2], flares_ready:[35,20,3],
  rockets_acquired:[40,5,3], heatseeker_acquired:[40,5,3], minigun_acquired:[40,5,3],
  ammo_depleted:[30,10,3], final_lap:[60,60,8], personal_best:[55,10,6],
  sector_improved:[20,15,3], lap_invalid:[30,10,4],
  race_complete:[90,60,10], session_complete:[90,60,10],
  first_place:[50,60,12], second_place:[50,60,12], third_place:[50,60,12], fourth_place:[50,60,12], fifth_place:[50,60,12],
});
export const VOICE_VOLUME_KEY='swipeout.announcer.volume.v1';
export function readVoiceVolume(storage) {
  try { storage??=globalThis.localStorage;const raw=storage.getItem(VOICE_VOLUME_KEY);const value=raw===null?NaN:Number(raw);return Number.isFinite(value)?Math.max(0,Math.min(1,value)):.35; } catch{return .35;}
}
export class Announcer {
  constructor(context, volume=.35) {
    this.context=context;this.gain=context.createGain();this.gain.gain.value=volume*.6;this.gain.connect(context.destination);
    this.buffers=new Map();this.failed=new Set();this.loading=new Map();this.queue=[];this.last=new Map();this.time=0;this.current=null;this.paused=false;this.blockedUntil=0;this.volume=volume;
  }
  load(id) {
    if(this.buffers.has(id)||this.failed.has(id))return Promise.resolve();
    if(!this.loading.has(id))this.loading.set(id,fetch('/audio/announcer/'+id+'.wav').then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)).then(b=>this.buffers.set(id,b)).catch(error=>{this.failed.add(id);console.warn('Announcer clip unavailable:',id,error);}).finally(()=>this.loading.delete(id)));
    return this.loading.get(id);
  }
  setVolume(value) {
    this.volume=Math.max(0,Math.min(1,value));this.gain.gain.setTargetAtTime(this.volume*.6,this.context.currentTime,.02);
    if(!this.volume)this.clear();
  }
  say(id) {
    const rule=VOICES[id];if(!rule||!this.volume||this.failed.has(id)||this.paused)return false;
    const [priority,cooldown,ttl]=rule;
    if(this.time-(this.last.get(id)??-Infinity)<cooldown||this.current?.id===id||this.queue.some(q=>q.id===id))return false;
    this.last.set(id,this.time);void this.load(id);
    this.queue.push({id,priority,expires:this.time+ttl});this.queue.sort((a,b)=>b.priority-a.priority);this.queue.length=Math.min(this.queue.length,4);
    return true;
  }
  halt() { if(this.current?.source){this.current.source.onended=null;this.current.source.stop();this.current.source.disconnect();}this.current=null; }
  clear() { this.halt();this.queue=[];this.last.clear(); }
  countdown(duration) { this.clear();this.blockedUntil=this.context.currentTime+duration; }
  pause(value) {this.paused=value;if(value){this.halt();this.queue=[];}}
  tick(dt) {
    if(this.paused)return;this.time+=dt;
    this.queue=this.queue.filter(q=>q.expires>this.time&&!this.failed.has(q.id));
    if(this.context.state!=='running'||this.context.currentTime<this.blockedUntil)return;
    const next=this.queue.find(q=>this.buffers.has(q.id));if(!next)return;
    if(this.current){if(next.priority===100 && this.current.priority<100)this.halt();else return;}
    this.queue.splice(this.queue.indexOf(next),1);
    const source=this.context.createBufferSource();source.buffer=this.buffers.get(next.id);source.connect(this.gain);
    this.current={...next,source};source.onended=()=>{source.disconnect();if(this.current?.source===source)this.current=null;};source.start();
  }
}

export const VITRUM_MUSIC=[{name:'Vitrum · Track 15',url:'/audio/tracks/track15.m4a'},{name:'Vitrum · Track 16',url:'/audio/tracks/track16.m4a'}];
export const PROFILE_KEY='swipe-out:career:v1';
export const NECROS_REWARD='necros_mastery';
export const REWARD_MUSIC={id:'vi-lever-inte',name:'Vi lever inte',url:'/audio/tracks/vi-lever-inte.mp3',require:NECROS_REWARD};
export const SHIPS=[
 {id:'racer',name:'Racer',description:'Balanced response. Your original craft.',speed:1,force:1,mass:1,require:null},
 {id:'kestrel',name:'Kestrel',description:'Quick launch, lighter chassis. Less top-end thrust.',speed:.97,force:1.18,mass:.9,require:'finish'},
 {id:'orca',name:'Orca',description:'Heavy interceptor. Higher engine limit, slower launch.',speed:1.05,force:.92,mass:1.2,require:'podium'},
 {id:'necron-crimson-citadel',name:'Necron Crimson Citadel',description:'Necros mastery reward. Armoured racer with balanced factory performance.',speed:1,force:1,mass:1,require:NECROS_REWARD},
 {id:'the-sacrifice',name:'The sacrifice',description:'Your sacrifice has been approved. Consolation prize; balanced factory performance.',speed:1,force:1,mass:1,require:'sacrifice'},
];
export const BONUS_TROPHIES=[{id:'sacrifice',name:'Your sacrifice has been approved',description:'Finish last (5/5) in a Race with Swipeout control, High (Auto) lane assist and Rookie CPU. Unlock The sacrifice.'}];
export const PAINTS=[{id:'silver',name:'Spire Silver',color:'#cbd6df',require:'time_gold'},{id:'original',name:'Original',color:null},{id:'cyan',name:'Cyan',color:'#58f4e8'}, {id:'magenta',name:'Magenta',color:'#eb57bc'}, {id:'crimson',name:'Crimson',color:'#c84444'}, {id:'gold',name:'Dominion Gold',color:'#e8b858',require:'win'}];
export const MODULES=[{id:'stock',name:'Factory',description:'Original specification.',require:null}, {id:'launch',name:'Launch capacitor',description:'+10% thrust force. Earned by finishing Necros.',require:'finish'}, {id:'engine',name:'Overdrive',description:'+4% engine speed limit. Earned with a podium.',require:'podium'}];
export const TROPHIES=[{id:'time_gold',name:'Against the clock',description:'Earn a Gold time medal in Necros. Unlock Spire Silver.'},{id:'finish',name:'Survival approved',description:'Finish Necros. Unlock Kestrel + Launch capacitor.'},{id:'podium',name:'Recognised by the Dominion',description:'Reach the podium. Unlock Orca + Overdrive.'},{id:'win',name:'Your world expects victory',description:'Win Necros. Unlock Dominion Gold finish.'},{id:'elite',name:'To death and beyond',description:'Win on Elite.'}];
const defaults=()=>({version:1,ship:'racer',paint:'original',module:'stock',trophies:[],previewRewards:[],soundtrack:'',bests:{},settings:{music:.9,sfx:.7,mix:'headphones',mute:false,glow:1,musicPulse:true,bloom:true,shake:true,motion:true,quality:'high'}});
export const necrosMastered=profile=>TROPHIES.every(t=>profile.trophies.includes(t.id));
export const unlocked=(item,profile)=>!item.require||(item.require===NECROS_REWARD?(necrosMastered(profile)||profile.previewRewards?.includes(NECROS_REWARD)):profile.trophies.includes(item.require));
export function grantNecrosPreview(profile){profile.previewRewards=[NECROS_REWARD];}
export function selectedSoundtrack(profile,fallback){return VITRUM_MUSIC.some(t=>t.url===profile.soundtrack)||(profile.soundtrack===REWARD_MUSIC.url&&unlocked(REWARD_MUSIC,profile))?profile.soundtrack:fallback;}
export function normalizeProfile(raw){
 const p=defaults();if(!raw||raw.version!==1)return p;
 p.trophies=[...TROPHIES,...BONUS_TROPHIES].filter(t=>Array.isArray(raw.trophies)&&raw.trophies.includes(t.id)).map(t=>t.id);
 p.previewRewards=Array.isArray(raw.previewRewards)&&raw.previewRewards.includes(NECROS_REWARD)?[NECROS_REWARD]:[];
 p.soundtrack=selectedSoundtrack({...p,soundtrack:raw.soundtrack},'');
 for(const [key,items]of [['ship',SHIPS],['paint',PAINTS],['module',MODULES]]){const v=items.find(i=>i.id===raw[key]);if(v&&unlocked(v,p))p[key]=v.id;}
 const s=raw.settings??{};for(const k of ['bloom','shake','motion','mute','musicPulse'])if(typeof s[k]==='boolean')p.settings[k]=s[k];
 if(Number.isFinite(s.music))p.settings.music=Math.max(0,Math.min(1,s.music));
 for(const k of ['sfx','glow'])if(Number.isFinite(s[k]))p.settings[k]=Math.max(0,Math.min(k==='glow'?3:1,s[k]));
 if(['headphones','speakers'].includes(s.mix))p.settings.mix=s.mix;
 if(['high','balanced','low'].includes(s.quality))p.settings.quality=s.quality;
 if(raw.bests&&typeof raw.bests==='object')for(const [k,v]of Object.entries(raw.bests).slice(-100))if(!['__proto__','constructor','prototype'].includes(k)&&k.length<300&&v&&Number.isFinite(v.time)&&v.time>0&&Number.isInteger(v.position)&&v.position>=1&&v.position<=5)p.bests[k]={time:v.time,position:v.position};
 return p;
}
export function loadProfile(storage){try{return normalizeProfile(JSON.parse(storage.getItem(PROFILE_KEY)));}catch{return defaults();}}
export function saveProfile(storage,p){try{storage.setItem(PROFILE_KEY,JSON.stringify(normalizeProfile(p)));return '';}catch{return 'Could not save progress on this device. Keep this session open.';}}
export function loadout(profile,standard=false){
 const ship=SHIPS.find(s=>s.id===(standard?'racer':profile.ship))??SHIPS[0];
 return {ship:ship.id,speed:ship.speed*(!standard&&profile.module==='engine'?1.04:1),force:ship.force*(!standard&&profile.module==='launch'?1.1:1),mass:ship.mass};
}
export function awardCampaign(profile,result){
 if(!result||!Number.isFinite(result.time)||result.time<=0||!Number.isInteger(result.position)||result.position<1||result.position>5)return [];
 const earned=[...(result.medal==='GOLD'?['time_gold']:[]),'finish',...(result.position<=3?['podium']:[]),...(result.position===1?['win',...(result.difficulty==='elite'?['elite']:[])]:[])];
 const fresh=earned.filter(t=>!profile.trophies.includes(t));profile.trophies=[...new Set([...profile.trophies,...earned])];
 const old=profile.bests[result.key];if(!old||result.time<old.time)profile.bests[result.key]={time:result.time,position:result.position};
 return fresh;
}

// Use the starting configuration, never the automatic post-finish victory lap.
export function awardConsolation(profile,result){
 if(!result||result.event!=='race'||result.completed!==true||result.position!==5||result.entrants!==5||!Number.isFinite(result.time)||result.time<=0||result.handling!=='swipeout'||result.assist!==1||result.difficulty!=='rookie'||profile.trophies.includes('sacrifice'))return [];
 profile.trophies.push('sacrifice');return ['sacrifice'];
}

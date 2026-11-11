export const TOUR_MUSIC = [
 ['welcome_to_the_tour_bus','Welcome to The Tour Bus'],['the_garage-upgrades','The Garage · Upgrades'],
 ['interstellar_cruizer','Interstellar Cruizer'],['endless_darkness','Endless Darkness'],
 ['mashup_loosing_the_bet_of_life','Loosing the Bet of Life'],['say_godbye_to_your_world','Say Goodbye to Your World'],
 ['exited_in_vain-welcome','Exited in Vain · Welcome'],['the_harvester','Engineering Theme'],
].map(([id,title])=>({id,title,url:`/audio/tourbus/backgroundmusic/${id}.mp3`}));
TOUR_MUSIC.push({id:'hymn',title:'Welcome Aboard · Hymn',url:'/audio/tourbus/welcome_to_the_tour_bus-hymn.mp3'});
export const ZONE_MUSIC={hangar:0,workshop:1,briefing:2,lounge:4,observation:3,market:1,diplomacy:2,quarters:3,medbay:3,archive:3,engineering:7,cargo:1,docking:2,security:2,museum:2};
// Two media elements, one owner. No WebAudio context or race-audio routing changes.
export function createTourAudio(makeAudio=()=>new Audio()){
 const music=makeAudio(),voice=makeAudio();music.loop=true;music.preload='none';voice.preload='none';
 let musicAttempted=false,active=false,disposed=false,speaking=false,generation=0,settings={music:.9,sfx:.7,mute:false},end=()=>{},failure=()=>{};
 function mix(){music.volume=settings.mute?0:settings.music*(speaking?.18:1);voice.volume=settings.mute?0:settings.sfx;}
 function stopVoice(){generation++;voice.pause();voice.removeAttribute('src');voice.load();speaking=false;mix();}
 voice.onended=()=>{speaking=false;mix();end();};
 voice.onerror=()=>{speaking=false;mix();failure('Recording unavailable. You can still read the transcript.');};
 function resumeMusic(){if(active&&!musicAttempted&&music.getAttribute('src')&&music.paused){musicAttempted=true;music.play().catch(()=>{});}}
 return {music,voice,
  setActive(value){if(disposed)return;if(active===value)return;active=value;if(!active){music.pause();stopVoice();}else {musicAttempted=false;resumeMusic();}},
  preferences(value){settings=value;mix();},
  track(url){if(disposed)return;if(music.getAttribute('src')!==url){musicAttempted=false;music.src=url;music.load();}resumeMusic();},
  speak(url,onEnd,onFailure){stopVoice();end=onEnd;failure=onFailure;if(!url||!active)return;const token=generation;speaking=true;mix();voice.src=url;
   voice.play().catch(()=>{if(token!==generation||disposed)return;speaking=false;mix();failure('Select PLAY VOICE to enable audio.');});
  },
  stopVoice,retry(){musicAttempted=false;resumeMusic();},
  dispose(){disposed=true;active=false;stopVoice();music.pause();music.removeAttribute('src');music.load();voice.onended=voice.onerror=null;},
 };
}

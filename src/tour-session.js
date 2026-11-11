import {TOUR_VIEWS} from './tour-bus-zones.js';
const KEY='swipeout-tour-session-v1';
const stations=new Set(Object.keys(TOUR_VIEWS));
export function createTourSession(storage){
 let state={station:'hangar',world:'necros',location:'home'};
 try{const saved=JSON.parse(storage?.getItem(KEY)??'null');if(saved){
  if(stations.has(saved.station))state.station=saved.station;
  if(['necros','vitrum','collective'].includes(saved.world))state.world=saved.world;
  if(['home','bus','setup','race'].includes(saved.location))state.location=saved.location;
 }}catch{}
 const save=()=>{try{storage?.setItem(KEY,JSON.stringify(state));}catch{}};
 // Reload never resumes or completes a race. Return to its safe carrier origin.
 if(state.location==='race'){state.location='bus';state.station='hangar';save();}
 if(state.location==='setup'){state.location='bus';state.station='briefing';save();}
 return {
  get state(){return {...state};},
  visit(station,world){if(stations.has(station))state.station=station;if(['necros','vitrum','collective'].includes(world))state.world=world;save();},
  location(value){if(['home','bus','setup','race'].includes(value)){state.location=value;save();}},
  returnToHangar(){state.location='bus';state.station='hangar';save();},
 };
}

import {BLOCKOUT_ROOMS} from './tour-blockout.js';
// Plan coordinates: left = -X, upper = -Z. Compact playable scale, not lore metres.
const definitions = [
 ['01','Grand Hangar',3,[0,0,0],'hangar'],
 ['02','Pilots’ Lounge',4,[-44,12,-36],'lounge'],
 ['03','Workshop / Service Bay',3,[0,0,52],'workshop'],
 ['04','Spare Parts Market',3,[-30,0,52]],
 ['05','Tournament Nexus',4,[-46,12,6],'briefing'],
 ['06','Observation Deck',5,[-84,24,0],'observation'],
 ['07','Diplomacy Corridor',4,[-14,12,-40]],
 ['08','Crew Quarters',2,[34,-12,-40]],
 ['09','Medbay',2,[12,-12,-40]],
 ['10','Archive / Lore Chamber',3,[-54,0,52]],
 ['11','Engineering Core',1,[76,-24,0]],
 ['12','Cargo & Storage',2,[28,-12,52]],
 ['13','Docking Ports / Shuttle Bay',1,[62,-24,52]],
 ['14','Security Nexus',2,[42,-12,0]],
 ['15','VIP Gallery / Race Museum',5,[-60,24,-32]],
 ['16','Restricted',null,[0,-36,60]],
];
export const TOUR_CONNECTIONS = [
 ['01','03','Service passage'],['01','05','Port lift · Deck 04'],
 ['01','07','Diplomacy lift · Deck 04'],['07','02','Diplomacy Corridor'],
 ['05','07','Briefing passage'],['05','06','Panorama lift · Deck 05'],
 ['03','04','Market passage'],['04','10','Archive passage'],
 ['07','09','Medical lift'],['09','08','Crew passage'],
 ['01','14','Security lift'],['14','11','Engineering lift'],
 ['03','12','Cargo lift'],['12','13','Shuttle lift'],
 ['06','15','Gallery passage'],['12','16','Restricted lift'],
].map(([from,to,label],i)=>({id:`connection-${i+1}`,from,to,label,type:label.includes('lift')?'lift':'passage'}));
for(const room of BLOCKOUT_ROOMS)definitions.find(d=>d[0]===room.zone)[4]=room.station;
export const TOUR_ZONES = Object.fromEntries(definitions.map(([zoneId,name,deck,position,station])=>[zoneId,{
 zoneId,name,deck,position,available:!!station,transit:zoneId==='07',
 requiredFlags:zoneId==='16'?['restricted-access']:[],
 cameraStations:station?[station]:[],connections:TOUR_CONNECTIONS.filter(c=>c.from===zoneId||c.to===zoneId).map(c=>c.id),
}]));
export function tourRoute(from,to){
 const queue=[[from]],seen=new Set([from]);
 while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===to)return path;
  for(const c of TOUR_CONNECTIONS){const next=c.from===last?c.to:c.to===last?c.from:null;
   if(!next||seen.has(next)||(!TOUR_ZONES[next].available&&!TOUR_ZONES[next].transit))continue;
   seen.add(next);queue.push([...path,next]);
  }
 }return null;
}
export const TOUR_VIEWS = {
 hangar:{zoneId:'01',title:'GRAND HANGAR',position:[15,9,27],target:[-3,3,-7]},
 workshop:{zoneId:'03',title:'SERVICE BAY',position:[12,7,63],target:[4,2.1,52]},
 briefing:{zoneId:'05',title:'TOURNAMENT NEXUS',position:[-37,18,17],target:[-46,14,6]},
 lounge:{zoneId:'02',title:'PILOTS’ LOUNGE',position:[-35,17,-25],target:[-44,14,-36]},
 observation:{zoneId:'06',title:'OBSERVATION',position:[-73,28.5,10],target:[-105,29,-2]},
};
for(const r of BLOCKOUT_ROOMS){
 const [x,y,z]=TOUR_ZONES[r.zone].position,[w,d,h]=r.size;
 TOUR_VIEWS[r.station]={zoneId:r.zone,title:r.label,position:[x+w*(['10','12'].includes(r.zone)?.08:.32),y+Math.min(5,h*.52),z+d*.38],target:[x-1,y+2.2,z-d*.15]};
}
for(const v of Object.values(TOUR_VIEWS))v.subtitle=`Deck 0${TOUR_ZONES[v.zoneId].deck} / Zone ${v.zoneId}`;

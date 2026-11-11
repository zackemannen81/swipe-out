from pathlib import Path
p=Path('src/tour-bus-zones.js');s=p.read_text(encoding='utf-8-sig');s="import {BLOCKOUT_ROOMS} from './tour-blockout.js';\n"+s;s=s.replace('export const TOUR_ZONES =',"for(const room of BLOCKOUT_ROOMS)definitions.find(d=>d[0]===room.zone)[4]=room.station;\nexport const TOUR_ZONES =")
s=s.replace('for(const v of Object.values(TOUR_VIEWS))',"""for(const r of BLOCKOUT_ROOMS){
 const [x,y,z]=TOUR_ZONES[r.zone].position,[w,d,h]=r.size;
 TOUR_VIEWS[r.station]={zoneId:r.zone,title:r.label,position:[x+w*.32,y+Math.min(5,h*.52),z+d*.38],target:[x-1,y+2.2,z-d*.15]};
}
for(const v of Object.values(TOUR_VIEWS))""");p.write_text(s,encoding='utf-8')
p=Path('src/tour-session.js');s=p.read_text(encoding='utf-8-sig');s="import {TOUR_VIEWS} from './tour-bus-zones.js';\n"+s;s=s.replace("new Set(['hangar','workshop','briefing','lounge','observation'])",'new Set(Object.keys(TOUR_VIEWS))');p.write_text(s,encoding='utf-8')
p=Path('src/tour-bus.js');s=p.read_text(encoding='utf-8-sig');s="import {buildCarrierBlockout} from './tour-blockout.js';\n"+s;s=s.replace('scene.add(light);\n }','light.userData.zoneId=zoneId;scene.add(light);\n }');needle=" const ends=asset('TB-HANGAR-ENDS'";s=s.replace(needle," buildCarrierBlockout({asset,box,cylinder,beam,room,registry,zones:TOUR_ZONES,steel,dark,brass,ivory,cyan,amber});\n"+needle)
s=s.replace('function pose(id){camera.position',"""function pose(id){
  const zone=TOUR_VIEWS[id].zoneId;
  for(const row of registry)row.group.visible=row.zoneId===zone||row.kind==='stars';
  for(const o of scene.children)if(o.isPointLight)o.visible=(o.userData.zoneId??(o.name.startsWith('TB-OBS-')?'06':'01'))===zone;
  camera.position""")
# world switch must not make the moon visible in other rooms
s=s.replace('moonGroup.visible=necros;',"moonGroup.visible=necros&&TOUR_VIEWS[view].zoneId==='06';")
s=s.replace("row.zoneId===zone||row.kind==='stars'", "(row.zoneId===zone||row.kind==='stars')&&(row.id!=='TB-MOON-01'||clouds.visible)")
p.write_text(s,encoding='utf-8')
p=Path('src/tour-bus-ui.js');s=p.read_text(encoding='utf-8-sig');s="import {BLOCKOUT_ROOMS} from './tour-blockout.js';\nimport {TOUR_CONNECTIONS} from './tour-bus-zones.js';\n"+s
s=s.replace('Object.entries(TOUR_VIEWS).map(([id,v])=>`<button', 'Object.entries(TOUR_VIEWS).filter(([id])=>!BLOCKOUT_ROOMS.some(r=>r.station===id)).map(([id,v])=>`<button')
s=s.replace(" const crew=createTourCrew", """ const directory=document.createElement('select');directory.className='bus-directory';directory.setAttribute('aria-label','All carrier rooms');
 for(const [id,v] of Object.entries(TOUR_VIEWS)){const option=document.createElement('option');option.value=id;option.textContent=`${v.subtitle} · ${v.title}`;directory.append(option);}
 directory.addEventListener('change',()=>go(directory.value));container.append(directory);
 const crew=createTourCrew""")
s=s.replace("  $('#bus-deck').textContent", "  directory.value=station;\n  $('#bus-deck').textContent")
s=s.replace("  if(station==='lounge'){", """  const blockout=BLOCKOUT_ROOMS.find(r=>r.station===station);
  if(blockout){text(blockout.description);text('CREW ACCESS · Interior services are being prepared.');
   const zone=TOUR_VIEWS[station].zoneId;
   for(const c of TOUR_CONNECTIONS.filter(c=>c.from===zone||c.to===zone)){
    const next=c.from===zone?c.to:c.from,v=Object.entries(TOUR_VIEWS).find(([,v])=>v.zoneId===next);
    if(v)button(`${c.label} → ${v[1].title}`,()=>go(v[0]));
   }
  }
  if(station==='lounge'){""")
s=s.replace("  container.setAttribute('aria-busy','true');", "  directory.disabled=true;container.setAttribute('aria-busy','true');")
s=s.replace("container.setAttribute('aria-busy','false');", "directory.disabled=false;container.setAttribute('aria-busy','false');")
s=s.replace('$(`[data-station="${station}"]`).focus({preventScroll:true});', '($(`[data-station="${station}"]`)??directory).focus({preventScroll:true});')
p.write_text(s,encoding='utf-8')
p=Path('src/tour-audio.js');s=p.read_text(encoding='utf-8-sig');s=s.replace('observation:3}', 'observation:3,market:1,diplomacy:2,quarters:3,medbay:3,archive:3,engineering:7,cargo:1,docking:2,security:2,museum:2}');p.write_text(s,encoding='utf-8')
p=Path('tests/tour-bus-zones.test.js');s=p.read_text(encoding='utf-8-sig').replace('five destinations','fifteen destinations').replace('z.available).length,5','z.available).length,15');p.write_text(s,encoding='utf-8')

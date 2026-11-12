from pathlib import Path
import shutil,json
root=Path('C:/Users/zakri/Desktop/tourbus/assets');out=Path('public/models/tour-bus');out.mkdir(parents=True,exist_ok=True)
review=json.loads(Path('tmp/delivered-model-review.json').read_text(encoding='utf8'))
choices=[(2,'observation-bench.glb'),(6,'observation-console.glb'),(0,'observation-vine.glb')]
for i,name in choices:
 shutil.copy2(root/review[i]['file'],out/name);review[i]['runtimeFile']='/models/tour-bus/'+name
Path('docs/TOUR_ASSET_DELIVERY_2026-11-11.json').write_text(json.dumps(review,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
p=Path('src/tour-bus.js');s=p.read_text(encoding='utf-8-sig');needle=' buildCarrierBlockout({asset,box,cylinder,beam,room,registry,zones:TOUR_ZONES,steel,dark,brass,ivory,cyan,amber});'
assert needle in s
s=s.replace(needle,""" // First supplied observation furniture pass; originals remain in Desktop assets.
 for(const row of registry.filter(r=>r.id.startsWith('TB-OBS-BENCH-')||r.id.startsWith('TB-OBS-CONSOLE-'))){
  const bench=row.kind==='bench';importInto(row.group,bench?'observation-bench.glb':'observation-console.glb',bench?3:1.25);
  row.description=bench?'Supplied modular bench GLB, shared between the two observation seating slots.':'Supplied information console GLB, proportionally fitted and grounded; decorative screen, existing UI retains controls.';
  row.modelSize=bench?[3,.426,1.252]:[1.25,1.352,.842];
 }
 for(const side of [-1,1]){
  const g=asset(`TB-OBS-VINE-${side<0?'L':'R'}`,'foliage','Observation: hanging vine',[-74,27,side*15.5],'Supplied climbing-vine GLB mounted along the side wall, outside the central panorama sightline.','P2');
  registry.at(-1).zoneId='06';registry.at(-1).modelSize=[1.3,2.35,.411];importInto(g,'observation-vine.glb',1.3,side>0?Math.PI:0);
 }
"""+needle)
p.write_text(s,encoding='utf8')


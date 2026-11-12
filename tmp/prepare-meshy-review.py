from pathlib import Path
p=Path('tools/review-tour-delivery.mjs');s=p.read_text(encoding='utf8-sig'.replace('utf8','utf-8'))
s=s.replace("const root='C:/Users/zakri/Desktop/tourbus/assets/';", "const root='C:/Users/zakri/Desktop/tourbus/assets/meshyai/';")
start="const files=JSON.parse(fs.readFileSync('docs/TOUR_ASSET_DELIVERY_2026-11-11.json','utf8')).filter(x=>x.file.endsWith('.glb'));"
rep="""const names=fs.readdirSync(root);
const prefixes=['Meshy_AI_Braided_Money_Tree_','Meshy_AI_Realistic_Bush_1109','Meshy_AI_fern_3d_','Meshy_AI_sci_fi_sliding_door_','Meshy_AI_panels_1111013319_texture.glb','Meshy_AI_Quantum_Cargo_Pod_1031','Meshy_AI_Cyber_Command_Console_','Meshy_AI_Orbital_Core_Engine_','Meshy_AI_Flatbed_','Meshy_AI_Cattail_Planter_','bio_flora_plant_lowpo.glb','bio_flora_plant_lowpo (1).glb'];
const files=prefixes.map(prefix=>({file:names.find(n=>n.startsWith(prefix))}));
if(files.some(f=>!f.file))throw Error('Missing shortlist model');"""
assert start in s;s=s.replace(start,rep).replace('tmp/delivery-model-', 'tmp/meshy-model-').replace('tmp/delivered-model-review.json','tmp/meshy-shortlist-review.json')
Path('tools/review-meshy-shortlist.mjs').write_text(s,encoding='utf8')

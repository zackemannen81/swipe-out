// Dimensions are compact gameplay metres. These are art/layout placeholders.
export const BLOCKOUT_ROOMS = [
 {zone:'04',station:'market',size:[20,24,9],label:'SPARE PARTS MARKET',description:'Independent stalls, component displays and a clear central aisle.'},
 {zone:'07',station:'diplomacy',size:[28,10,8],label:'DIPLOMACY CORRIDOR',description:'Delegation banners and meeting alcoves connect the upper public deck.'},
 {zone:'08',station:'quarters',size:[20,22,8],label:'CREW QUARTERS',description:'Sleeping pods, lockers and a shared quiet area for the crew.'},
 {zone:'09',station:'medbay',size:[18,22,8],label:'MEDBAY',description:'Treatment beds and diagnostic equipment beside the crew passage.'},
 {zone:'10',station:'archive',size:[20,24,10],label:'ARCHIVE / LORE CHAMBER',description:'Data shelves and reading terminals preserve the public history of the tour.'},
 {zone:'11',station:'engineering',size:[32,32,18],label:'ENGINEERING CORE',description:'A shielded reactor, service ring and control consoles power the carrier.'},
 {zone:'12',station:'cargo',size:[20,24,9],label:'CARGO & STORAGE',description:'Container racks and loading lanes connect the workshop to the shuttle bay.'},
 {zone:'13',station:'docking',size:[36,30,18],label:'SHUTTLE BAY',description:'Two shuttle berths, a freight apron and a sealed outer docking gate.'},
 {zone:'14',station:'security',size:[20,24,9],label:'SECURITY NEXUS',description:'A screening threshold and watch desk control access to engineering.'},
 {zone:'15',station:'museum',size:[22,20,10],label:'VIP GALLERY / RACE MUSEUM',description:'Exhibition plinths and gallery seating celebrate the championship.'},
];
export function buildCarrierBlockout({asset,box,cylinder,beam,room,registry,zones,steel,dark,brass,ivory,cyan,amber}){
 const make=(id,kind,label,zone,offset,description)=>{
  const p=zones[zone].position.map((n,i)=>n+offset[i]);const g=asset(id,kind,label,p,description,'P2');registry.at(-1).zoneId=zone;return g;
 };
 for(const r of BLOCKOUT_ROOMS){
  const [w,d,h]=r.size;room(r.zone,w,d,h);
  const g=make(`TB-FIT-${r.zone}`,'interior',r.label,r.zone,[0,0,0],r.description);
  // Repeated wall pilasters and luminous ceiling strips establish a shared kit.
  for(const x of [-w/2+1,w/2-1]){box(g,[.4,h,.6],[x,h/2,-d/2+1],brass);box(g,[.12,.08,d-4],[x,h-.4,0],amber);}
  const prop=(suffix,kind,pos,description)=>make(`TB-${r.zone}-${suffix}`,kind,suffix,r.zone,pos,description);
  const desk=(suffix,pos)=>{const p=prop(suffix,'console',pos,'Replaceable control terminal with sloped display and grounded pedestal.');box(p,[1.8,1,.8],[0,.5,0],steel);const screen=box(p,[1.7,.08,.9],[0,1.1,0],cyan);screen.rotation.x=.25;return p;};
  const bench=(suffix,pos)=>{const p=prop(suffix,'seat',pos,'Replaceable modular bench, with seat and back at human scale.');box(p,[3,.5,1],[0,.5,0],ivory);box(p,[3,.8,.25],[0,1,.4],steel);};
  if(r.zone==='04')for(const side of [-1,1])for(let i=0;i<3;i++){
   const p=prop(`STALL-${side<0?'L':'R'}${i+1}`,'market-stall',[side*6,0,-7+i*7],'Modular spare-parts stall with counter, canopy and sample components.');
   box(p,[4,1.1,2],[0,.55,0],steel);box(p,[4.5,.2,2.5],[0,3,0],brass);for(const x of [-1.8,1.8])box(p,[.1,3,.1],[x,1.5,.8],ivory);for(let j=0;j<3;j++)cylinder(p,.25,.4,[-1+j,1.3,0],cyan);
  }
  if(r.zone==='07')for(let i=0;i<4;i++){
   const p=prop(`DELEGATION-${i+1}`,'banner',[-10+i*6.5,0,-3.8],'Public delegation banner placeholder with wall pedestal, no secret narrative art.');box(p,[2,3,.1],[0,4,0],i%2?brass:ivory);cylinder(p,.7,.5,[0,.25,.7],steel);
  }
  if(r.zone==='08')for(const side of [-1,1])for(let i=0;i<3;i++){
   const p=prop(`POD-${side<0?'L':'R'}${i+1}`,'crew-pod',[side*6,0,-7+i*6],'Sleeping berth with mattress, privacy frame and adjacent personal locker.');box(p,[3,.5,2],[0,.25,0],steel);box(p,[2.7,.2,1.7],[0,.6,0],ivory);box(p,[.6,2.4,2],[side*2,1.2,0],brass);
  }
  if(r.zone==='09'){
   for(let i=0;i<3;i++){const p=prop(`BED-${i+1}`,'medical-bed',[-4,0,-6+i*6],'Treatment bed with headrest and overhead scanner arch; decorative blockout.');box(p,[2,1,3.5],[0,.5,0],ivory);box(p,[2,.4,.6],[0,1.15,-1.3],cyan);for(const x of [-1.4,1.4])box(p,[.15,3.5,.15],[x,1.75,0],steel);box(p,[3,.2,.5],[0,3.5,0],cyan);}desk('DIAGNOSTICS',[4,0,-5]);
  }
  if(r.zone==='10'){
   for(const side of [-1,1])for(let i=0;i<3;i++){const p=prop(`SHELF-${side<0?'L':'R'}${i+1}`,'archive-rack',[side*7,0,-7+i*7],'Tall archive rack with luminous data volumes and metal shelf divisions.');box(p,[2,5,4],[0,2.5,0],dark);for(let y=1;y<5;y++){box(p,[2.2,.12,4.2],[0,y,0],brass);for(let z=-1.5;z<=1.5;z++)box(p,[2.1,.6,.35],[0,y+.4,z],ivory);}}desk('READING',[0,0,-3]);
  }
  if(r.zone==='11'){
   const p=prop('REACTOR','reactor',[0,0,-3],'Shielded reactor silhouette, service ring and vertical conduits; no interactive controls.');cylinder(p,5,.8,[0,.4,0],steel);cylinder(p,2.5,10,[0,5.8,0],cyan);for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*4,z=Math.sin(a)*4;beam(p,[x,.8,z],[x,12,z],.35,brass);}for(const y of [1,5,11])cylinder(p,3.3,.4,[0,y,0],steel);desk('CONTROL',[-8,0,5]);
  }
  if(r.zone==='12')for(const side of [-1,1])for(let i=0;i<3;i++){
   const p=prop(`RACK-${side<0?'L':'R'}${i+1}`,'cargo-rack',[side*6,0,-7+i*7],'Stackable freight containers on a reusable two-level loading rack.');for(let y=0;y<2;y++){box(p,[4,.2,4],[0,y*2.6,0],brass);box(p,[3.5,2,3.5],[0,y*2.6+1.1,0],steel);box(p,[2,.12,.03],[0,y*2.6+1.8,1.77],amber);}
  }
  if(r.zone==='13'){
   for(const side of [-1,1]){const p=prop(`BERTH-${side<0?'L':'R'}`,'shuttle-berth',[side*9,0,-3],'Shuttle footprint and docking support, ready for a shared transport model.');box(p,[10,.2,14],[0,.1,0],steel);box(p,[4,2,8],[0,1.2,0],ivory);box(p,[8,.4,4],[0,1.4,1],brass);for(const x of [-4.7,4.7])box(p,[.12,.04,13],[x,.23,0],amber);}desk('DOCK-CONTROL',[0,0,7]);box(g,[w-2,11,.4],[0,5.5,-d/2+.4],dark);
  }
  if(r.zone==='14'){desk('WATCH',[-5,0,-4]);for(const x of [-2,2])box(g,[.5,4,.5],[x,2,0],brass);box(g,[4.5,.4,.5],[0,4,0],cyan);for(let i=0;i<3;i++)box(g,[2,1.2,.12],[-5+i*3,3,-d/2+.4],cyan);bench('WAITING',[5,0,5]);}
  if(r.zone==='15'){for(let i=0;i<3;i++){const p=prop(`DISPLAY-${i+1}`,'museum-display',[-6+i*6,0,-4],'Exhibition pedestal and trophy silhouette; display content remains to be authored.');cylinder(p,1.6,.6,[0,.3,0],steel);cylinder(p,.5,1.5,[0,1.4,0],brass);box(p,[1.7,.15,.8],[0,2.2,0],amber);}bench('GALLERY',[-5,0,5]);}
 }
 room('16',18,16,8); // Sealed shell only: not a public destination or narrated reveal.
}

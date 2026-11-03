import * as THREE from 'three';

export const TOUR_VIEWS = {
 hangar:{title:'GRAND HANGAR',subtitle:'Deck 03 / Flight operations',position:[15,9,27],target:[0,3,-7]},
 workshop:{title:'SERVICE BAY',subtitle:'Deck 03 / Your race craft',position:[10,5,13],target:[4,1.7,4]},
 briefing:{title:'TOURNAMENT NEXUS',subtitle:'Deck 03 / Destination briefing',position:[19,5,-4],target:[12,2,-15]},
 lounge:{title:'PILOTS’ LOUNGE',subtitle:'Deck 03 / Diplomatic annex',position:[-5,5,23],target:[-14,2,12]},
 observation:{title:'OBSERVATION',subtitle:'Deck 03 / Orbital gallery',position:[0,5,-16],target:[0,8,-65]},
};
export const TOUR_WORLDS = {
 necros:{title:'NECROS',track:'Dark PRIME',color:0xb75537,description:'An empire that conquered death. A world that still fears its end.'},
 vitrum:{title:'VITRUM LITHOFYTER',track:'Neural Ascent',color:0x49a58b,description:'A living forest. Every root carries a memory. Every crystal carries a thought.'},
};

// Each replaceable group is registered here; the same data generates the asset document.
export function createTourBusScene() {
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x030912);scene.fog=new THREE.FogExp2(0x08131d,.008);
 const camera=new THREE.PerspectiveCamera(52,1,.1,350);
 const registry=[],materials=new Set(),geometries=new Set();
 const mat=(color,metalness=.5,roughness=.55)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m;};
 const steel=mat(0x233440),dark=mat(0x101923),floor=mat(0x263039,.65,.4),brass=mat(0x957352,.7,.38),ivory=mat(0x82939a,.45,.6);
 const cyan=mat(0x3ae7ee);cyan.emissive.set(0x3ae7ee);cyan.emissiveIntensity=2;
 const amber=mat(0xffbc66);amber.emissive.set(0xffa94d);amber.emissiveIntensity=2;
 const red=mat(0x9e3440);red.emissive.set(0x9e3440);red.emissiveIntensity=.4;
 function asset(id,kind,label,position,description,priority='P2'){
  const g=new THREE.Group();g.name=id;g.position.fromArray(position);scene.add(g);
  const entry={id,kind,label,position,description,priority,group:g};registry.push(entry);g.userData.assetId=id;return g;
 }
 function mesh(parent,geometry,material,position=[0,0,0]){geometries.add(geometry);const m=new THREE.Mesh(geometry,material);m.position.fromArray(position);parent.add(m);return m;}
 const box=(g,s,p,m=steel)=>mesh(g,new THREE.BoxGeometry(...s),m,p);
 const cylinder=(g,r,h,p,m=steel)=>mesh(g,new THREE.CylinderGeometry(r,r,h,32),m,p);
 const beam=(g,a,b,r=.12,m=steel)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const o=mesh(g,new THREE.CylinderGeometry(r,r,v.length(),8),m,av.add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;};
 const deck=asset('TB-DECK-01','deck','Huvuddäck',[0,-.3,0],'Slitna modulära metallplattor, kabelrännor och gångmarkeringar.','P1');box(deck,[46,.6,66],[0,0,0],floor);
 for(let x=-20;x<=20;x+=4)box(deck,[.025,.015,64],[x,.31,0],dark);
 for(let z=-30;z<=30;z+=4)box(deck,[44,.015,.025],[0,.31,z],dark);
 for(const x of [-7,7])box(deck,[.08,.025,58],[x,.33,0],amber);
 const roof=asset('TB-ROOF-01','roof','Hangartak',[0,0,0],'Mörka takpaneler bakom bärverket, med plats för ventilation och kabelstegar.');
 box(roof,[30,.4,66],[0,21.2,0],dark);
 for(const side of [-1,1]){const panel=box(roof,[10.7,.3,66],[side*18.5,15,0],dark);panel.rotation.z=-side*Math.atan2(8,7);}
 for(let i=0;i<6;i++){
  const z=26-i*11,g=asset(`TB-RIB-${String(i+1).padStart(2,'0')}`,'rib','Bärande valvbåge',[0,0,z],'Återanvändbar industribåge med pelarfot, snedsträva och takbalk.','P1');
  for(const side of [-1,1]){box(g,[1.2,11,1.3],[side*22,5.5,0],ivory);beam(g,[side*22,11,0],[side*15,19,0],.65,ivory);beam(g,[side*15,19,0],[0,21,0],.65,steel);box(g,[.13,6,.15],[side*21.3,7,0],cyan);box(g,[2.2,.8,2],[side*22,.4,0],dark);}
 }
 for(const side of [-1,1]){
  const g=asset(`TB-GALLERY-${side<0?'L':'R'}`,'gallery','Servicebalkong',[side*20,0,0],'Gångbrygga med räcke och tekniska skåp längs hangaren.');
  box(g,[4,.45,63],[0,7,0]);for(const y of [7.7,8.5])beam(g,[-side*2,y,-31],[-side*2,y,31],.06,brass);
  for(let z=-30;z<=30;z+=3)beam(g,[-side*2,7.2,z],[-side*2,8.5,z],.05,brass);
  box(g,[.14,.08,60],[-side*2,6.75,0],amber);
  const wall=asset(`TB-WALL-${side<0?'L':'R'}`,'wall','Hangarvägg',[side*23,0,0],'Paneler, serviceöppningar och ventilationsfält.');box(wall,[.5,18,66],[0,9,0],dark);
  for(let z=-27;z<=27;z+=9)box(wall,[.7,4,5],[-side*.4,3,z],steel);
 }
 const heroPad=asset('TB-PAD-01','pad','Spelarens serviceplattform',[4,0,4],'Låg rund lyftplattform med belysta kanter, anslutningar och åtkomstpaneler.','P1');
 cylinder(heroPad,4.3,.35,[0,.18,0],dark);cylinder(heroPad,4.15,.08,[0,.4,0],brass);cylinder(heroPad,3.9,.08,[0,.47,0],floor);
 const ring=mesh(heroPad,new THREE.TorusGeometry(3.95,.035,6,64),cyan,[0,.55,0]);ring.rotation.x=Math.PI/2;
 const ship=asset('TB-RACER-01','racer','Utrustat racerskepp',[4,1.15,4],'Visar spelarens befintliga valda skepp och finish. Återanvänd spelets racer; ingen ny modell behövs.','P1');
 for(let i=0;i<3;i++){
  const g=asset(`TB-DOCK-0${i+1}`,'dock','Bakgrundsdocka',[-12,0,-4-i*10],'Rektangulär parkeringsplats med laststöd. Generiska serviceskyttlar, inte nya upplåsta racers.');
  box(g,[8,.3,7],[0,.15,0],dark);box(g,[7.8,.04,.08],[0,.32,3.4],amber);
  const shuttle=asset(`TB-SHUTTLE-0${i+1}`,'shuttle','Serviceskyttel',[-12,1,-4-i*10],'Enkel transportfarkost som skapar skala och aktivitet. Byt mot optimerad bakgrundsmodell.');
  box(shuttle,[2.4,1,5],[0,.5,0],ivory);box(shuttle,[5,.25,2],[0,.5,.3],steel);box(shuttle,[1.4,.55,1.5],[0,1.1,-.6],dark);for(const x of [-.8,.8])box(shuttle,[.4,.35,.1],[x,.55,2.55],cyan);
 }
 const crane=asset('TB-CRANE-01','crane','Traverskran',[4,13,4],'Takbalk med löpvagn, dubbla vajrar och serviceok.','P1');box(crane,[30,.7,1.2],[0,0,0],brass);box(crane,[2,1.1,2],[0,-.8,0]);for(const x of [-.6,.6])beam(crane,[x,-1,0],[x,-6,0],.025,dark);box(crane,[2,.3,.6],[0,-6,0],brass);
 const terminal=asset('TB-CONSOLE-01','console','Utrustningsterminal',[9,0,6],'Lutande skärm på stativ intill spelarens plattform. Öppnar garage.','P1');box(terminal,[.8,1.1,.7],[0,.55,0]);const screen=box(terminal,[1.5,.1,1],[0,1.2,0],cyan);screen.rotation.x=.3;
 const nexus=asset('TB-NEXUS-01','nexus','Briefingbord',[12,0,-15],'Runt hologrambord med planetprojektion. Välj Necros eller Vitrum.','P1');cylinder(nexus,2.6,.9,[0,.45,0],dark);cylinder(nexus,2.4,.08,[0,.95,0],cyan);
 const holo=mesh(nexus,new THREE.IcosahedronGeometry(.95,2),new THREE.MeshBasicMaterial({color:0x50e3cf,wireframe:true}),[0,2.25,0]);materials.add(holo.material);
 const flagMaterials=[red,mat(0x257b6e),mat(0x566d87),mat(0x8d6a39)];
 for(let i=0;i<4;i++){const side=i<2?-1:1,g=asset(`TB-BANNER-0${i+1}`,'banner','Civilisationsfana',[side*19.5,0,-18+(i%2)*12],'Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare.');g.rotation.y=side*Math.PI/2;box(g,[1.8,4,.08],[0,10,0],flagMaterials[i]);beam(g,[-1,12.1,0],[1,12.1,0],.08,brass);}
 const lounge=asset('TB-LOUNGE-01','lounge','Loungepodie',[-14,0,14],'Upphöjt viloområde med sittplatser och lågt bord.');cylinder(lounge,5.5,.25,[0,.125,0],dark);cylinder(lounge,1.3,.55,[0,.55,0],brass);
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5,g=asset(`TB-SEAT-0${i+1}`,'seat','Pilotfåtölj',[-14+Math.sin(a)*3.5,0,14+Math.cos(a)*3.5],'Modulär vilostol för lounge. Fristående säte, rygg och fot.');g.rotation.y=a;
  cylinder(g,.55,.45,[0,.3,0],steel);box(g,[1.3,.3,1.3],[0,.75,0],ivory);box(g,[1.3,1,.25],[0,1.25,.55],ivory);
 }
 for(let i=0;i<7;i++){
  const g=asset(`TB-CARGO-0${i+1}`,'cargo','Reservdelscontainer',[17+(i%2)*2,0,14-Math.floor(i/2)*4],'Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas.');box(g,[1.5,1.3,2],[0,.65,0],steel);for(const x of [-.55,.55])box(g,[.1,1.4,2.1],[x,.7,0],brass);
 }
 const window=asset('TB-WINDOW-01','window','Orbitalfönstrets ram',[0,0,-32],'Stor öppen fönsterram. Ingen tung genomskinlig glasruta behövs i prototypen.','P1');
 box(window,[46,1,1],[0,.5,0],brass);box(window,[46,1,1],[0,19,0],brass);for(const x of [-22,-11,0,11,22])box(window,[.35,18,1],[x,10,0],ivory);
 const rail=asset('TB-RAIL-01','rail','Observationsräcke',[0,0,-27],'Lågt skyddsräcke längs planetvyn.');for(const y of [.5,1.2])beam(rail,[-20,y,0],[20,y,0],.055,brass);for(let x=-20;x<=20;x+=2)beam(rail,[x,0,0],[x,1.2,0],.045,steel);
 const planetGroup=asset('TB-PLANET-01','planet','Planetkuliss',[8,7,-88],'Procedural sfär som representerar aktuell destination, inte en färdig planetdesign.','P1');
 const planetMaterial=mat(0xb75537,.05,.95);planetMaterial.fog=false;const planet=mesh(planetGroup,new THREE.SphereGeometry(27,48,32),planetMaterial);
 const bands=mesh(planetGroup,new THREE.TorusGeometry(29,.12,6,96),cyan);bands.rotation.x=1.25;bands.rotation.z=.3;
 const stars=asset('TB-STARS-01','stars','Stjärnfält',[0,0,0],'Billig punktkuliss bakom orbitalfönstret. Behåll procedural eller ersätt med bakgrund.');
 const starData=[];let seed=314;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<500;i++)starData.push((random()-.5)*260,(random()-.25)*160,-140-random()*70);
 const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starData,3));geometries.add(starGeo);const starMat=new THREE.PointsMaterial({color:0xb9d9eb,size:.18,fog:false});materials.add(starMat);stars.add(new THREE.Points(starGeo,starMat));
 scene.add(new THREE.HemisphereLight(0xb0d9ef,0x172030,2));const sun=new THREE.DirectionalLight(0xffd4a0,3);sun.position.set(10,20,-40);scene.add(sun);
 for(const [x,z] of [[4,4],[-12,-10],[12,-15],[-14,14]]){const l=new THREE.PointLight(0x8bd7f0,90,25,2);l.position.set(x,6,z);scene.add(l);}
 const target=new THREE.Vector3(),dest=new THREE.Vector3();let view='hangar';
 function setView(id,snap=false){if(!TOUR_VIEWS[id])return;view=id;dest.fromArray(TOUR_VIEWS[id].position);if(snap){camera.position.copy(dest);target.fromArray(TOUR_VIEWS[id].target);camera.lookAt(target);}}
 setView('hangar',true);
 function update(dt,motion=true){camera.position.lerp(dest,motion?1-Math.exp(-4*dt):1);target.lerp(new THREE.Vector3(...TOUR_VIEWS[view].target),motion?1-Math.exp(-4*dt):1);camera.lookAt(target);camera.updateMatrixWorld();if(motion)holo.rotation.y+=dt*.2;}
 function manifest(){scene.updateMatrixWorld(true);return registry.map(({group,...entry})=>({...entry,rotation:group.rotation.toArray().slice(0,3),size:new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()).toArray().map(n=>+n.toFixed(2))}));}
 return {scene,camera,registry,ship,setView,update,manifest,setWorld(id){planetMaterial.color.setHex(TOUR_WORLDS[id].color);},dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}

import * as THREE from 'three';
export const OBSERVATION_ORIGIN=[-84,24,0];
export const OBSERVATION_SLOTS=[
 {id:'TB-OBS-PLANTER-01',type:'planter',position:[-8,0,-12],size:[5,1,2.4],yaw:0},
 {id:'TB-OBS-PLANTER-02',type:'planter',position:[-8,0,12],size:[5,1,2.4],yaw:0},
 {id:'TB-OBS-PLANTER-03',type:'planter',position:[5,0,-12],size:[5,1,2.4],yaw:0},
 {id:'TB-OBS-PLANTER-04',type:'planter',position:[5,0,12],size:[5,1,2.4],yaw:0},
 {id:'TB-OBS-BENCH-01',type:'bench',position:[0,0,-8],size:[3,.9,1],yaw:Math.PI/2},
 {id:'TB-OBS-BENCH-02',type:'bench',position:[0,0,8],size:[3,.9,1],yaw:Math.PI/2},
 {id:'TB-OBS-CONSOLE-01',type:'console',position:[-11,0,-7],size:[1.4,1.25,.7],yaw:Math.PI/2},
 {id:'TB-OBS-CONSOLE-02',type:'console',position:[-11,0,7],size:[1.4,1.25,.7],yaw:Math.PI/2},
];
// All geometry/materials are owned by the existing Tour Bus resource sets.
export function buildObservationDeck({asset,box,mesh,beam,mat,registry,scene,materials,geometries}){
 const origin=new THREE.Vector3(...OBSERVATION_ORIGIN);
 const shell=mat(0x1b2d39,.65,.48),panel=mat(0x3e515a,.65,.38),floor=mat(0x33434c,.65,.3),trim=mat(0xb59661,.75,.32),rubber=mat(0x0e1921,.15,.85),cushion=mat(0x24444a,.1,.8),soil=mat(0x182019,0,1),green=mat(0x35604b,0,.85);
 const warm=mat(0xffd297,.1,.4);warm.emissive.set(0xffb963);warm.emissiveIntensity=2;
 const cool=mat(0x8bddd8,.1,.4);cool.emissive.set(0x71cec9);cool.emissiveIntensity=1.3;
 function group(id,kind,label,pos,description,priority='P1'){
  const g=asset(id,kind,label,origin.clone().add(new THREE.Vector3(...pos)).toArray(),description,priority);registry.at(-1).zoneId='06';return g;
 }
 function reuse(id,pos){const row=registry.find(r=>r.id===id);const g=row.group;g.clear();g.position.copy(origin).add(new THREE.Vector3(...pos));g.rotation.set(0,0,0);g.scale.set(1,1,1);row.zoneId='06';return g;}
 function tube(g,points,r,material){return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,8,false),material);}
 const archPoints=(x,offset=0)=>Array.from({length:33},(_,i)=>{const a=i*Math.PI/32;return new THREE.Vector3(x,2+(11+offset)*Math.sin(a),(16+offset)*Math.cos(a));});
 const room=group('TB-ROOM-06','room','Observation: välvt rumsskal',[0,0,0],'34 × 34 m golv, välvt tak och slutna sidoväggar; panoramat öppnar mot babord.');
 box(room,[34,.5,34],[0,-.25,0],floor);
 for(const side of [-1,1])box(room,[34,2,.5],[0,1,side*16.6],shell);
 box(room,[.5,13,34],[17,6.5,0],shell);
 // Curved ceiling skin, with inward/outward faces and UVs for later PBR material.
 const vertices=[],uv=[],indices=[];
 for(let i=0;i<=48;i++){const a=i*Math.PI/48;for(const x of [-17,17]){vertices.push(x,2+11.65*Math.sin(a),16.65*Math.cos(a));uv.push((x+17)/4,i/48*12);}}
 for(let i=0;i<48;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const roofMat=shell.clone();roofMat.side=THREE.DoubleSide;materials.add(roofMat);mesh(room,geo,roofMat);
 const joints=[];for(let n=-16;n<=16;n+=2){joints.push(-16.8,.012,n,16.8,.012,n,n,.012,-16.8,n,.012,16.8);}
 const jointGeo=new THREE.BufferGeometry();jointGeo.setAttribute('position',new THREE.Float32BufferAttribute(joints,3));geometries.add(jointGeo);const jointMat=new THREE.LineBasicMaterial({color:0x101b23});materials.add(jointMat);room.add(new THREE.LineSegments(jointGeo,jointMat));
 for(const z of [-10,10]){box(room,[30,.025,.3],[0,.025,z],trim);box(room,[30,.03,.045],[0,.045,z-.2],warm);}
 const window=reuse('TB-WINDOW-01',[-16,0,0]);
 registry.find(r=>r.id==='TB-WINDOW-01').description='Öppen 32 m panoramaram med elliptiskt valv och tre lager metall/ljustätning; fri central planetvy.';
 for(const x of [0,.7,1.4]){tube(window,archPoints(x),x===.7?.14:.42,x===.7?warm:trim);for(const side of [-1,1])box(window,[.7,2,.8],[x,1,side*16],panel);}
 box(window,[1.8,.5,32],[.7,.25,0],panel);
 for(const [i,x] of [-7,5,15].entries()){
  const rib=group(`TB-OBS-RIB-0${i+1}`,'rib','Observationsvalv',[x,0,0],'Elliptiskt bärverk med varm integrerad ljuslist och låga pelarfötter.');
  tube(rib,archPoints(0),.48,panel);tube(rib,archPoints(-.45,-.15),.055,warm);
  for(const side of [-1,1]){box(rib,[1,2,1],[0,1,side*16],shell);box(rib,[1.7,.3,1.7],[0,.15,side*16],trim);}
 }
 // Longitudinal ceiling battens and luminous insets create depth without props.
 const ceiling=group('TB-OBS-CEILING','architecture','Takpaneler och ljuslister',[0,0,0],'Längsgående takribbor, varma ljusfält och panelindelning under det välvda taket.');
 for(let i=1;i<12;i++){const a=i*Math.PI/12,y=2+11.55*Math.sin(a),z=16.55*Math.cos(a);beam(ceiling,[-16,y,z],[16,y,z],.09,trim);}
 for(const x of [-12,-1,10])for(const side of [-1,1]){const a=side<0?Math.PI*.23:Math.PI*.77;const light=box(ceiling,[3,.08,.4],[x,2+11.3*Math.sin(a),16.3*Math.cos(a)],warm);light.rotation.x=a-Math.PI/2;}
 const rail=reuse('TB-RAIL-01',[0,0,0]);
 registry.find(r=>r.id==='TB-RAIL-01').description='Böjt 30 m observationsräcke, 1,15 m högt, med metallstolpar och tunna horisontella stag.';
 const railX=z=>-14+z*z*.008;
 for(const y of [.22,.6,1.15])tube(rail,Array.from({length:31},(_,i)=>{const z=-15+i;return new THREE.Vector3(railX(z),y,z);}),y===1.15?.065:.025,y===1.15?trim:panel);
 for(let z=-15;z<=15;z+=2.5){beam(rail,[railX(z),.05,z],[railX(z),1.16,z],.04,panel);box(rail,[.24,.06,.24],[railX(z),.03,z],trim);}
 const door=group('TB-DOOR-06','door','Panoramahissens tröskel',[16.65,0,0],'Markerad stängd hissport mot Nexus, med dubbla dörrblad och infälld tröskel.');
 for(const z of [-1,1])box(door,[.2,3.8,1.9],[-.1,1.9,z],panel);
 for(const z of [-2.1,2.1])box(door,[.3,4.2,.12],[-.25,2.1,z],warm);box(door,[.8,.06,4.4],[-.45,.03,0],trim);
 for(const slot of OBSERVATION_SLOTS){
  const g=group(slot.id,slot.type,`Observation: ${slot.type}`,slot.position,'Utbytbar inredningsplatshållare; byt gruppens innehåll med matchande GLB enligt observationsdäckets assetlista.','P2');g.rotation.y=slot.yaw;g.userData.assetSlot=slot.type;
  if(slot.type==='planter'){
   box(g,slot.size,[0,.5,0],shell);box(g,[4.8,.08,2.2],[0,1.02,0],trim);box(g,[4.5,.1,1.9],[0,1.04,0],soil);box(g,[4.6,.06,.06],[0,.25,1.22],cool);
   // Explicit vegetation proxies, replaced by one shared foliage GLB later.
   for(const x of [-1.6,0,1.6]){beam(g,[x,1.1,0],[x,2.8,0],.035,trim);for(let i=0;i<5;i++){const leaf=mesh(g,new THREE.SphereGeometry(1,8,6),green,[x+Math.sin(i*2)*.35,1.5+i*.3,Math.cos(i*2)*.3]);leaf.scale.set(.55,.12,.25);leaf.rotation.z=(i%2?1:-1)*.45;}}
  }else if(slot.type==='bench'){
   box(g,[3,.3,1],[0,.55,0],cushion);box(g,[3,.4,.15],[0,.85,.45],cushion);for(const x of [-1.1,1.1])box(g,[.15,.4,.8],[x,.2,0],trim);
  }else{
   box(g,[.65,.9,.5],[0,.45,0],shell);const top=box(g,[1.4,.12,.7],[0,1.12,0],panel);top.rotation.x=.3;const screen=box(g,[1.15,.015,.5],[0,1.2,0],cool);screen.rotation.x=.3;
  }
 }
 const light=new THREE.PointLight(0xffd49e,220,35,2);light.position.copy(origin).add(new THREE.Vector3(-4,7,0));light.name='TB-OBS-LIGHT';scene.add(light);
 const fill=new THREE.PointLight(0xa2d5ed,130,30,2);fill.position.copy(origin).add(new THREE.Vector3(-14,7,0));fill.name='TB-OBS-FILL';scene.add(fill);
 return {room,slots:OBSERVATION_SLOTS};
}

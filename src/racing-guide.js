import { getTrackWidth } from './track-path.js';
import * as THREE from 'three';
import { getTrackFrame, getRacerFrame, getRacerWidth, advanceRouteDistance, gapAt } from './track-path.js';

const clamp = THREE.MathUtils.clamp;
export const GUIDE = Object.freeze({ spacing: 7, points: 65, lateralAcceleration: 95, brakeAcceleration: 28 });

// A geometric recommendation, not an optimal-control solver. Reduce curvature
// within safe road margins, attract to reachable pads and compare route estimates.
function buildProfile(length, frameAt, widthAt, pads, isGap, closed, topSpeed) {
  pads = pads.filter(p=>p.type !== 'brake');
  const count = clamp(Math.ceil(length / 6), 40, 2400), step = length/count;
  const nodes = Array.from({length:count+1},(_,i) => {
    const u=i/count, frame=frameAt(u), edge=Math.max(0,widthAt(u)/2-2.1);
    const before=frameAt(Math.max(0,u-0.006)), after=frameAt(Math.min(1,u+0.006));
    const span=Math.max(0.001,Math.min(1,u+0.006)-Math.max(0,u-0.006))*length;
    const curvature=Math.atan2(after.tangent.dot(frame.right)-before.tangent.dot(frame.right),
      Math.max(0.05,after.tangent.dot(before.tangent)))/span;
    let pad=null, near=Infinity;
    for (const p of pads) { let d=Math.abs(p.u-u)*length; if(closed)d=Math.min(d,length-d); if(d<near){near=d;pad=p;} }
    const gapNear=[-55,0,55].some(d=>isGap(u+d/length));
    return {u,frame,edge,lane:0,curvature,gap:isGap(u),fixed:gapNear,
      pad:pad && near<45 && Math.abs(curvature)<0.025 ? clamp(pad.offset,-edge,edge) : 0,
      padWeight:pad && near<45 && Math.abs(curvature)<0.025 ? Math.exp(-near*near/450) : 0,
      speed:clamp(Math.sqrt(GUIDE.lateralAcceleration/Math.max(0.0001,Math.abs(curvature))),65,topSpeed*1.5)};
  });
  for (let pass=0;pass<60;pass++) {
    const offsets=nodes.map((node,i)=> {
      if(node.fixed || (!closed && (i===0||i===count)))return 0;
      const prev=nodes[i===0?count-1:i-1], next=nodes[i===count?1:i+1];
      const midpoint=prev.frame.center.clone().addScaledVector(prev.frame.right,prev.lane)
        .add(next.frame.center).addScaledVector(next.frame.right,next.lane).multiplyScalar(0.5);
      const smooth=midpoint.sub(node.frame.center).dot(node.frame.right);
      return clamp(THREE.MathUtils.lerp(THREE.MathUtils.lerp(node.lane,smooth,0.4),node.pad,node.padWeight*0.2),-node.edge,node.edge);
    });
    nodes.forEach((n,i)=>{n.lane=offsets[i];});
    if(closed)nodes[count].lane=nodes[0].lane;
  }
  // A pad attraction must not demand an abrupt sideways jump, especially when
  // the launch corridor is fixed to the centre. Bound the line's lateral slope.
  for(let pass=0;pass<3;pass++) {
    for(const direction of [1,-1]) for(let j=0;j<=count;j++) {
      const i=direction===1?j:count-j,node=nodes[i];
      if(node.fixed)continue;
      const previous=i-direction;
      if(!closed&&(previous<0||previous>count))continue;
      const neighbor=nodes[previous<0?count-1:previous>count?1:previous];
      node.lane=clamp(node.lane,neighbor.lane-step*.14,neighbor.lane+step*.14);
    }
    if(closed)nodes[count].lane=nodes[0].lane;
  }
  return { nodes, length, step, at(u) {
    u=clamp(u,0,1); const t=u*count, i=Math.min(count-1,Math.floor(t)),f=t-i,a=nodes[i],b=nodes[i+1];
    return { lane:THREE.MathUtils.lerp(a.lane,b.lane,f),speed:THREE.MathUtils.lerp(a.speed,b.speed,f),
      curvature:THREE.MathUtils.lerp(a.curvature,b.curvature,f) };
  }};
}
export function createRacingGuide(curve,pads=[],topSpeed=143) {
  const length=curve.getLength(), wrap=u=>((u%1)+1)%1;
  const main=buildProfile(length,u=>getTrackFrame(curve,u),u=>getTrackWidth(curve,u),
    pads.filter(p=>!p.routeId).map(p=>({...p,u:p.d/length})),u=>!!gapAt(curve,wrap(u)*length),true,topSpeed);
  const branches=new Map();
  for(const b of curve.track.branches??[]) {
    const profile=buildProfile(b.length,b.frame,b.widthAt,
      pads.filter(p=>p.routeId===b.id).map(p=>({...p,u:(p.d/length-b.start)/(b.end-b.start)})),()=>false,false,topSpeed);
    const branchTime=profile.nodes.reduce((sum,n)=>sum+profile.step/n.speed,0);
    let mainTime=0;
    for(let d=b.start*length;d<b.end*length;d+=6)mainTime+=Math.min(6,b.end*length-d)/main.at(d/length).speed;
    branches.set(b.id,{...profile,recommended:branchTime<mainTime*0.97,branch:b});
  }
  function at(ship) {
    const u=wrap(ship.distance/length), branch=ship.route && branches.get(ship.route.id);
    if(branch) {
      const t=clamp((u-branch.branch.start)/(branch.branch.end-branch.branch.start),0,1), sample=branch.at(t);
      // Join the approach lane continuously, then move onto the branch line.
      const entry=branch.branch.side*getTrackWidth(curve,branch.branch.start)*0.26;
      sample.lane=THREE.MathUtils.lerp(entry,sample.lane,Math.min(1,t*branch.length/60));
      sample.lane*=Math.min(1,(1-t)*branch.length/50);
      return sample;
    }
    const sample=main.at(u);
    for(const profile of branches.values()) {
      const b=profile.branch, ahead=(b.start-u)*length;
      if(ahead>=0 && ahead<200) {
        const target=b.side*getTrackWidth(curve,b.start)*(profile.recommended?0.26:-0.18);
        sample.lane=THREE.MathUtils.lerp(sample.lane,target,1-THREE.MathUtils.smoothstep(ahead,0,200));
      }
      const after=(u-b.end)*length;
      if(after>=0 && after<50)sample.lane*=THREE.MathUtils.smoothstep(after,0,50);
    }
    return sample;
  }
  function ahead(ship, count=GUIDE.points) {
    const state={distance:ship.distance,lateralOffset:ship.lateralOffset,route:ship.route?{...ship.route}:null,
      routeDecision:ship.routeDecision??'',routeEntries:0,routeMerges:0,flight:null};
    const points=[];
    for(let i=0;i<count;i++) {
      const sample=at(state), width=getRacerWidth(curve,state), frame=getRacerFrame(curve,state);
      const lane=clamp(sample.lane,-Math.max(0,width/2-2.1),Math.max(0,width/2-2.1));
      points.push({...sample,lane,frame,distance:state.distance,ahead:i*GUIDE.spacing,
        routeId:state.route?.id??null,gap:!state.route&&!!gapAt(curve,state.distance),
        position:frame.center.clone().addScaledVector(frame.right,lane).addScaledVector(frame.normal,0.17)});
      state.lateralOffset=lane;
      advanceRouteDistance(curve,state,GUIDE.spacing);
    }
    // Backward braking envelope colours the approach, not just the corner apex.
    for(let i=points.length-2;i>=0;i--)points[i].speed=Math.min(points[i].speed,
      Math.sqrt(points[i+1].speed**2+2*GUIDE.brakeAcceleration*GUIDE.spacing));
    return points;
  }
  function warning(points,speed) {
    const horizon=clamp(speed*1.9,60,330);
    // Prefer gaps. Turn direction is local cockpit left/right, including banking.
    const jump=points.find(p=>p.gap&&p.ahead>0&&p.ahead<horizon);
    if(jump)return {kind:'gap',text:`GAP · HOLD YOUR LINE · ${Math.round(jump.ahead*3.25)} M`};
    const turn=points.find(p=>p.ahead>=21&&p.ahead<horizon&&Math.abs(p.curvature)>0.0065);
    if(!turn)return null;
    const side=turn.curvature>0?'← LEFT':'RIGHT →', brake=speed>turn.speed*1.05;
    return {kind:brake?'brake':'turn',text:`${side} · ${brake?'BRAKE':'SHARP TURN'} · ${Math.round(turn.ahead*3.25)} M`};
  }
  return {main,branches,at,ahead,warning};
}

export function createGuideView(scene) {
  const geometry=new THREE.BufferGeometry(), capacity=(GUIDE.points-1)*6;
  const positions=new Float32Array(capacity*3), colors=new Float32Array(capacity*3);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setDrawRange(0,0);
  const material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.68,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);
  const color=new THREE.Color();
  return {mesh,update(points,speed,visible) {
    mesh.visible=visible;if(!visible)return;
    let vertex=0;
    for(let i=0;i<points.length-1;i++) {
      const a=points[i],b=points[i+1];
      if(a.gap||b.gap||b.position.distanceTo(a.position)>GUIDE.spacing*3)continue;
      color.set(speed>a.speed*1.1?0xff5574:speed>a.speed*0.93?0xffc66b:0x58efe0);
      const half=i%3===0?0.38:0.17;
      for(const [p,side] of [[a,-1],[a,1],[b,1],[a,-1],[b,1],[b,-1]]) {
        positions[vertex*3]=p.position.x+p.frame.right.x*half*side;
        positions[vertex*3+1]=p.position.y+p.frame.right.y*half*side;
        positions[vertex*3+2]=p.position.z+p.frame.right.z*half*side;
        colors[vertex*3]=color.r;colors[vertex*3+1]=color.g;colors[vertex*3+2]=color.b;vertex++;
      }
    }
    geometry.setDrawRange(0,vertex);geometry.attributes.position.needsUpdate=geometry.attributes.color.needsUpdate=true;
  },dispose(){scene.remove(mesh);geometry.dispose();material.dispose();}};
}

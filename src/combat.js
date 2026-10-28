import * as THREE from 'three';
import { getRacerFrame } from './track-path.js';
import { registerImpact } from './race-interactions.js';

export const WEAPONS = {
  rocket: {name:'ROCKET',clip:3,cooldown:1.7,reload:5,speed:160,life:2.6,loss:0.16,knock:3.5,color:0xffa044},
  homing: {name:'HOMING',clip:1,cooldown:2.1,reload:7,speed:120,life:3.4,loss:0.6,knock:12.5,color:0xff51ae},
  minigun: {name:'MINIGUN',clip:30,cooldown:0.11,reload:4,speed:600,life:0.65,loss:0.035,knock:0.7,color:0x8cffff},
};
export const COMBAT = {maxProjectiles:48,maxEffects:24,lockSeconds:0.9,range:280,lockCone:0.965,turnRate:2.1};
const clamp=THREE.MathUtils.clamp;
function newState(weapon='rocket') {
  return {weapon,ammo:Object.fromEntries(Object.entries(WEAPONS).map(([id,w])=>[id,w.clip])),
    reload:{rocket:0,homing:0,minigun:0},cooldown:0,protection:0,lockTarget:null,lockTime:0,
    incoming:false,targeted:false,shots:0,hits:0,hitsTaken:0,aiTimer:1.5,flash:0};
}
const eligible=r=>!r.finished && r.physics.recoveryTimer<=0;
const point=r=>r.group.position.clone().addScaledVector(r.frame.normal,0.6);

export function createCombat() {
  return {
    enabled:false,states:new Map(),projectiles:[],effects:[],events:[],serial:0,
    reset(enabled,racers=[]) {
      this.enabled=enabled;this.states.clear();this.projectiles.length=0;this.effects.length=0;this.events.length=0;this.serial=0;
      racers.forEach((r,i)=>this.states.set(r.id,newState(r.player?'rocket':Object.keys(WEAPONS)[i%3])));
    },
    select(id,weapon) {const s=this.states.get(id);if(s && WEAPONS[weapon]){s.weapon=weapon;s.lockTime=0;s.lockTarget=null;}},
    effect(position,color,size=1) {
      if(this.effects.length>=COMBAT.maxEffects)this.effects.shift();
      this.effects.push({position:position.clone(),color,life:0.35,size});
    },
    step(dt,racers,curve,{active=true,fire=false,blocked=()=>false}={}) {
      this.events.length=0;
      if(!this.enabled || !(dt>0))return;
      if(!active){this.projectiles.length=0;this.effects.length=0;for(const s of this.states.values()){s.lockTime=0;s.lockTarget=null;s.incoming=s.targeted=false;}return;}
      const steps=Math.ceil(dt/(1/120));
      for(let i=0;i<steps;i++)this.tick(dt/steps,racers,curve,fire,blocked,i/steps,(i+1)/steps);
    },
    tick(dt,racers,curve,fire,blocked,startFraction,endFraction) {
      const byId=new Map(racers.map(r=>[r.id,r]));
      for(const r of racers) {
        r.frame=getRacerFrame(curve,r.physics);
        if(r.physics.flight) r.frame={...r.frame,normal:r.physics.flight.up,tangent:r.physics.flight.velocity.clone().normalize()};
        if(!this.states.has(r.id))this.states.set(r.id,newState());
        const s=this.states.get(r.id);s.incoming=s.targeted=false;s.cooldown=Math.max(0,s.cooldown-dt);s.protection=Math.max(0,s.protection-dt);s.flash=Math.max(0,s.flash-dt);
        for(const id of Object.keys(WEAPONS))if(s.reload[id]>0){s.reload[id]=Math.max(0,s.reload[id]-dt);if(s.reload[id]===0)s.ammo[id]=WEAPONS[id].clip;}
      }
      for(const r of racers) {
        const s=this.states.get(r.id);if(!eligible(r)){s.lockTarget=null;s.lockTime=0;continue;}
        const origin=point(r), forward=r.physics.handlingMode==='wipeout'
          ? new THREE.Vector3(0,0,1).applyQuaternion(r.group.quaternion).normalize() : r.frame.tangent;
        let candidate=null,nearest=COMBAT.range;
        for(const other of racers) {
          if(other===r || !eligible(other))continue;
          const direction=point(other).sub(origin),distance=direction.length();
          if(distance<4 || distance>=nearest || direction.normalize().dot(forward)<COMBAT.lockCone || blocked(origin,point(other)))continue;
          nearest=distance;candidate=other;
        }
        if(s.weapon==='homing' && candidate) {
          if(s.lockTarget!==candidate.id){s.lockTarget=candidate.id;s.lockTime=0;}
          s.lockTime=Math.min(COMBAT.lockSeconds,s.lockTime+dt);
          this.states.get(candidate.id).targeted=true;
        } else {s.lockTarget=null;s.lockTime=0;}
        let trigger=r.player?fire:false;
        if(!r.player){s.aiTimer-=dt;trigger=s.aiTimer<=0 && !!candidate && (s.weapon==='homing'||point(candidate).sub(origin).normalize().dot(forward)>0.996);}
        if(trigger && this.shoot(r,origin,forward,blocked)) {
          if(!r.player)s.aiTimer=s.weapon==='minigun'?0.18:1.2+(r.physics.mass??1)*0.3;
        }
      }
      const surviving=[];
      for(const p of this.projectiles) {
        p.life-=dt;if(p.life<=0)continue;
        const owner=byId.get(p.owner),target=byId.get(p.target);
        if(!owner || !eligible(owner))continue;
        if(p.type==='homing' && target && eligible(target) && !blocked(p.position,point(target))) {
          const desired=point(target).sub(p.position).normalize(), direction=p.velocity.clone().normalize();
          const rotation=new THREE.Quaternion().setFromUnitVectors(direction,desired);
          const angle=2*Math.acos(clamp(Math.abs(rotation.w),-1,1));
          direction.applyQuaternion(new THREE.Quaternion().slerp(rotation,Math.min(1,COMBAT.turnRate*dt/Math.max(angle,1e-6))));
          p.velocity.copy(direction).multiplyScalar(p.speed);this.states.get(target.id).incoming=true;
        }
        const old=p.position.clone(),next=old.clone().addScaledVector(p.velocity,dt);
        // Use relative swept segments, including target movement during this tick.
        let victim=null,hitAt=Infinity;
        for(const r of racers) {
          if(r.id===p.owner || !eligible(r))continue;
          const before=r.physics.previousPosition.clone().lerp(r.group.position,startFraction).addScaledVector(r.frame.normal,0.6);
          const after=r.physics.previousPosition.clone().lerp(r.group.position,endFraction).addScaledVector(r.frame.normal,0.6);
          const a=old.clone().sub(before),v=next.clone().sub(after).sub(a),radius=p.type==='minigun'?1.55:2;
          const aa=v.lengthSq(),bb=2*a.dot(v),cc=a.lengthSq()-radius*radius,disc=bb*bb-4*aa*cc;
          let t=cc<=0?0:aa>1e-9&&disc>=0?(-bb-Math.sqrt(disc))/(2*aa):Infinity;
          if(t>=0&&t<=1&&t<hitAt){hitAt=t;victim=r;}
        }
        const end= victim ? old.clone().lerp(next,hitAt) : next;
        if(blocked(old,end)){this.effect(end,0xffc56e);continue;}
        if(victim){this.hit(p,victim,curve);this.effect(end,WEAPONS[p.type].color,p.type==='minigun'?0.4:1);continue;}
        p.position.copy(next);surviving.push(p);
      }
      this.projectiles=surviving;
      this.effects=this.effects.filter(e=>(e.life-=dt)>0);
    },
    shoot(r,origin,forward,blocked=()=>false) {
      const s=this.states.get(r.id),w=WEAPONS[s.weapon];
      if(s.cooldown>0||s.ammo[s.weapon]<=0||this.projectiles.length>=COMBAT.maxProjectiles)return false;
      if(s.weapon==='homing'&&s.lockTime<COMBAT.lockSeconds)return false;
      const speed=r.physics.speed+w.speed;
      const muzzle=origin.clone().addScaledVector(forward,4);
      if(blocked(origin,muzzle))this.effect(muzzle,w.color);
      else this.projectiles.push({id:++this.serial,owner:r.id,type:s.weapon,target:s.weapon==='homing'?s.lockTarget:null,
        position:muzzle,velocity:forward.clone().multiplyScalar(speed),speed,life:w.life});
      s.ammo[s.weapon]--;s.cooldown=w.cooldown;s.shots++;s.flash=0.08;
      this.events.push({owner:r.id,weapon:s.weapon});
      if(!s.ammo[s.weapon])s.reload[s.weapon]=w.reload;
      return true;
    },
    hit(projectile,victim,curve) {
      const state=this.states.get(victim.id);if(state.protection>0)return;
      const w=WEAPONS[projectile.type],ship=victim.physics,frame=getRacerFrame(curve,ship);
      state.protection=projectile.type==='minigun'?0.18:0.85;state.hitsTaken++;
      this.states.get(projectile.owner).hits++;
      const side=clamp(projectile.velocity.clone().normalize().dot(frame.right),-1,1);
      ship.speed=Math.max(12,ship.speed*(1-w.loss));
      ship.lateralVelocity=clamp(ship.lateralVelocity+side*w.knock,-15,15);
      if(ship.flight){ship.flight.velocity.multiplyScalar(1-w.loss).addScaledVector(frame.right,side*w.knock*2);ship.velocity.copy(ship.flight.velocity);}
      registerImpact(ship,projectile.type==='minigun'?0.14:0.55,side);
    },
  };
}

export function createCombatView(scene) {
  const group=new THREE.Group();scene.add(group);
  const material=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:false,toneMapped:false});
  const bullets=new THREE.InstancedMesh(new THREE.SphereGeometry(0.5,8,6),material,COMBAT.maxProjectiles);
  const bursts=new THREE.InstancedMesh(new THREE.SphereGeometry(0.5,12,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.65,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),COMBAT.maxEffects);
  bullets.count=bursts.count=0;bullets.frustumCulled=bursts.frustumCulled=false;group.add(bullets,bursts);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),z=new THREE.Vector3(0,0,1);
  return {update(combat){
    group.visible=combat.enabled;bullets.count=combat.projectiles.length;
    combat.projectiles.forEach((p,i)=>{rotation.setFromUnitVectors(z,p.velocity.clone().normalize());scale.setScalar(p.type==='minigun'?0.10:0.28);scale.z=p.type==='minigun'?2:1.2;matrix.compose(p.position,rotation,scale);bullets.setMatrixAt(i,matrix);bullets.setColorAt(i,new THREE.Color(WEAPONS[p.type].color));});
    bursts.count=combat.effects.length;
    combat.effects.forEach((e,i)=>{scale.setScalar((0.4+(0.35-e.life)*9)*e.size);matrix.compose(e.position,new THREE.Quaternion(),scale);bursts.setMatrixAt(i,matrix);bursts.setColorAt(i,new THREE.Color(e.color).multiplyScalar(e.life/0.35));});
    for(const mesh of [bullets,bursts]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  },dispose(){scene.remove(group);for(const m of [bullets,bursts]){m.dispose();m.geometry.dispose();m.material.dispose();}}};
}

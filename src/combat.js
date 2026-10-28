import { pickupSnapshot, pickupCrossing, WEAPON_PAD_COOLDOWN } from './weapon-pickups.js';
import * as THREE from 'three';
import { getRacerFrame } from './track-path.js';
import { registerImpact } from './race-interactions.js';

export const WEAPONS = {
  rocket: {name:'ROCKET',clip:3,cooldown:1.7,speed:160,life:2.6,loss:0.16,knock:3.5,color:0xffa044},
  homing: {name:'HOMING',clip:1,cooldown:2.1,speed:120,life:3.4,loss:0.6,knock:12.5,color:0xff51ae},
  minigun: {name:'MINIGUN',clip:30,cooldown:0.11,speed:600,life:0.65,loss:0.035,knock:0.7,color:0x8cffff},
};
export const COMBAT = {maxProjectiles:48,maxEffects:24,lockSeconds:0.9,range:280,lockCone:0.965,turnRate:2.1};
export const FLARES = Object.freeze({cooldown:25, duration:1.2, range:140, cpuRange:85});
const clamp=THREE.MathUtils.clamp;
function newState(weapon=null) {
  return {weapon,ammo:Object.fromEntries(Object.entries(WEAPONS).map(([id])=>[id,0])),
    pickups:0,pickupTime:0,lastPickup:null,padPassages:Object.create(null),cooldown:0,protection:0,lockTarget:null,lockTime:0,
    flareCooldown:0,flareTime:0,flareUses:0,deflected:0,deflectedTime:0,
    incoming:false,targeted:false,shots:0,hits:0,hitsTaken:0,aiTimer:1.5,flash:0};
}
const eligible=r=>!r.finished && r.physics.recoveryTimer<=0;
const point=r=>r.group.position.clone().addScaledVector(r.frame.normal,0.6);

export function createCombat() {
  return {
    enabled:false,weaponPads:[],padReadyAt:new Map(),movement:new Map(),time:0,states:new Map(),projectiles:[],effects:[],events:[],serial:0,
    reset(enabled,racers=[],weaponPads=[]) {
      this.enabled=enabled;this.weaponPads=enabled?weaponPads:[];this.padReadyAt.clear();this.movement.clear();this.time=0;this.states.clear();this.projectiles.length=0;this.effects.length=0;this.events.length=0;this.serial=0;
      racers.forEach(r=>this.states.set(r.id,newState()));
    },
    equip(id,weapon) {
      const s=this.states.get(id);if(!this.enabled || !s || !WEAPONS[weapon])return;
      s.weapon=weapon;for(const type of Object.keys(WEAPONS))s.ammo[type]=type===weapon?WEAPONS[type].clip:0;
      s.lockTime=0;s.lockTarget=null;
    },
    capture(racers) {this.movement.clear();if(this.enabled)for(const r of racers)this.movement.set(r.id,pickupSnapshot(r.physics));},
    padReady(id) {return (this.padReadyAt.get(id)??0)<=this.time;},
    collectPickups(dt,racers,curve) {
      const candidates=[];
      for(const r of racers){
        if(!eligible(r))continue;
        const p=r.physics,before=this.movement.get(r.id)??{...pickupSnapshot(p),distance:p.previousDistance,lane:p.previousLateralOffset,height:p.previousVerticalOffset};
        const s=this.states.get(r.id);if(!s)continue;
        for(const pad of this.weaponPads){const crossing=pickupCrossing(p,before,pad,curve);
          if(crossing && s.padPassages[pad.id]!==crossing.lap)candidates.push({r,pad,...crossing});}
      }
      candidates.sort((a,b)=>a.fraction-b.fraction||a.r.id.localeCompare(b.r.id));
      for(const {r,pad,lap,fraction} of candidates){
        const time=this.time+dt*fraction;if((this.padReadyAt.get(pad.id)??0)>time)continue;
        const s=this.states.get(r.id);this.equip(r.id,pad.weapon);s.pickups++;s.pickupTime=2;s.lastPickup=pad.weapon;s.padPassages[pad.id]=lap;
        this.padReadyAt.set(pad.id,time+WEAPON_PAD_COOLDOWN);this.events.push({kind:'pickup',owner:r.id,weapon:pad.weapon});
      }
      this.movement.clear();this.time+=dt;
    },
    effect(position,color,size=1,kind='impact') {
      if(this.effects.length>=COMBAT.maxEffects)this.effects.shift();
      const duration=kind==='flare'?1.2:0.65;
      this.effects.push({position:position.clone(),color,life:duration,duration,size,kind});
    },
    step(dt,racers,curve,{active=true,fire=false,flares=false,blocked=()=>false}={}) {
      this.events.length=0;
      if(!this.enabled || !(dt>0))return;
      if(!active){this.projectiles.length=0;this.effects.length=0;for(const s of this.states.values()){s.lockTime=0;s.lockTarget=null;s.incoming=s.targeted=false;}return;}
      this.collectPickups(dt,racers,curve);
      if(flares) {const player=racers.find(r=>r.player);if(player)this.deployFlares(player,curve);}
      const steps=Math.ceil(dt/(1/120));
      for(let i=0;i<steps;i++)this.tick(dt/steps,racers,curve,fire,blocked,i/steps,(i+1)/steps);
    },
    tick(dt,racers,curve,fire,blocked,startFraction,endFraction) {
      const byId=new Map(racers.map(r=>[r.id,r]));
      for(const r of racers) {
        r.frame=getRacerFrame(curve,r.physics);
        if(r.physics.flight) r.frame={...r.frame,normal:r.physics.flight.up,tangent:r.physics.flight.velocity.clone().normalize()};
        if(!this.states.has(r.id))this.states.set(r.id,newState());
        const s=this.states.get(r.id);s.incoming=s.targeted=false;s.cooldown=Math.max(0,s.cooldown-dt);s.protection=Math.max(0,s.protection-dt);s.flash=Math.max(0,s.flash-dt);s.pickupTime=Math.max(0,s.pickupTime-dt);
        s.flareCooldown=Math.max(0,s.flareCooldown-dt);s.flareTime=Math.max(0,s.flareTime-dt);s.deflectedTime=Math.max(0,s.deflectedTime-dt);
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
      for(const r of racers) {
        const s=this.states.get(r.id);
        if(!r.player && eligible(r) && this.projectiles.some(p=>p.type==='homing' && p.target===r.id && p.position.distanceTo(r.group.position)<FLARES.cpuRange)) this.deployFlares(r,curve);
        if(s.flareTime<=0 || !eligible(r)) continue;
        for(const p of this.projectiles) {
          if(p.type!=='homing' || p.target!==r.id || p.position.distanceTo(r.group.position)>FLARES.range) continue;
          p.target=null;p.decoy=s.flarePosition.clone();p.life=Math.min(p.life,1.2);
          s.deflected++;s.deflectedTime=1.5;
          this.events.push({kind:'deflect',owner:r.id});
        }
      }
      const surviving=[];
      for(const p of this.projectiles) {
        p.life-=dt;if(p.life<=0)continue;
        const owner=byId.get(p.owner),target=byId.get(p.target);
        if(!owner || !eligible(owner))continue;
        if(p.decoy) {
          const delta=p.decoy.clone().sub(p.position);
          if(delta.length()<p.speed*dt+2){this.effect(p.decoy,0xffc65c,0.7);continue;}
          p.velocity.copy(delta.normalize()).multiplyScalar(p.speed);
        }
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
          if(p.decoy || r.id===p.owner || !eligible(r))continue;
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
    deployFlares(r,curve) {
      const s=this.states.get(r.id);
      if(!this.enabled || !s || s.flareCooldown>0 || !eligible(r)) return false;
      const frame=getRacerFrame(curve,r.physics);
      s.flareCooldown=FLARES.cooldown;s.flareTime=FLARES.duration;s.flareUses++;
      s.flarePosition=r.group.position.clone().addScaledVector(frame.tangent,-9).addScaledVector(frame.right,7).addScaledVector(frame.normal,3);
      this.effect(s.flarePosition,0xffb642,1.5,'flare');
      this.events.push({kind:'flare',owner:r.id});return true;
    },
    shoot(r,origin,forward,blocked=()=>false) {
      const s=this.states.get(r.id),w=WEAPONS[s.weapon];
      if(!w||s.cooldown>0||s.ammo[s.weapon]<=0||this.projectiles.length>=COMBAT.maxProjectiles)return false;
      if(s.weapon==='homing'&&s.lockTime<COMBAT.lockSeconds)return false;
      const speed=r.physics.speed+w.speed;
      const muzzle=origin.clone().addScaledVector(forward,4);
      if(blocked(origin,muzzle))this.effect(muzzle,w.color);
      else this.projectiles.push({id:++this.serial,owner:r.id,type:s.weapon,target:s.weapon==='homing'?s.lockTarget:null,
        position:muzzle,velocity:forward.clone().multiplyScalar(speed),speed,life:w.life});
      s.ammo[s.weapon]--;s.cooldown=w.cooldown;s.shots++;s.flash=0.08;
      this.events.push({kind:'shot',owner:r.id,weapon:s.weapon});
      if(!s.ammo[s.weapon]){s.weapon=null;s.lockTarget=null;s.lockTime=0;}
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
  const sparks=new THREE.InstancedMesh(new THREE.SphereGeometry(0.5,5,3),new THREE.MeshBasicMaterial({color:0xffffff,blending:THREE.AdditiveBlending,transparent:true,opacity:0.85,depthWrite:false,toneMapped:false}),COMBAT.maxEffects*24);
  sparks.count=0;sparks.frustumCulled=false;group.add(sparks);
  const sparkPosition=new THREE.Vector3(),direction=new THREE.Vector3(),color=new THREE.Color();
  bullets.count=bursts.count=0;bullets.frustumCulled=bursts.frustumCulled=false;group.add(bullets,bursts);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),z=new THREE.Vector3(0,0,1);
  return {update(combat){
    group.visible=combat.enabled;bullets.count=combat.projectiles.length;
    combat.projectiles.forEach((p,i)=>{rotation.setFromUnitVectors(z,p.velocity.clone().normalize());scale.setScalar(p.type==='minigun'?0.10:0.28);scale.z=p.type==='minigun'?2:1.2;matrix.compose(p.position,rotation,scale);bullets.setMatrixAt(i,matrix);bullets.setColorAt(i,new THREE.Color(p.decoy?0xffd575:WEAPONS[p.type].color));});
    bursts.count=combat.effects.length;
    sparks.count=0;
    combat.effects.forEach((e,i)=>{
      const age=e.duration-e.life, fade=Math.max(0,e.life/e.duration);
      scale.setScalar((0.3+age*5)*e.size*fade);matrix.compose(e.position,new THREE.Quaternion(),scale);
      bursts.setMatrixAt(i,matrix);bursts.setColorAt(i,color.set(e.color).multiplyScalar(fade*fade));
      for(let n=0;n<24;n++) {
        const y=1-2*(n+0.5)/24, angle=n*2.399963;
        direction.set(Math.cos(angle)*Math.sqrt(1-y*y),y,Math.sin(angle)*Math.sqrt(1-y*y));
        const speed=(e.kind==='flare'?9:18)*(0.5+(n%5)/5)*e.size;
        sparkPosition.copy(e.position).addScaledVector(direction,age*speed);sparkPosition.y-=age*age*2;
        rotation.setFromUnitVectors(z,direction);scale.set(0.08*fade,0.08*fade,(e.kind==='flare'?0.8:1.4)*fade*e.size);
        matrix.compose(sparkPosition,rotation,scale);sparks.setMatrixAt(sparks.count,matrix);
        sparks.setColorAt(sparks.count++,color.set(e.color).multiplyScalar(fade));
      }
    });
    for(const mesh of [bullets,bursts,sparks]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  },dispose(){scene.remove(group);for(const m of [bullets,bursts,sparks]){m.dispose();m.geometry.dispose();m.material.dispose();}}};
}

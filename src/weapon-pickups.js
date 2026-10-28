export const WEAPON_PAD_COOLDOWN = 8;
export function pickupSnapshot(ship) {
  return {distance:ship.distance,lane:ship.lateralOffset,height:ship.verticalOffset,
    route:ship.route?{...ship.route}:null,flight:!!ship.flight,serial:ship.respawnSerial};
}
// Main-road and branch coordinates share lap progress. Split a fork/merge at
// its actual boundary, so a fast frame cannot collect a pad on the other road.
export function pickupCrossing(ship, before, pad, curve) {
  const length=curve.getLength(),from=before.distance,to=ship.distance;
  if(to<=from || before.flight || ship.flight || ship.recoveryTimer>0 || before.serial!==ship.respawnSerial)return null;
  const cuts=[from,to];
  for(let lap=Math.floor(from/length);lap<=Math.floor(to/length);lap++)for(const b of curve.track.branches??[])for(const u of [b.start,b.end]){
    const d=(lap+u)*length;if(d>from&&d<to)cuts.push(d);
  }
  cuts.sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){
    const start=cuts[i],end=cuts[i+1],mid=(start+end)/2;
    const route=[before.route,ship.route].find(r=>{const b=curve.track.branches?.find(b=>b.id===r?.id);return b&&mid>=(r.lap+b.start)*length&&mid<=(r.lap+b.end)*length;});
    if((route?.id??null)!==(pad.routeId??null))continue;
    for(let lap=Math.floor(start/length);lap<=Math.floor(end/length);lap++){
      const entry=lap*length+pad.d-5*(pad.metric??1),exit=lap*length+pad.d+(pad.metric??1);
      if(end<entry||start>exit)continue;
      const fraction=(Math.max(start,entry)-from)/(to-from);
      const lane=before.lane+(ship.lateralOffset-before.lane)*fraction;
      const height=before.height+(ship.verticalOffset-before.height)*fraction;
      if(Math.abs(lane-pad.offset)<=1.2&&height<=1.2)return {fraction,lap};
    }
  }
  return null;
}

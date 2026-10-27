import { Quaternion, Vector3 } from 'three';

export const TIME_ATTACK = Object.freeze({ version: 1, physics: 'drive-001-v1', sampleHz: 20,
  classicPhysics: 'drive-002-wall-v2',
  maxLapSeconds: 600, maxSamples: 12004, timedLaps: 3, prefix: 'swipe-out:lap:v1:' });

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function hash(text) {
  let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
  return `${(a >>> 0).toString(16)}-${(b >>> 0).toString(16)}`;
}
export function recordKey({ track, ship = 'racer', speedClass = 'standard', topSpeed = 143, handling, assist }) {
  // Include full track revision: edited circuits cannot inherit old geometry's ghost.
  return TIME_ATTACK.prefix + hash(JSON.stringify(stable({ track, ship, speedClass, topSpeed,
    handling, assist: handling === 'wipeout' ? 'manual' : assist,
    physics: handling === 'wipeout' ? TIME_ATTACK.classicPhysics : TIME_ATTACK.physics })));
}
export function validRecord(record, key) {
  if (!record || record.version !== TIME_ATTACK.version || record.key !== key ||
      !Number.isFinite(record.duration) || record.duration <= 0 || record.duration > TIME_ATTACK.maxLapSeconds ||
      !Array.isArray(record.sectors) || record.sectors.length !== 3 || !record.sectors.every(n => Number.isFinite(n) && n > 0) ||
      Math.abs(record.sectors.reduce((a,b) => a+b,0) - record.duration) > 0.001 ||
      !Array.isArray(record.samples) || record.samples.length < 2 || record.samples.length > TIME_ATTACK.maxSamples) return false;
  let lastTime = -1, lastProgress = -1;
  for (const s of record.samples) {
    if (!Array.isArray(s) || s.length !== 9 || !s.every(Number.isFinite) || s[0] <= lastTime ||
        s[0] < 0 || s[0] > record.duration + 1e-6 || s[1] < lastProgress - 1e-6 || s[1] < 0 || s[1] > 1.000001 ||
        s.slice(2,5).some(n => Math.abs(n) > 1e7) || Math.abs(Math.hypot(...s.slice(5)) - 1) > 0.02) return false;
    lastTime = s[0]; lastProgress = s[1];
  }
  const first = record.samples[0], last = record.samples.at(-1);
  return first[0] === 0 && Math.abs(first[1]) < 1e-6 && Math.abs(last[0]-record.duration) < 1e-6 && Math.abs(last[1]-1) < 1e-6;
}
export function loadRecord(storage, key) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return { record: null, warning: '' };
    if (raw.length > 2500000) return { record: null, warning: 'Saved ghost is too large; ignored.' };
    const record = JSON.parse(raw);
    return validRecord(record, key) ? { record, warning: '' } : { record: null, warning: 'Invalid saved record ignored.' };
  } catch { return { record: null, warning: 'Record storage could not be read.' }; }
}
export function saveRecord(storage, record) {
  if (!validRecord(record, record.key)) return false;
  try { storage.setItem(record.key, JSON.stringify(record)); return true; } catch { return false; }
}
function bracket(samples, value, column) {
  let lo = 0, hi = samples.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (samples[mid][column] <= value) lo = mid; else hi = mid; }
  const a = samples[lo], b = samples[hi];
  return { a, b, f: Math.max(0, Math.min(1, (value-a[column]) / Math.max(1e-9, b[column]-a[column]))) };
}
export function ghostPose(record, seconds) {
  if (!record || seconds < 0 || seconds > record.duration) return null;
  const { a,b,f } = bracket(record.samples, seconds, 0);
  return { position: new Vector3(...a.slice(2,5)).lerp(new Vector3(...b.slice(2,5)), f),
    quaternion: new Quaternion(...a.slice(5)).slerp(new Quaternion(...b.slice(5)), f) };
}
export function deltaAtProgress(record, progress, elapsed) {
  if (!record || progress < 0 || progress > 1) return null;
  const { a,b,f } = bracket(record.samples, progress, 1);
  return elapsed - (a[0] + (b[0]-a[0])*f);
}
export function signedDelta(value) { return value == null ? '—' : `${value < -0.005 ? '−' : '+'}${Math.abs(value).toFixed(2)} s`; }

function interpolate(a,b,time) {
  const f = Math.max(0,Math.min(1,(time-a.time)/Math.max(1e-9,b.time-a.time)));
  return { time, distance: a.distance+(b.distance-a.distance)*f,
    position: a.position.clone().lerp(b.position,f), quaternion: a.quaternion.clone().slerp(b.quaternion,f) };
}

export class TimeAttackSession {
  constructor({ length, key, storage, requiresGates = false }) {
    Object.assign(this, { length, key, storage, requiresGates });
    const loaded = loadRecord(storage,key);
    this.best = loaded.record; this.initialBest = this.best; this.warning = loaded.warning;
    this.reference = null; this.completed = []; this.events = []; this.previous = null;
    this.lapStart = null; this.lapIndex = 0; this.nextBoundary = length;
    this.sectorIndex = 0; this.splits = []; this.samples = []; this.invalid = '';
    this.elapsed = 0; this.progress = 0; this.delta = null; this.done = false;
  }
  invalidate(reason) { if (!this.invalid) this.invalid = reason; }
  append(a,b,until,force=false) {
    if (this.lapStart === null || this.invalid) return;
    if (until-this.lapStart > TIME_ATTACK.maxLapSeconds) { this.invalidate('Lap exceeded 10 minutes'); return; }
    const write = time => {
      const p = interpolate(a,b,time), t = time-this.lapStart;
      if (this.samples.length && t-this.samples.at(-1)[0] < 1e-7) return;
      this.samples.push([t, Math.max(0,Math.min(1,(p.distance-this.lapIndex*this.length)/this.length)),
        ...p.position.toArray(), ...p.quaternion.toArray()]);
    };
    while (this.nextSample <= until+1e-9) { write(this.nextSample); this.nextSample += 1/TIME_ATTACK.sampleHz; }
    if (force) write(until);
  }
  advance(point) {
    this.events = [];
    if (this.done) return;
    const a = this.previous, b = point; this.previous = { ...point, position: point.position.clone(), quaternion: point.quaternion.clone() };
    if (!a || b.time <= a.time) return;
    if (b.recoveries !== a.recoveries || b.distance < a.distance-0.01) this.invalidate('Recovery — lap invalid');
    // Reject discontinuous debug/teleport progress, not legitimate branch remapping.
    if (b.distance-a.distance > Math.max(20, (b.time-a.time)*2000)) this.invalidate('Discontinuous progress');
    while (b.distance >= this.nextBoundary && b.distance > a.distance) {
      const time = a.time+(b.time-a.time)*(this.nextBoundary-a.distance)/(b.distance-a.distance);
      if (time < a.time-1e-6) { this.invalidate('Missed timing gate'); break; }
      this.append(a,b,time,true);
      if (this.sectorIndex === 0) {
        // Start/end line. Warm-up is never ranked; each timed lap is a flying lap.
        if (this.lapStart !== null) {
          if (b.flight || (this.requiresGates && b.completedLaps < this.lapIndex+1)) this.invalidate('Finish gate not validated');
          const duration = time-this.lapStart;
          const sectors = [this.splits[0], this.splits[1]-this.splits[0], duration-this.splits[1]];
          const improved = !this.invalid && (!this.best || duration < this.best.duration-1e-6);
          const difference = this.best ? duration-this.best.duration : null;
          const result = { duration, sectors, valid: !this.invalid, reason: this.invalid, improved, difference };
          if (improved) {
            const record = { version: TIME_ATTACK.version, key:this.key, duration, sectors, samples:this.samples, savedAt:Date.now() };
            if (validRecord(record,this.key)) {
              this.best = record;
              if (!saveRecord(this.storage,record)) this.warning = 'PB kept for this session only — browser storage is full or unavailable.';
              else this.warning = '';
            } else { result.valid=false; result.improved=false; result.reason='Incomplete replay'; }
          }
          this.completed.push(result); this.events.push({ type:'lap', ...result });
          if (this.completed.length >= TIME_ATTACK.timedLaps) { this.done=true; break; }
        }
        this.lapIndex++; this.lapStart=time; this.reference=this.best;
        this.samples=[]; this.splits=[]; this.invalid=''; this.nextSample=time;
        this.append(a,b,time,true); this.sectorIndex=1;
        this.nextBoundary=(this.lapIndex+0.33)*this.length;
      } else {
        const split=time-this.lapStart; this.splits.push(split);
        const reference=this.reference?.sectors.slice(0,this.sectorIndex).reduce((x,y)=>x+y,0);
        this.events.push({ type:'sector', sector:this.sectorIndex, split, delta:reference == null ? null : split-reference });
        this.sectorIndex++;
        if (this.sectorIndex===3) { this.sectorIndex=0; this.nextBoundary=(this.lapIndex+1)*this.length; }
        else this.nextBoundary=(this.lapIndex+0.66)*this.length;
      }
    }
    if (!this.done) this.append(a,b,b.time);
    this.elapsed = this.lapStart===null ? 0 : b.time-this.lapStart;
    this.progress = (b.distance-this.lapIndex*this.length)/this.length;
    this.delta = this.invalid ? null : deltaAtProgress(this.reference,this.progress,this.elapsed);
  }
}

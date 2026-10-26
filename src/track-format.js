// Version 3 adds connected alternative routes; versions 1/2 remain readable.
export const TRACK_FORMAT = 'swipe-out-track';
export const TRACK_VERSION = 3;
export const MAX_TRACK_BYTES = 16 * 1024 * 1024;

function fail(path, reason) { throw new Error(`${path}: ${reason}`); }
function record(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected an object.');
}
function number(value, path, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(path, `expected a number between ${min} and ${max}.`);
  }
  return value;
}
function text(value, path, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(path, `expected text (1–${max} characters).`);
  return value;
}
function vector(value, path, min = -10000, max = 10000) {
  if (!Array.isArray(value) || value.length !== 3) fail(path, 'expected [x, y, z].');
  return value.map((n, i) => number(n, `${path}[${i}]`, min, max));
}
function knownFields(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${path}.${key}`, 'unsupported field in this track version.');
  }
}
function color(value, path) {
  if (typeof value === 'number') return number(value, path, 0, 0xffffff);
  if (typeof value === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) return value;
  fail(path, 'expected a numeric RGB color or #hex color.');
}
function texture(value, path) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') fail(path, 'expected an image path or embedded image.');
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
  if (/^https:\/\//i.test(value) || /^(\.?\.?\/)?[a-z0-9_/-]+\.(png|jpe?g|webp|gif)$/i.test(value)) return value;
  fail(path, 'use a PNG, JPEG, WebP or GIF image, or an HTTPS image URL.');
}

export function normalizeTrack(input) {
  record(input, 'track');
  knownFields(input, ['id', 'name', 'width', 'horizontalScale', 'centerline', 'objects', 'magnetic', 'gaps', 'branches'], 'track');
  const id = text(input.id, 'track.id');
  const name = text(input.name, 'track.name');
  const width = number(input.width, 'track.width', 4, 100);
  const horizontalScale = number(input.horizontalScale ?? 1, 'track.horizontalScale', 0.1, 10);
  if (!Array.isArray(input.centerline) || input.centerline.length < 4 || input.centerline.length > 512) {
    fail('track.centerline', 'expected 4–512 control points.');
  }
  const centerline = input.centerline.map((point, i) => {
    if (!Array.isArray(point) || (point.length !== 3 && point.length !== 4)) fail(`track.centerline[${i}]`, 'expected [x, y, z] or legacy [x, y, z, bank].');
    const result = vector(point.slice(0, 3), `track.centerline[${i}]`);
    // Bank metadata is only active when magnetic road is explicitly enabled.
    if (point.length === 4) result.push(number(point[3], `track.centerline[${i}][3]`, -3600, 3600));
    return result;
  });
  let length = 0;
  if (new Set(centerline.map(point => point.slice(0, 3).join(','))).size < 4) {
    fail('track.centerline', 'expected at least four distinct points.');
  }
  for (let i = 0; i < centerline.length; i++) {
    const a = centerline[i], b = centerline[(i + 1) % centerline.length];
    const distance = Math.hypot((a[0] - b[0]) * horizontalScale, a[1] - b[1], (a[2] - b[2]) * horizontalScale);
    length += distance;
  }
  if (length < 50 || length > 50000) fail('track.centerline', 'total control-polygon length must be 50–50,000 world units.');
  const sourceObjects = input.objects ?? [];
  if (!Array.isArray(sourceObjects) || sourceObjects.length > 1024) fail('track.objects', 'expected at most 1,024 scenery objects.');
  const objects = sourceObjects.map((object, i) => {
    const path = `track.objects[${i}]`;
    record(object, path);
    knownFields(object, ['id', 'type', 'position', 'rotation', 'scale', 'texture', 'animType', 'opacity', 'color', 'emissive'], path);
    if (!['box', 'sphere', 'cylinder', 'cone'].includes(object.type)) fail(`${path}.type`, 'expected box, sphere, cylinder or cone.');
    const animType = object.animType ?? 'none';
    if (!['none', 'scroll-x', 'scroll-y', 'pulse'].includes(animType)) fail(`${path}.animType`, 'unknown animation.');
    const result = {
      type: object.type,
      position: vector(object.position, `${path}.position`),
      rotation: vector(object.rotation ?? [0, 0, 0], `${path}.rotation`, -3600, 3600),
      scale: vector(object.scale ?? [1, 1, 1], `${path}.scale`, 0.01, 10000),
      texture: texture(object.texture, `${path}.texture`),
      animType,
      // Older editor builds sometimes serialized opacity with a decimal comma.
      opacity: number(typeof object.opacity === 'string' ? Number(object.opacity.replace(',', '.')) : (object.opacity ?? 1), `${path}.opacity`, 0, 1),
    };
    if (object.id !== undefined) result.id = text(object.id, `${path}.id`);
    if (object.color !== undefined) result.color = color(object.color, `${path}.color`);
    if (object.emissive !== undefined) result.emissive = color(object.emissive, `${path}.emissive`);
    return result;
  });
  const result = { id, name, width, horizontalScale, centerline, objects };
  if (input.magnetic !== undefined) {
    if (typeof input.magnetic !== 'boolean') fail('track.magnetic', 'expected true or false.');
    result.magnetic = input.magnetic;
  }
  if (input.gaps !== undefined) {
    if (!Array.isArray(input.gaps) || input.gaps.length > 16) fail('track.gaps', 'expected at most 16 gaps.');
    const gaps = input.gaps.map((gap, i) => {
      const path = `track.gaps[${i}]`; record(gap, path); knownFields(gap, ['start', 'end'], path);
      const start = number(gap.start, `${path}.start`, 0.03, 0.9);
      const end = number(gap.end, `${path}.end`, 0.03, 0.94);
      if (end - start < 0.002 || end - start > 0.15) fail(path, 'gap must span 0.2–15% of the lap, with end after start.');
      return { start, end };
    }).sort((a, b) => a.start - b.start);
    if (gaps.length && !result.magnetic) fail('track.gaps', 'enable magnetic road before adding gaps.');
    for (let i = 1; i < gaps.length; i++) {
      if (gaps[i].start - gaps[i - 1].end < 0.02) fail('track.gaps', 'leave at least 2% of the lap between gaps for landing and recovery.');
    }
    result.gaps = gaps;
  }
  if (input.branches !== undefined) {
    if (!Array.isArray(input.branches) || input.branches.length > 4) fail('track.branches', 'expected at most four branches.');
    if (input.branches.length && !result.magnetic) fail('track.branches', 'enable magnetic road before adding branches.');
    const ids = new Set();
    result.branches = input.branches.map((branch, i) => {
      const path = `track.branches[${i}]`; record(branch, path);
      knownFields(branch, ['id', 'name', 'start', 'end', 'side', 'width', 'points'], path);
      const id = text(branch.id, `${path}.id`, 80);
      if (ids.has(id)) fail(path, 'branch ids must be unique.'); ids.add(id);
      const start = number(branch.start, `${path}.start`, 0.08, 0.8);
      const end = number(branch.end, `${path}.end`, 0.12, 0.92);
      if (end - start < 0.04 || end - start > 0.6) fail(path, 'branch must span 4–60% of the lap.');
      if (![-1, 1].includes(branch.side)) fail(`${path}.side`, 'expected -1 (right) or 1 (left).');
      if (!Array.isArray(branch.points) || branch.points.length < 1 || branch.points.length > 64) fail(`${path}.points`, 'expected 1–64 intermediate points.');
      const points=branch.points.map((p,j)=>vector(p,`${path}.points[${j}]`));
      let branchLength=0;
      for(let j=1;j<points.length;j++)branchLength+=Math.hypot((points[j][0]-points[j-1][0])*horizontalScale,points[j][1]-points[j-1][1],(points[j][2]-points[j-1][2])*horizontalScale);
      if(branchLength>50000)fail(`${path}.points`,'branch control-polygon length must not exceed 50,000 world units.');
      return { id, name: text(branch.name, `${path}.name`), start, end, side: branch.side,
        width: number(branch.width, `${path}.width`, 4, width),
        points };
    }).sort((a, b) => a.start - b.start);
    for (let i = 0; i < result.branches.length; i++) {
      const b = result.branches[i];
      if (i && b.start - result.branches[i - 1].end < 0.04) fail('track.branches', 'leave 4% between branches; nested/overlapping routes are unsupported.');
      if ((result.gaps ?? []).some(g => g.start < b.end + 0.02 && g.end > b.start - 0.02)) fail('track.branches', 'leave 2% between gaps and branch junctions; branches must have continuous road.');
    }
  }
  return result;
}

export function decodeTrack(value) {
  record(value, 'file');
  if ('format' in value || 'version' in value || 'track' in value) {
    if (value.format !== TRACK_FORMAT) fail('file.format', `expected ${TRACK_FORMAT}.`);
    if (![1, 2, TRACK_VERSION].includes(value.version)) fail('file.version', `unsupported version ${String(value.version)}; this editor supports versions 1–${TRACK_VERSION}.`);
    knownFields(value, ['format', 'version', 'track'], 'file');
    if (value.version === 1 && (value.track?.magnetic !== undefined || value.track?.gaps !== undefined)) fail('file.version', 'magnetic road and gaps require version 2.');
    if (value.version < 3 && value.track?.branches !== undefined) fail('file.version', 'branches require version 3.');
    return normalizeTrack(value.track);
  }
  return normalizeTrack(value);
}

export function parseTrack(source) {
  if (new TextEncoder().encode(source).length > MAX_TRACK_BYTES) fail('file', 'maximum size is 16 MB.');
  let value;
  try { value = JSON.parse(source); } catch { fail('file', 'invalid JSON. Choose a downloaded track JSON file.'); }
  return decodeTrack(value);
}

export function trackDocument(track) {
  return { format: TRACK_FORMAT, version: TRACK_VERSION, track: normalizeTrack(track) };
}

export function serializeTrack(track) {
  const source = JSON.stringify(trackDocument(track), null, 2);
  if (new TextEncoder().encode(source).length > MAX_TRACK_BYTES) fail('file', 'maximum size is 16 MB. Reduce embedded textures.');
  return source + '\n';
}

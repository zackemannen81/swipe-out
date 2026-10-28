import test from 'node:test';
import assert from 'node:assert/strict';
import * as definitions from '../src/track-data.js';
import { normalizeTrack, parseTrack, serializeTrack, trackDocument } from '../src/track-format.js';
import { readTrackLibrary, saveTrack, resetTrack, STORAGE_KEY, LEGACY_STORAGE_KEY } from '../src/track-library.js';
import { createHistory } from '../src/editor-history.js';
import { createTrack, disposeTrackGroup } from '../src/track.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}

test('every shipped track migrates and round-trips without losing geometry, scenery or textures', () => {
  for (const source of Object.values(definitions)) {
    const result = parseTrack(serializeTrack(source));
    assert.deepEqual(result, normalizeTrack(source));
    assert.deepEqual(result.centerline, source.centerline);
    assert.equal(result.objects.length, source.objects?.length ?? 0);
    for (let i = 0; i < result.objects.length; i++) {
      assert.deepEqual(result.objects[i].position, source.objects[i].position);
      assert.equal(result.objects[i].texture, source.objects[i].texture ?? null);
      assert.equal(result.objects[i].color, source.objects[i].color);
    }
    const original = createTrack(source), migrated = createTrack(result);
    assert.equal(migrated.length, original.length);
    assert.deepEqual(migrated.boostPads, original.boostPads);
    assert.deepEqual(migrated.group.children[0].geometry.attributes.position.array, original.group.children[0].geometry.attributes.position.array);
    disposeTrackGroup(original.group); disposeTrackGroup(migrated.group);
  }
});

test('legacy optional fields and fourth-coordinate bank metadata survive migration', () => {
  const legacy = structuredClone(definitions.NEON_CAUSEWAY);
  delete legacy.horizontalScale;
  legacy.centerline[0].push(45);
  legacy.objects = [{ type: 'box', position: [0, 2, 0], opacity: '0,5' }];
  const migrated = parseTrack(JSON.stringify(legacy));
  assert.equal(migrated.horizontalScale, 1);
  assert.equal(migrated.centerline[0][3], 45);
  assert.equal(migrated.objects[0].opacity, 0.5);
  assert.deepEqual(migrated.objects[0].rotation, [0, 0, 0]);
  assert.deepEqual(legacy.objects[0], { type: 'box', position: [0, 2, 0], opacity: '0,5' });
});

test('reject malformed, unsupported, degenerate and excessive track data with field-specific errors', () => {
  assert.throws(() => parseTrack('export const TRACK = {};'), /invalid JSON/);
  const future = trackDocument(definitions.NEON_CAUSEWAY); future.version = 99;
  assert.throws(() => parseTrack(JSON.stringify(future)), /unsupported version 99/);
  const cases = [
    [t => { t.width = 0; }, /track.width/],
    [t => { t.horizontalScale = '3'; }, /horizontalScale/],
    [t => { t.centerline[0][0] = Infinity; }, /centerline\[0\]/],
    [t => { t.centerline = Array(4).fill([0, 0, 0]); }, /distinct/],
    [t => { t.centerline = Array(513).fill([0, 0, 0]); }, /4–512/],
    [t => { t.centerline = [[0, 0, 0], [10000, 0, 0], [10000, 0, 10000], [0, 0, 10000]]; }, /50,000/],
    [t => { t.objects = [{ type: 'script', position: [0, 0, 0] }]; }, /objects\[0\].type/],
    [t => { t.objects = [{ type: 'box', position: [0, 0, 0], texture: 'javascript:alert(1)' }]; }, /texture/],
    [t => { t.weapons = [0.5]; }, /unsupported field/],
  ];
  for (const [change, expected] of cases) {
    const track = structuredClone(definitions.NEON_CAUSEWAY); change(track);
    assert.throws(() => normalizeTrack(track), expected);
  }
});

test('mixed legacy/versioned library isolates corrupt records and safely loads built-in fallback', () => {
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({
    track1: definitions.SYNTHETIC_DREAMS,
    track2: { version: 99, format: 'swipe-out-track', track: {} },
    'custom-example': trackDocument(definitions.GEMINI),
  }) });
  const { entries, issues } = readTrackLibrary(storage);
  assert.equal(entries.track1.name, definitions.SYNTHETIC_DREAMS.name);
  assert.equal(entries.track2.name, definitions.SYNTHETIC_DREAMS.name);
  assert.equal(entries['custom-example'].data.objects.length, 5);
  assert.equal(entries['custom-example'].custom, true);
  assert.equal(issues.length, 1);
  assert.match(issues[0], /track2.*unsupported version 99/);
  const corrupted = memoryStorage({ [STORAGE_KEY]: '{broken' });
  assert.equal(Object.keys(readTrackLibrary(corrupted).entries).length, 16);
  assert.throws(() => saveTrack(corrupted, 'track1', definitions.NEON_CAUSEWAY));
  assert.equal(corrupted.getItem(STORAGE_KEY), '{broken');
});

test('save/reset affect only the chosen track; invalid writes and quota failure preserve prior data', () => {
  const storage = memoryStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(definitions.GEMINI) });
  assert.equal(readTrackLibrary(storage).entries.track1.name, 'Gemini');
  saveTrack(storage, 'custom-one', definitions.GEMINI);
  saveTrack(storage, 'track1', definitions.NEON_CAUSEWAY);
  const before = storage.getItem(STORAGE_KEY);
  assert.throws(() => saveTrack(storage, 'track1', { ...definitions.NEON_CAUSEWAY, width: -1 }), /width/);
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.throws(() => saveTrack({ ...storage, setItem() { throw new Error('quota'); } }, 'track1', definitions.GEMINI), /Download your track/);
  assert.equal(storage.getItem(STORAGE_KEY), before);
  resetTrack(storage, 'track1');
  assert.equal(storage.getItem(LEGACY_STORAGE_KEY), null);
  assert.equal(readTrackLibrary(storage).entries['custom-one'].data.objects.length, 5);
  resetTrack(storage, 'custom-one');
  assert.equal(Object.keys(readTrackLibrary(storage).entries).length, 16);
});

test('undo/redo retain scenery and edits independently of saved snapshots, and discard redo after new edits', () => {
  const initial = normalizeTrack(definitions.GEMINI);
  const history = createHistory(initial, 3);
  const draft = structuredClone(initial); draft.centerline[0][1] += 15;
  history.push(draft); history.push(draft);
  draft.objects[0].opacity = 0;
  history.push(draft);
  assert.equal(history.undo().objects[0].opacity, initial.objects[0].opacity);
  assert.deepEqual(history.undo(), initial);
  assert.equal(history.canUndo, false);
  const redo = history.redo(); assert.equal(redo.centerline[0][1], initial.centerline[0][1] + 15);
  redo.name = 'Branch'; history.push(redo);
  assert.equal(history.canRedo, false);
  assert.equal(initial.name, 'Gemini');
});

test('history bounds large snapshots while keeping the most recent undo step', () => {
  const history = createHistory({ data: 'x'.repeat(80), n: 0 }, 60, 250);
  for (let n = 1; n <= 20; n++) history.push({ data: 'x'.repeat(80), n });
  assert.equal(history.undo().n, 19);
  assert.equal(history.canUndo, false);
  assert.equal(history.redo().n, 20);
});

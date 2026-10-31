import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CATHEDRAL_KIT, createCathedralObjects } from '../src/cathedral-kit.js';
import { MAX_TRACK_BYTES, serializeTrack, parseTrack } from '../src/track-format.js';

test('cathedral kit resolves to six available external GLB files', () => {
  assert.equal(CATHEDRAL_KIT.length, 6);
  assert.equal(new Set(CATHEDRAL_KIT.map(part => part.model)).size, 6);
  for (const part of CATHEDRAL_KIT) {
    assert.match(part.model, /^\/models\/[a-zA-Z0-9_ .()-]+\.glb$/);
    assert.ok(existsSync(new URL('../public' + part.model, import.meta.url)), part.model);
  }
});

test('staging six cathedral pieces keeps track JSON small and importable', () => {
  const pieces = createCathedralObjects(CATHEDRAL_KIT, [10, 15, 20], 1, 2);
  const value = {
    id: 'cathedral-kit-test', name: 'Necros Prime', width: 12,
    horizontalScale: 1,
    centerline: [[0, 0, 0], [70, 0, 0], [70, 0, 70], [0, 0, 70]],
    objects: pieces.map((piece, i) => ({ ...piece, id: 'cathedral-' + i })),
  };
  const json = serializeTrack(value);
  assert.ok(json.length < 5000);
  assert.equal(parseTrack(json).objects.length, 6);
  assert.ok(pieces.every(piece => piece.model.startsWith('/models/')));
  assert.equal(MAX_TRACK_BYTES, 64 * 1024 * 1024);
});

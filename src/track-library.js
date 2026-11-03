import { VITRUM } from './track-vitrum.js';
import { NECROS } from './track-necros.js';
import { RACEWAY_LAB } from './track-workshop.js';
import { NEON_CAUSEWAY, SYNTHETIC_DREAMS, DIGITAL_HORIZON, MOMMY_IM_SCARED, DARK_SKIES, GEMINI, THE_JOKER, THE_VOID, AGENT_008_STAGE, ION_CATHEDRAL } from './track-data.js';
import { decodeTrack, normalizeTrack, trackDocument } from './track-format.js';
import { GAP_LAB, LOOP_LAB, ROUTE_LAB, COMBAT_LAB } from './track-labs.js';
import { ION_FOUNDRY } from './track-foundry.js';

export const STORAGE_KEY = 'swipe-out-track-definitions';
export const LEGACY_STORAGE_KEY = 'swipe-out-track-definition';
const definitions = [NEON_CAUSEWAY, SYNTHETIC_DREAMS, DIGITAL_HORIZON, MOMMY_IM_SCARED, DARK_SKIES, GEMINI, THE_JOKER, THE_VOID, AGENT_008_STAGE, ION_CATHEDRAL, GAP_LAB, LOOP_LAB, ROUTE_LAB, COMBAT_LAB, ION_FOUNDRY, RACEWAY_LAB, NECROS, VITRUM];
const audio = ['001', '002', '006', '005', '004', '007', '009', '010', '011', '012', '001', '001', '001', '001', '013', '001', '014','014','014'];
const backgrounds = ['001.jpg', '002.jpg', '003.jpg', '004.jpg', '005.jpg', '006.jpg', '007.jpg', '009.jpg', '010.jpg', '013.png', '001.jpg', '001.jpg', '014.jpg', '014.jpg', '012.jpg', '014.jpg', '015.jpg'];
export const BUILTIN_TRACKS = Object.fromEntries(definitions.map((data, i) => [`track${i + 1}`, {
  name: data.name, data, defaultAudio: `/audio/tracks/track_${audio[i] ?? '001'}.mp3`, backdrop: `/images/backdrop_track-${backgrounds[i] ?? '014.jpg'}`,
}]));

// Supplied Vitrum panorama and default soundtrack.
BUILTIN_TRACKS.track18.backdrop = '/images/backdrop_track-017.jpg';
BUILTIN_TRACKS.track18.preview = '/images/stage2/concept1.png';
BUILTIN_TRACKS.track18.defaultAudio = '/audio/tracks/track15.m4a';

// Necros Prime is frequently imported as a custom track, with an inherited
// id such as "synthetic-dreams". Match its displayed name, not its id.
// Preserve the original soundtrack/sky for all unrelated custom tracks.
export function trackMedia(data, fallback) {
  if (data.id === VITRUM.id) return {...fallback, backdrop: BUILTIN_TRACKS.track18.backdrop, defaultAudio: BUILTIN_TRACKS.track18.defaultAudio};
  if (/^necros\s*[-–—·:]\s*prime$/i.test(data.name)) {
    return {
      ...fallback,
      defaultAudio: '/audio/tracks/track_014.mp3',
      backdrop: '/images/backdrop_track-015.jpg'
    };
  }
  return fallback;
}

function storedRecords(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  const records = JSON.parse(raw);
  if (!records || typeof records !== 'object' || Array.isArray(records)) throw new Error('Saved track library is not an object. Export your drafts before repairing browser storage.');
  return records;
}

export function readTrackLibrary(storage) {
  const entries = Object.fromEntries(Object.entries(BUILTIN_TRACKS).map(([key, entry]) => [key, { ...entry, data: normalizeTrack(entry.data) }]));
  const issues = [];
  try {
    const records = storedRecords(storage);
    if (!Object.hasOwn(records, 'track1')) {
      const legacy = storage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        try { records.track1 = JSON.parse(legacy); } catch { issues.push('Legacy track: invalid JSON. Using the built-in track.'); }
      }
    }
    for (const [key, value] of Object.entries(records)) {
      try {
        if (!/^(track\d+|custom-[a-z0-9-]+)$/.test(key)) throw new Error('unsupported saved-track key.');
        const data = decodeTrack(value);
        entries[key] = { ...trackMedia(data, BUILTIN_TRACKS[key] ?? BUILTIN_TRACKS.track1), name: data.name, data, custom: !BUILTIN_TRACKS[key] };
      } catch (error) { issues.push(`${key}: ${error.message}`); }
    }
  } catch (error) { issues.push(`Saved tracks could not be loaded: ${error.message}`); }
  return { entries, issues };
}

export function saveTrack(storage, key, track) {
  if (!/^(track\d+|custom-[a-z0-9-]+)$/.test(key)) throw new Error('Invalid saved-track key.');
  const document = trackDocument(track);
  const records = storedRecords(storage);
  records[key] = document;
  try { storage.setItem(STORAGE_KEY, JSON.stringify(records)); }
  catch { throw new Error('Could not save to browser storage. It may be full or unavailable. Download your track to keep your changes.'); }
  return document.track;
}

export function resetTrack(storage, key) {
  const records = storedRecords(storage);
  delete records[key];
  storage.setItem(STORAGE_KEY, JSON.stringify(records));
  if (key === 'track1') storage.removeItem(LEGACY_STORAGE_KEY);
}

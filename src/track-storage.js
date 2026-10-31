import { BUILTIN_TRACKS, readTrackLibrary, saveTrack, resetTrack, trackMedia } from './track-library.js';
import { decodeTrack, trackDocument } from './track-format.js';

// Large, texture-rich tracks belong in IndexedDB, not localStorage (typically
// limited to a few MiB per origin). Keep the old localStorage library readable.
const DATABASE = 'swipe-out-track-library';
const STORE = 'tracks';
const KEY_PATTERN = /^(track\d+|custom-[a-z0-9-]+)$/;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another browser tab.'));
  });
}

async function readIndexedTracks() {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readonly');
      const request = transaction.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Unable to read saved tracks.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Track read aborted.'));
    });
  } finally {
    database.close();
  }
}

async function writeIndexedTrack(key, document) {
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put({ key, document });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save track.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Track save aborted.'));
    });
  } finally {
    database.close();
  }
}

async function deleteIndexedTrack(key) {
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to remove track.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Track removal aborted.'));
    });
  } finally {
    database.close();
  }
}

export async function loadTrackLibrary(storage) {
  const library = readTrackLibrary(storage);
  try {
    const records = await readIndexedTracks();
    for (const { key, document } of records) {
      try {
        if (!KEY_PATTERN.test(key)) throw new Error('unsupported track key.');
        const data = decodeTrack(document);
        library.entries[key] = {
          ...trackMedia(data, BUILTIN_TRACKS[key] ?? BUILTIN_TRACKS.track1),
          name: data.name,
          data,
          custom: !Object.hasOwn(BUILTIN_TRACKS, key)
        };
      } catch (error) {
        library.issues.push(`IndexedDB ${key}: ${error.message}`);
      }
    }
  } catch (error) {
    library.issues.push(`IndexedDB: ${error.message} Existing local tracks are still available.`);
  }
  return library;
}

export async function persistTrack(storage, key, track) {
  if (!KEY_PATTERN.test(key)) throw new Error('Invalid saved-track key.');
  const document = trackDocument(track);
  try {
    await writeIndexedTrack(key, document);
  } catch (error) {
    // Preserve small-track support in restrictive/private browser modes.
    try { return saveTrack(storage, key, track); }
    catch {
      throw new Error(`IndexedDB save failed: ${error.message}. Download your track JSON to preserve your changes.`);
    }
  }
  return document.track;
}

export async function removePersistedTrack(storage, key) {
  if (!KEY_PATTERN.test(key)) throw new Error('Invalid saved-track key.');
  // Remove from both stores so a legacy localStorage track cannot reappear.
  resetTrack(storage, key);
  try { await deleteIndexedTrack(key); }
  catch (error) { throw new Error(`IndexedDB removal failed: ${error.message}`); }
}

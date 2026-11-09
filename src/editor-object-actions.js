// Scene selection uses object indexes; copied data is independent of later edits.
export const MAX_SCENERY_OBJECTS = 1024;
export const MAX_SCENERY_LIGHTS = 16;

export function selectedObjectIndexes(selection, indices, length) {
  const selected = new Set([...indices].filter(i => Number.isInteger(i) && i >= 0 && i < length));
  if (selection.kind === 'object' && selection.index >= 0 && selection.index < length) selected.add(selection.index);
  return [...selected].sort((a, b) => a - b);
}

export function copySceneObjects(objects, indices) {
  return indices.map(index => structuredClone(objects[index]));
}

export function createPastedObjects(existing, clipboard, createId) {
  if (!clipboard.length) throw new Error('Copy one or more scenery objects first.');
  if (existing.length + clipboard.length > MAX_SCENERY_OBJECTS)
    throw new Error('Maximum 1,024 scenery objects per track.');
  if (existing.filter(o => o.type === 'light').length +
      clipboard.filter(o => o.type === 'light').length > MAX_SCENERY_LIGHTS)
    throw new Error('Maximum 16 point lights per track.');
  // No offset: paste at exactly the saved coordinates, including rotation and scale.
  return clipboard.map(object => ({ ...structuredClone(object), id: createId() }));
}

export function withoutSceneObjects(objects, indices) {
  const remove = new Set(indices);
  return objects.filter((_, i) => !remove.has(i));
}

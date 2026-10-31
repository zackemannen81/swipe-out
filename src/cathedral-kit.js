// Assets already present in public/models. Keep references as paths rather than
// embedding multi-megabyte GLB data in the saved track JSON.
export const CATHEDRAL_KIT = Object.freeze([
  { label: 'Cathedral · Entrance facade', file: 'Meshy_AI_Cathedral_Entrance_Fa_1031120542_texture.glb' },
  { label: 'Cathedral · Nave hall', file: 'Meshy_AI_Cathedral_Nave_Hall_L.glb' },
  { label: 'Cathedral · Central spire', file: 'Meshy_AI_Cathedral_Central_Spi_1031115741_texture.glb' },
  { label: 'Cathedral · Exterior', file: 'Meshy_AI_Cathedral_Exterior_Lo_1030004443_texture.glb' },
  { label: 'Cathedral · Crimson citadel (80 MB)', file: 'Meshy_AI_Crimson_Citadel_1031114657_texture.glb' },
  { label: 'Cathedral · Urban spire (114 MB)', file: 'Meshy_AI_Urban_Spire_1031114834_texture.glb' },
].map(({label,file}) => ({ label, model: '/models/' + file })));

export function createCathedralObjects(kit, anchor, horizontalScale = 1, startOffset = 0) {
  return kit.map(({model}, i) => ({
    type: 'glb',
    model,
    // Place new pieces in a staging row beside the selected point, not on the
    // racing line. Move/scale them in the inspector to assemble the cathedral.
    position: [
      Math.max(-10000, Math.min(10000, anchor[0] + (startOffset + i + 1) * 30 / horizontalScale)),
      anchor[1],
      anchor[2],
    ],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    opacity: 1,
  }));
}

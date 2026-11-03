// Supplied PBR sources shared by the runtime deck and offline GLB exporter.
// Color/emission are sRGB; normals and roughness are linear data.
export const FOREST_TEXTURE_ROOT = '/images/theforest/';
export const FOREST_SURFACES = {
  moss: '01_moss_fern_ground',
  bark: '02_ivory_silicate_bark',
  canopy: '03_canopy_green_surface',
  gills: '04_mushroom_amber_gills',
  mycelium: '05_cyan_mycelium_network',
  membrane: '06_lavender_silicate_membrane',
};
export const forestMap = (surface, channel) => `${FOREST_TEXTURE_ROOT}${FOREST_SURFACES[surface]}_${channel}.png`;

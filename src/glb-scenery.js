import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Self-contained GLBs keep editor exports portable and avoid missing sidecars.
export function validateGlb(buffer) {
  if (buffer.byteLength < 20) throw new Error('Invalid GLB header.');
  const view = new DataView(buffer);
  if (view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2 || view.getUint32(8,true)!==buffer.byteLength)
    throw new Error('Choose a valid GLB 2.0 file.');
  const size=view.getUint32(12,true);
  if(view.getUint32(16,true)!==0x4e4f534a || size>buffer.byteLength-20)throw new Error('Invalid GLB JSON chunk.');
  const json=JSON.parse(new TextDecoder().decode(buffer.slice(20,20+size)));
  for(const asset of [...(json.buffers??[]),...(json.images??[])])
    if(asset.uri && !asset.uri.startsWith('data:'))throw new Error('Export GLB with embedded textures and buffers (no external files).');
  if((json.extensionsRequired??[]).some(x=>['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'].includes(x)))
    throw new Error('Export an uncompressed GLB (Draco/Meshopt/KTX2 are not supported here).');
  return json;
}
export async function loadGlb(source) {
  const response=await fetch(source);
  if(!response.ok)throw new Error(`GLB load failed (${response.status}).`);
  const buffer=await response.arrayBuffer();validateGlb(buffer);
  return (await new GLTFLoader().parseAsync(buffer,'')).scene;
}

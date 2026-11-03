VITRUM LITHOFYTER — ORGANIC MATERIAL STARTER SET
6 AI-generated materials extracted from a 3x2 generated concept sheet.

Each material includes:
- *_basecolor.png (512x512 RGB)
- *_roughness.png (512x512 grayscale)
- *_normal_approx.png (512x512 inferred from color contrast; artistic approximation, not scan data)
The cyan mycelium includes an optional grayscale emissive mask.

The source textures were edge-blended for improved UV repetition. They are an art starting point,
not guaranteed to be perfectly periodic in strong normal-mapped lighting or on large surfaces.
Use RepeatWrapping when UVs repeat and verify on the actual model; use small texture tiling on
vertical stalks and large radial UVs on caps, whose shapes may need manual UVs.

Suggested materials:
01 ground foliage, moss-covered branches
02 trunks and organic buttresses
03 tops of mushroom/tree canopies
04 undersides of fungal canopies
05 roots, neural networks, forest floor
06 petals, translucent-looking membranes (texture is opaque; use material transparency if needed)

Three.js GLTF pipeline: prefer glTF-compatible UVs and bake edits into GLB; for live emissive
control use material.emissiveMap with a separate emissive color and intensity. Normal maps
may need Y inversion only if the appearance is incorrect; maps here assume OpenGL convention.

Performance: textures 512px, reuse mats; hundreds of copies should use instancing where appropriate.

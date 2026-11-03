# Current Task
Task ID: VITRUM-008
Status: Complete
## Scope
Add restrained biological spores in three layers: fine pollen, larger glowing
spores and speed-dependent streaks. Fixed route zones, edge-biased placement,
GPU animation, distance fade, existing pause clock and resource disposal.
## Acceptance
Keep racing corridor visually clean; bounded draw/particle count. Verify shader
compilation and driving views in browser, pause/speed behavior, tests and build.

## 2026-11-03 - VITRUM-008 biological atmosphere
Vitrum now has three GPU-animated Points batches: 5,200 pollen, 650 larger spores
and 350 speed streaks. Deterministic world positions follow the current route,
biased toward banks and height; three denser zones align with canopy, mycelium
and Bloom. Cyan, amber, yellow-green and rare violet, slow bounded drift/pulse,
near-camera and 260-520 unit distance fade. Streaks fade in at speed 100-280
world units/sec and use short screen-space elongated sprites (not motion blur).
No new lights, textures or collision. Three extra draws; all 6,200 vertices are
submitted in fixed batches, with distance fading in the shader. Target-device
FPS is unmeasured. Existing scenery clock freezes animation on race pause;
editor motion preview enables animation. Saved Vitrum routes receive it without
rewriting objects. Shared track disposal releases geometry/materials.
Five targeted tests pass, including determinism, bounded counts, unchanged base
positions, time/speed uniforms and disposal. Production build passes (existing
chunk warning). Browser sectors, editor and saved override checks pass with no
page/HTTP errors; Rootwake capture inspected, rendered spores visible. Evidence:
tmp/vitrum-spores-{browser,tests,build}.txt and tmp/vitrum/*.png.
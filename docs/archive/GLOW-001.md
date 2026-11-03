# Current Task
Task ID: GLOW-001
Status: Complete
## Scope
Replace flat underglow decal with four overlapping, short-range accent-colored
point lights under each craft for a neon underbody effect. Preserve handling and
accepted camera correction. No shadow maps on the added lights.
## Acceptance
Four distributed lights replace the flat plane, follow craft transforms, use
craft accent colors and compile in production. Report visual/performance limits.

## 2026-11-03 - GLOW-001 neon underbody lighting
User accepted HOP-001 camera improvement. Replaced craft.js additive flat glow
plane with four accent-colored PointLights at x +/-0.55, y -0.12, z +/-0.85.
Each uses intensity 4, distance 5.5, decay 2, no shadows; actual road materials
receive overlapping light pools. Applies to player and CPU craft via createCraft.
Build passes (existing chunk warning). Stub-loader runtime check confirms four
lights, color/shadow settings and road clearance at normal +/-0.76 rad banking.
Evidence: tmp/underglow-check.mjs and tmp/underglow-build.txt. Visual appearance
and hardware FPS not verified in-browser; four lights per craft adds fragment
lighting cost even with short range, and glossy surfaces may retain highlights.
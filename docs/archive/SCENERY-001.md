# Current Task
Task ID: SCENERY-001
Status: Complete

## Scope
Editable point lights and object motion (spin, shuttle, orbit, GLB clips), shared
editor/game preview with pause and disposal. Blood-red Necros track edges.
Preserve authored data, old imports, and existing gameplay.

## Acceptance
Round-trip validation, motion/light lifecycle tests, editor interaction checks,
production build. Document controls and limits.

## Verification
Production build and diff check pass (existing bundle warning). Five new
regressions pass, including actual GLB clip loop/reset/disposal. Full suite
126/127: existing Foundry CPU recovery assertion remains. Isolated Chrome
checks light controls, movement preview/reset, GLB settings, export/save/reload,
game movement and pause, with no page errors. Editor screenshot inspected.
User-authored browser data was not modified. Mobile performance unverified.

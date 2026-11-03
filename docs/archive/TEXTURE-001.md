# Current Task
Task ID: TEXTURE-001
Status: Complete

## Scope
Fix imported image transparency on editor scenery primitives at full object
opacity. Support alpha cutouts by default plus an explicit soft-transparency
mode, shared by editor and race. Make transparency visible in image previews.
Preserve source image bytes and saved work; retain legacy document compatibility.

## Acceptance
Transparent PNG/WebP backgrounds show the scene behind the object at opacity 1;
cutouts write depth only where the image remains, and blended alpha retains
soft translucency. Existing opaque and untextured materials remain usable.
Upload, mode changes, undo/redo, export, save/reload and game rendering work.
Verify with actual browser pixel readback and UI flow, relevant tests and build.

## Progress
Textured primitives now default to alpha cutouts at full opacity, with an
optional Soft mode for blended alpha. Cutouts retain depth writing; soft mode
disables it. Normal front-face rendering prevents a box's mirrored back texture
from filling its transparent holes. Static images clamp at edges; scrolling
images still repeat. Material cache keys include mode. Checkerboard previews
and short upload guidance added. Original uploaded image bytes are unchanged.
Version 8 stores optional textureAlpha (cutout/blend); versions 1–7 still load.

## Verification
- 31 relevant tests pass (format/storage/history, scenery, routes, weapon data).
- Isolated Chrome pixel checks: PNG and WebP alpha 0 reveals the blue layer
  behind the object, alpha 0.5 mixes red/blue in Soft, Cutout leaves transparent
  holes out of the depth buffer, and opacity 0.05 fades instead of disappearing.
  JPEG/untextured material behavior, all four primitives, map sharing/scrolling
  independence, separate mode materials and one-time disposal also checked.
- Real editor file upload, checkerboard preview, mode undo/redo, IndexedDB
  reload, exact PNG bytes in export, v8 import and Save & Test race all pass.
  No browser page/HTTP errors. Editor screenshot inspected.
- Final production build passes with existing large-chunk warning. Full suite
  not repeated; previously documented unrelated thruster mismatch unchanged.
- Evidence: tools/verify-texture-alpha.mjs, tmp/texture-alpha-{browser,tests,build}.txt,
  tmp/texture-alpha/editor.png. User's real browser storage untouched.

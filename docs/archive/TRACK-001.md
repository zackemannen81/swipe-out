# Current Task

Task ID: TRACK-001
Status: Complete
Created: 2026-10-26

## Scope

Record the approved staged expansion in TRACK_ROADMAP.md and deliver its first
authoring slice: versioned, validated track import/export shared with game loading,
then a usable 3D editor with history and a direct save-and-test flow. Preserve
existing tracks, local overrides, scenery, handling, CPU profiles and thrusters.
Later gameplay stages remain tracked separately; do not present them as complete.

## Definition of done

- [x] Roadmap records all six stages, order, acceptance checks and progress.
- [x] Versioned JSON round-trip and legacy migration; reject invalid/future data
      before changing a draft or saved track. Errors explain the affected field.
- [x] Editor and game share loading/validation; imported tracks can be selected,
      saved and raced without overwriting unrelated tracks.
- [x] 3D view uses game track geometry; orbit/pan/zoom, control-point selection and
      translation, height/width editing, undo/redo and save-and-test work.
- [x] Existing primitives and legacy data survive editing/export/loading.
- [x] Meaningful Node regressions, build and browser interaction checks pass.
- [x] Continuity docs and user-facing usage instructions updated with limits.

## Verification

26 Node tests pass (19 existing racing/thruster checks and seven track/history
regressions). All ten built-ins retain exact road vertices, curve length and boost
placements across normalization/export/import, including scenery and textures.
Checks cover legacy migration, unsupported versions/fields, invalid numeric data,
degenerate/oversized tracks, corrupt storage, quota failure, scoped reset and
bounded undo/redo history.

Chromium WebGL acceptance passed through the actual editor: drag the green 3D
height gizmo, undo/redo, numeric edit, point insert/delete, retain built-in scenery,
zero opacity, switch drafts, download/import a separate custom track, reject bad
JSON/future version without changing draft/storage, Save & Test, Start Race,
confirm movement on the exported track, remove only that custom track and reload
saved edits. Desktop overview/race and 844x390 layout screenshots inspected.
No JavaScript errors or failed requests in the final run. The test also exposed
an existing async loading race; Start now stays disabled until craft setup ends.

Production build and syntax/whitespace checks pass; Vite retains its large-chunk
advisory. Physical-device performance and subjective editor feel remain unverified.
The editor uses game geometry with editing lights/guides; scenery FX are previewed
statically. Bank/loop/gap physics and branches are later roadmap stages.

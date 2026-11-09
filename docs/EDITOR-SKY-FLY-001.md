# EDITOR-SKY-FLY-001 — Panorama parity and scenery editing controls
Date: 2026-11-06

## Scope
- Use the same 2:1 equirectangular scene background in game and editor; no physical panorama sphere, unnecessary fogging, or artificial sky radius.
- Editor Fly Mode toggle: WASD/arrow movement, Q/E elevation, Shift speed, left-drag mouse look; normal orbit and transform controls stay available when disabled.
- Select scenery objects with a click, add/remove with Shift/Ctrl/Cmd-click, and show group bounding helpers; move a selected group with the transform gizmo.
- Delete / Ctrl+C / Ctrl+P and toolbar actions remove, copy, and paste selected objects. Pasting preserves exact authored coordinates, rotation, scale and media references; new IDs are generated.
- Undo/redo on scene edits; 1,024-object and 16-point-light limits remain enforced.

## Verification
- `node --test tests/editor-object-actions.test.js`: 3/3 passed.
- `npm run build`: passed (existing large chunk warning).
- Isolated headless Chrome via local Vite: add object, toolbar copy/paste in place, Delete, Ctrl+Z, keyboard Ctrl+C/Ctrl+P, Fly Mode toggle/movement. No reported runtime exceptions. No changes to saved user tracks; isolated browser profile.
- Full `node --test`: 161 passed, 6 failed. The six failures are the already documented catch-up (3), Foundry CPU, Necros finish, and thruster visual test failures; no new failed tests in affected areas.
- Interactive Shift/Ctrl multi-picking and visual sky parity still benefit from the author's live on-device check, especially with heavy GLBs and actual track textures.

## Preservation
- Existing `docs/CURRENT_TASK.md` remains the active VITRUM-EDGES-001 task and was not overwritten.
- Only game sky rendering and editor authoring controls changed; no actual track data, saved browser drafts, physics, or game camera FOV changed.

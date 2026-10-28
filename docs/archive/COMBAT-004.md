# Current Task

Task ID: COMBAT-004
Status: Complete
Created: 2026-10-28

## Scope
Use supplied transparent weapon icons on floating pickups and HUD. Preserve
weapon rules and purple pad footprint. Match rockets/heatseeker/minigun filenames.

## Definition of done
- [x] Readable gently moving icons in game/editor, hidden during cooldown.
- [x] HUD shows matching icon, hides it for empty slot.
- [x] Tests/build/browser checks and continuity docs updated.

## Verification

97 Node tests pass; production build passes with existing chunk-size warning.
Browser editor/race/pause/retry/solo checks pass, all three icon URLs return 200,
HUD image decodes at 256px and hides on ammo depletion. Editor and race screenshots
reviewed. No page errors. Physical device performance remains unmeasured.

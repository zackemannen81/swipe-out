# Current Task

Task ID: TRACK-005
Status: Complete
Created: 2026-10-28

## Scope

Stage C: shared per-point road width, editable boost/brake pads, animated readable
pad markings and corner arrows, opt-in road style and a demonstration circuit.
Keep legacy tracks compatible and preserve countdown, controls and accepted AI.
User has playtested all CPU levels and committed/pushed the accepted baseline.

## Definition of done

- [x] Width affects road/rails, collisions, AI, guide, branches and gap landing.
- [x] Versioned data and editor support widths/pads, undo/reload/import/export.
- [x] Pads are visually distinct, swept for high speeds, shared by player/CPU;
      brake pads slow once per crossing and can be avoided/recovered from.
- [x] Smart pad suggestions and turn signs avoid unsafe track regions; new road
      style is demonstrated separately from existing authored tracks.
- [x] Tests/build, browser authoring/race and visual checks pass; docs updated.

## Verification

- 86 Node tests pass; production build passes with existing large-bundle warning.
- Twelve CPU runs (four drivers, three levels) finish three Workshop laps.
- Browser verifies widths, undo/redo, pads, save/reload, JSON download/import,
  race start and retry; no page errors. Editor and desktop/844x390 race inspected.
- Existing track data, countdown and camera settings preserved.
- Human stage-C balance and physical-phone performance remain for playtesting.
- Guide: TRACK_WORKSHOP.md. Next roadmap delivery: D1 combat feedback/hot/flares.

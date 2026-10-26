# Current Task

Task ID: TRACK-002
Status: Complete
Created: 2026-10-26

## Scope

Deliver approved roadmap stages 3 and 4: real road gaps with world-space flight,
landing and safe recovery, plus magnetic banked/twisted/looped track with shared
stable orientation. Extend the editor and versioned format, add separate playable
test circuits, and preserve original tracks/handling. Player and CPU use the same
surface/flight rules. Branches and weapons remain later stages.

## Definition of done

- [x] Version 2 adds validated gap intervals and magnetic/bank authoring; legacy
      and v1 imports retain their original geometry/behavior.
- [x] Shared continuous frames drive geometry, physics, AI, pads and race camera.
      No singularity or sudden flips at vertical/inverted track or closed seams.
- [x] Gaps remove road, rails, markers and pads; craft launch with world momentum,
      limited air control, swept landing and safe pre-gap recovery on a miss.
- [x] Magnetic road holds player and CPU through bank, inversion, barrel roll and
      a vertical loop; flight detaches only at missing road, not loop crests.
- [x] Editor supports gap placement and bank/roll settings with undo/export/test.
- [x] Separate clearly named test tracks available in game and editor.
- [x] Tests cover low/high speed, lane misses, landing/respawn, interactions,
      pause/reset and 30/60/120 Hz; CPU field can complete both test tracks.
- [x] Build, browser rendering/control/race integration and continuity docs checked.

## Verification

35 Node tests pass, including nine new feature regressions. All four CPUs finish
three laps on both test tracks with actual pads/collisions. Flight/landing and
magnetic traversal agree at 30/60/120 Hz; 8,192 frame samples check continuity.

Chromium WebGL: gap/bank/side-view editing, undo and v2 export/import; player and
all CPUs complete the jump; pause freezes flight; a controlled low-speed miss
recovers before the ramp; reload clears flight state. Actual loop traversal and
an inverted roll pose render with local-up camera. Inspected screenshots, then
made the magnetic deck opaque/emissive and repeated feature browser verification.
Existing editor acceptance also passes 3D drag/history, custom save-and-test,
invalid-file preservation, scoped reset, reload and landscape layout.
Both scripts report no JS errors or failed requests. Build, syntax and diff checks
pass; Vite's existing large-chunk advisory remains. Final local-axis impact shake
integration is syntax/build checked; camera physics remains covered by Node tests.

Playtest: /?track=track11 (Gap Run), /?track=track12 (Loop & Roll).
Hold throttle after countdown for the gap. Orange marks takeoff, green landing.
Editor and JSON preserve authored magnetic/gap/bank data. Human comfort, balancing
and physical phone performance remain explicitly open in TRACK_ROADMAP.md.

# Current Task

Task ID: TRACK-004
Status: Complete
Created: 2026-10-26

## Scope

Author a complete new circuit using the user's primitive textures, with a cohesive
industrial environment, gaps, banked corners, a vertical loop, a technical section
and a shortcut. Preserve existing tracks, tuning and original source images.

## Definition of done

- [x] New circuit available in the race and 3D editor as track15.
- [x] Authored scenery gives each sector identity and leaves racing space clear.
- [x] Optimized texture derivatives, reproducible conversion and bounded shared
      scenery GPU resources; original files retained.
- [x] Two playable gaps, banked corners, technical S bends, loop and shorter,
      narrower alternative route with readable approaches.
- [x] Player/CPU physics complete the course; both routes and jumps verified.
- [x] Browser visual inspection, texture requests, editor export/reload checks,
      appropriate regression tests and production build pass.
- [x] Track guide and continuity documents record features and verification limits.

## Verification

50 Node regressions pass. The six affected Foundry tests pass again after the
final scenery adjustment. Player simulation completes three laps on either route;
all four CPUs finish three laps with both routes, six landings and no recoveries.
Both jumps pass at normal/boosted speeds and 30/120 Hz; slow misses recover safely.
Tests also cover conservative scenery clearance, v3 round-trip, asset sizes,
shared resources, independent scrolling and disposal on rebuild.

Chromium WebGL passes optimized texture loading, controlled sector/cockpit/loop
captures, actual render-loop jumps on both gaps, lane-selected shortcut travel
through merge, landscape layout and editor export/save/reload. Inspected captures
are in temporary swipe-out-track004. The existing editor browser suite also
passes its real gizmo, history, texture, import, reset and Save & Test flows.
Both suites report no JS errors or failed requests.

Final production build, syntax and diff checks pass. The existing Vite large
chunk warning remains. Original source textures and existing gameplay tuning are
preserved. Real-device performance, human difficulty/fun and loop comfort remain
playtest items, documented in ION_FOUNDRY.md and CURRENT_STATUS.

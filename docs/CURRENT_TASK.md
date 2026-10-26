# Current Task

Task ID: TRACK-003
Status: Complete
Created: 2026-10-26

## Scope

Deliver approved stages 5 and 6 (alternative routes and optional combat) plus
scenery-object cloning requested by the user after their positive gap/loop test.

## Definition of done

- [x] Clone scenery with independent data, new ID, visible offset, all properties,
      undo/redo, save and export.
- [x] Version 3 validates branches and migrates v1/v2/legacy files.
- [x] Continuous route splits/merges; actual route length controls travel time,
      shared progress/checkpoints control rank, laps, finish and catch-up.
- [x] Player approach-lane choice and CPU use of both routes; geometry, pads,
      walls, collisions, minimap, camera and reset respect route selection.
- [x] Editor creates/removes branches and edits connections, width and 3D points.
- [x] Optional combat defaults off; shared player/CPU ammunition, cooldowns,
      swept projectile hits, knockback, speed loss and brief hit protection.
- [x] Rockets, lock-on missiles with sight/lock/warning, and a bounded minigun
      trial; keyboard/touch controls; pause/retry/finish lifecycle.
- [x] Separate playable route/combat test circuits, readable HUD and effects.
- [x] Node/browser verification, production build and continuity docs complete.

## Verification

44 Node tests pass, including nine new route/combat regressions. All four CPUs
finish three validated laps using both paths with contacts and boost pads. Tests
check real route-time savings at 30/60/120 Hz, equal-progress catch-up, ordered
gates, route pads, safe recovery after merges, swept weapon hits, dodges/occlusion,
homing lock/warnings, ammo/reload/cooldowns, protection and lifecycle/air impulses.

Chromium WebGL passes cloning identity/properties/textures/independence,
undo/redo/save/reload/export, branch editing/creation/removal and v3 import/export.
A controlled player approach takes and traverses the shortcut, merges, and updates
the minimap/HUD. Actual keyboard and pointer controls fire rockets, homing missiles
and minigun; player and CPU hits, lock reticle, paused shots, finish/retry and
landscape layout pass. The existing editor browser suite also passes. No JS errors
or failed requests. Inspected screenshots in temporary swipe-out-track003.

Production build, syntax and diff checks pass; existing Vite chunk warning.
Final bounded/instanced branch-fixture and validation changes pass the affected
16 route/combat/format tests and a fresh build. Accepted speed, CPU and thruster
tuning is retained. Human balance/fun, sound mix, touch comfort and physical-device
performance remain explicit playtest items in the roadmap.

Try track13 (Split Decision, approach LEFT for Needle Shortcut) and track14
(Crossfire Circuit, enable COMBAT MODE before start). Space/FIRE shoots; 1/2/3
select weapons. Editor CLONE OBJECT / Ctrl/Cmd+D duplicates selected scenery.

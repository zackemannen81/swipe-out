# Current Task

Task ID: IMPLEMENT-004
Status: In Progress
Owner: Agent 008
Created: 2026-10-10
Last updated: 2026-10-10

## Task Summary

Advance the approved one-track arcade racer with a small CPU field: add two distinct rivals that follow Neon Causeway, race at tunable deterministic cruising speeds, and contribute to live and final player placement. Preserve the accepted player handling, course, camera, and one-lap start/finish/retry flow. This is a first competition prototype, not sophisticated opponent AI.

## Definition of Done

- [ ] Two visually distinct CPU craft start with the player, remain on the route, and advance according to their own distance/speed without modifying the player's handling.
- [ ] Live HUD shows the player's correct position in a three-racer field; finishing displays the position recorded at the player's finish.
- [ ] Race Again resets both rival distances, race position, and player race state for a fresh run.
- [ ] The three-racer HUD and results remain legible in desktop and narrow mobile layouts.
- [ ] Document that opponent movement is deterministic prototype behavior with no collision system or advanced track-aware strategy.
- [ ] JavaScript syntax checks, production build, a distance/position/reset simulation, and `git diff --check` pass.
- [ ] Interactive browser race/finish/retry and physical-device checks are recorded only if actually observed; otherwise keep them explicitly pending.
- [ ] README, GDD, system/status docs, file map, and journal accurately describe the new implementation and its verification limits.

## Scope notes

Use two simple procedural CPU racers on the existing track. Keep fixed lane neighborhoods with only subtle deterministic lateral variation, and modestly distinct speed profiles so throttle choice can affect placement. No collisions, rubber-banding, opponent names/personality systems, new tracks/crafts, audio, or handling/camera retuning in this task. The user's accepted drive-feel tuning from IMPLEMENT-003 is closed and should be preserved.

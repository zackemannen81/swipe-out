# Current Task

Task ID: COMBAT-002
Status: Complete
Created: 2026-10-28

## Scope

Roadmap D1: impact flash/sparks, separate outgoing lock and incoming threat HUD,
short audio alerts, shared player/CPU flares with 25s cooldown and 1.2s deployment.
Use X, touch button and gamepad B/Circle (index 1); preserve F pitch, handling,
countdown and Time Attack isolation. Weapon pickups remain the separate D2 step.

## Definition of done

- [x] Homing missiles visibly divert into flares; rockets/bullets remain dangerous.
- [x] CPU and player share rules; cooldown, pause, retry/finish and solo are correct.
- [x] Distinct readable lock/threat/success and ready/cooldown HUD, keyboard/touch/pad.
- [x] Bounded fading impact/flare effects and transition-based warning sounds.
- [x] Tests/build and browser lifecycle/layout checks; continuity docs updated.

## Verification

90 Node tests pass; production build passes with the existing large-chunk warning.
Browser checks X/touch/simulated standard gamepad B, pause freeze, cooldown, retry,
Time Attack isolation and 844x390/568x320 threat/lock separation. No page errors.
Inspected desktop/landscape threat, diversion and impact screenshots. Physical
phone/controller testing, perceived sound level and human balance remain.
Guide: COMBAT_DEFENCE.md. Next roadmap stage: D2 weapon pickups.

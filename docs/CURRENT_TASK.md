# Current Task

Task ID: RACE-003
Status: Complete
Created: 2026-10-26

## Scope

Add the approved mild catch-up to player and all four CPU ships equally.
No target bonus within a two-second estimated leader gap; rise smoothly to
8% at eight seconds. Smooth activation/removal. Preserve current CPU profiles,
normal acceleration, physical collision consequences and accepted thruster tuning.

## Definition of done

- [x] One documented configuration for gap thresholds, maximum and smoothing.
- [x] Shared leader snapshot and lap-aware accumulated distance; no leader slowdown.
- [x] Bonus affects attainable top speed and CPU demand, including physical boosts.
- [x] Pause, reset, countdown and finish handled; collisions/braking still matter.
- [x] Numerical regressions and browser integration checks; production build passes.
- [x] Continuity and tuning documentation updated with evidence and limits.

## Verification

19 tests pass, including seven new catch-up tests for thresholds, symmetric help,
30/60/120 Hz smoothing, leader changes, lap/finish bounds, real acceleration,
braking/wall loss, pad stacking, CPU traffic limits and reset. Build/syntax/diff
checks pass (existing Vite large-chunk warning). Chromium WebGL confirmed player
and CPU bonuses, zero leader bonus, decay after lead change, frozen pause and
five zero bonuses on restart, without console errors or failed requests.

The gap is an estimate using nominal leader speed, not a recorded timing split.
User-tuned CPU caps 129/130/135/136 and the shorter thruster tuning are preserved.
Final difficulty feel and physical-device performance remain playtest items.

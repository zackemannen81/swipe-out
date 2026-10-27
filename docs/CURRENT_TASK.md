# Current Task

Task ID: DRIVE-002
Status: Complete
Created: 2026-10-27

## Scope

Explain classic steering and fix the reported Wipeout wall-to-wall pinball.
Preserve open-track steering, drift/countersteer, impact speed loss and the
existing Swipeout/CPU wall response. Isolate changed Wipeout Time Attack records.

## Definition of done

- [x] Reproduce unsolicited opposite-wall contact and identify stacked impulses.
- [x] Classic wall contact dissipates lateral/yaw motion without creating a new
      sustained inward heading; player countersteer remains effective.
- [x] Same resolver covers physics and post-collision wall correction, including
      cooldown contact. Mirror/fps/width/steering tests and regressions pass.
- [x] Preserve Swipeout/CPU response and their records; version only classic PBs.
- [x] Build and continuity/user-control documentation updated with limits.

## Verification

Before fix, a straight 10-wide track at speed 143 with lane 4.1, lateralVelocity
12, yaw 0.4 and yawVelocity 0.8 hits the opposite wall after 0.52 s with no steering,
then two more walls within 3.3 s. A 0.1 s away-steer pulse makes five wall hits
within six seconds. Input is not required to sustain the initial oscillation.

After fix: one contact for the same no-input fixture; digital escape and
countersteer also avoid repeat contact. All 71 tests and production build pass.
Existing chunk-size warning remains. Human/browser/device feel not re-tested.

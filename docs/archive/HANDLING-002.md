# Current Task
Task ID: HANDLING-002
Status: Complete
## Scope
Inspect tmp/src reference and trial soft track-relative nose return on steering
release in Classic/Wipeout. Preserve independent sideslip, no lane centering,
held steering, differential airbrakes and previous tuning.
## Acceptance
Release returns yaw smoothly without sign flip, preserves transient drift and
lane position; input/airbrake control retained. Relevant tests and build pass.
Clearly distinguish user-requested adaptation from original Wipeout behavior.

## 2026-11-03 - HANDLING-002 release-to-neutral trial
Read tmp/src/wipeout/ship_player.c: steering acceleration/countersteer 167-194,
velocity skid 365, banking and neutral-input angular braking 421-441. Original
normal driving damps angular velocity and roll, not heading to track tangent;
heading-to-track at 463 is rescue behavior, not player steering. This trial is
an explicit user-requested ribbon-track adaptation, not claimed original parity.
Classic now damps local yaw toward zero at rate 4.5/sec when steering is neutral
(0.03 deadzone), differential brake is below .01 and ship is on the surface.
About 90% of angle clears in .51 sec. Existing yaw-rate decay settles banking;
release does not directly change lane position or sideways velocity. Active
steering, differential airbrakes and airborne/flight heading retain integration.
Previous stronger drift/bank and calmer nose tuning retained. Standard unchanged.
23 tests pass including mirrored monotonic return, analog neutral noise, drift
persistence/no lane centering, airbrakes, airborne exclusion, 30/60/120Hz, gaps,
three-lap CPU/player and original scenery checks. Build passes (existing chunk
warning). No browser/human playtest this pass; release timing awaits user feel.
Evidence: tmp/heading-return-tests.txt and tmp/heading-return-build.txt.
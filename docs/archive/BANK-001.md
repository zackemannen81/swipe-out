# Current Task
Task ID: BANK-001
Status: Complete
## Scope
Decouple craft roll from lateral drift in both handling modes. Steering/yaw
response controls local banking; existing road-frame banking remains. Preserve
lateral forces, steering assistance, adhesion and track data.
## Acceptance
Opposite sideslip cannot reverse roll under unchanged steering. Unsteered drift
must not introduce bank. Verify both modes, mirrored controls and driving tests.

## 2026-11-03 - BANK-001 steering bank independent of drift
Removed lateralVelocity from both standard and classic roll targets. Previously
outward drift could overpower steering bank and tip the craft to the opposite
side. Standard local bank now follows -yawVelocity * 0.3 (same 0.38 cap and
damping); classic retains its yaw term, spring and damping. Road-frame roll is
still composed into the craft orientation. Side forces, grip, assistance and
magnetic adhesion are unchanged. No reduction of road banking in this pass.
24 tests pass, including new mirrored steering/opposing-drift/neutral-input
checks in both modes, existing handling, magnetic drift and loop/camera tests.
Production build passes with existing chunk warning. No browser visual playtest
this pass; the behavioral regression is verified through production physics.
Evidence: tmp/banking-tests.txt, tmp/banking-build.txt. No user saves modified.
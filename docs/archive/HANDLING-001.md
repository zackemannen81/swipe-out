# Current Task
Task ID: HANDLING-001
Status: Complete
## Scope
Tune only Classic/Wipeout from user playtest: slower/smaller nose rotation,
stronger steering bank and stronger outward curve drift. Keep effects decoupled.
## Acceptance
Driving, gaps, mirrored heading/drift and bank regression checks pass; production
build passes. Record tuning values; subjective balance needs user playtest.

## 2026-11-03 - HANDLING-001 Wipeout tuning
User requested less nose rotation, more bank and more outward drift. Classic
turnRate 1.1 -> 0.8, maxHeading 0.65 -> 0.48, brakeYaw 0.0032 -> 0.0024.
Steering bank is normalized by turnRate and targets 0.32 local roll at full
input (formerly 0.22); makePose applies twice this angle, about 37 degrees
versus 25. Curvature impulse coefficient 0.5 -> 0.75, grip unchanged. Nose,
bank and curvature drift remain separate; standard Swipeout is unchanged.
Turn acceleration remains 2.8: trial 2.2 caused the existing timed wall-escape
regression to recontact a rail, so the original response was retained.
22 targeted tests pass including wall recovery, mirrored yaw/drift, banking,
frame rates, gaps, three-lap player/CPU simulations and original mesh checks.
Final production build passes with existing large-chunk warning. No browser
playtest this tuning pass; subjective balance needs user driving feedback.
Evidence: tmp/handling-tune-tests.txt and tmp/handling-tune-build.txt.
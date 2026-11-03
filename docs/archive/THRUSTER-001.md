# Current Task
Task ID: THRUSTER-001
Status: Complete
## Scope
Taper thruster ribbon geometry with normalized age, from full nozzle width to a
fine tail. Preserve lifetime, power, colors and existing alpha fade.
## Acceptance
Actual ribbon width decreases with age, reaches zero at expiry, remains finite
at camera-aligned angles. Run thruster checks and build; distinguish baseline
failures from regressions.

## 2026-11-03 - THRUSTER-001 age taper
Changed ribbon half-width multiplier from 1 + age * .35 (expansion) to
(1 - clamped normalized age)^1.2. Full width at nozzle, about 44% at half-life,
3% at 95% lifetime and zero at expiry. Core and halo share tapered geometry.
No lifetime/power/color/particle changes. Geometry test covers monotonic width
and camera-aligned fallback. Six thruster tests pass; one pre-existing hull width
expectation fails identically before/after (.775 actual vs .675 expected).
Build passes with existing chunk warning. Evidence: tmp/thruster-taper-baseline.txt,
tmp/thruster-taper-tests.txt, tmp/thruster-taper-build.txt. No visual playtest.
# Current Task

Task ID: PRESENT-002
Status: Complete
Created: 2026-10-28

## Scope

Correct the start/retry view from external to the user's preferred wipeoutStyle.
Keep intro, countdown, camera-profile selection and camera tuning unchanged.

## Definition of done

- [x] Start and retry select wipeoutStyle; intro hands off to that view.
- [x] Existing browser acceptance checks expect the corrected mode and pass.
- [x] Syntax/diff checks and continuity updated.

## Verification

Browser presentation acceptance passes with wipeoutStyle at intro/countdown
and retry; unchanged countdown sound/source checks pass. Syntax and diff checks
pass. No claim of high-speed visibility verification on every circuit.

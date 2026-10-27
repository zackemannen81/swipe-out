# Current Task

Task ID: DRIVE-001
Status: Complete
Created: 2026-10-27

## Scope

Add an optional Wipeout-inspired handling profile and source-informed camera
following, using the user-provided tmp/src/wipeout reference. Keep existing
Swipeout handling/assist, mobile input and default camera behavior available.
Expose independent handling/camera preferences for direct comparison.

## Definition of done

- [x] Source comparison documented, including adaptation boundaries.
- [x] Swipeout remains default; Wipeout uses nose/momentum separation, angular
      acceleration/countersteer and independent airbrakes without lane centering.
- [x] Camera follows ship heading with damped track-relative correction; supports
      normal/loop/branch/airborne views and safe reset without world-position lag.
- [x] Separate saved control/camera choices; assist clearly applies to Swipeout.
- [x] Wipeout controller mapping separates thrust from right airbrake; keyboard
      and touch remain usable; pause/retry/menu/disconnect state is safe.
- [x] Meaningful frame-rate/physics/camera/input/settings tests, browser flows,
      existing regressions and production build pass.
- [x] Continuity docs include how to compare/tune and human-playtest limits.

## Verification

- 58/58 Node tests pass, including eight new driving-mode tests.
- Production build passes with the existing large-chunk warning; diff check passes.
- Chromium WebGL passes saved/independent settings, keyboard countersteer,
  synthetic gamepad mapping/disconnect, mobile pointer steering/pedal, pause and
  pointer capture cleanup, real gap landing, inverted chase/cockpit, retry/menu.
  No JavaScript errors or failed HTTP requests. Screenshots: temporary
  swipe-out-drive001. Browser instrumentation is response-only, not shipped.
- Automated classic input driver completes three Foundry laps with ordered gates,
  branches, six landings and no recovery. It contacts walls; human handling quality
  and physical phone/controller comfort remain unverified.

This is a scale-adapted track-relative profile, not a free-body port of original
triangle collision/track repulsion. CPU driving remains unchanged. See
DRIVING_MODES.md for source comparison, controls, tuning and limits.

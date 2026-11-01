# Current Task
Task ID: RENDER-001
Status: Complete

## Scope
Enable the existing user-verified HDR sanitizer at startup, before bloom.
Keep F5 available for diagnostics. Menu overhaul, Necros animation, warning
signs and cinematic intro remain the next presentation work.

## Acceptance
- Fresh load and reload enable HDR sanitizing without keyboard input.
- F5 still toggles the diagnostic comparison.
- Production build passes; no changes to track saves or countdown.

Prior task record preserved as-is in archive/EDIT-CAMERA-COMBAT-001.md.

## Verification
Production build passes (existing chunk-size warning). Isolated Chrome/WebGL
checks on two fresh loads verify the enabled pass after rendering, F5 off/on,
and no page errors. User reports this existing pass fixes the Necros artifacts;
the custom saved scene was not modified or independently replayed.

# Current Task
Task ID: AMBIENT-PARTICLES-001
Status: Complete
## Scope
Connect the user's existing ambient-particles module to non-Vitrum tracks,
race/preview animation and editor preview. Retain Vitrum spores and particle art.
No physics, geometry or balance changes; user confirms authored tracks work.
## Acceptance
Non-Vitrum tracks receive exactly one ambient system; Vitrum keeps only spores.
Uniforms animate in game/editor and pause with race; track disposal frees resources.
Focused tests, production build and browser render verification.

## Verification
Two focused tests pass; production build passes (existing chunk warning).
Chrome Necros/Collective animate, freeze on pause, load scenery and return to bus.
Editor preview on/off verified; no page errors; both race screenshots inspected.
No physical-device performance measurement. Particle module/art remains unchanged.

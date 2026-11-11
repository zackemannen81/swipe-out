# Current Task
Task ID: TOUR-WORKSHOP-001
Status: Complete
## Scope
Present the existing garage as a Service Bay work view when entered from the bus.
Retain carrier navigation/crew overlay and continuous workshop music/voice. Fade
between platform and garage; Back returns to platform, room buttons go elsewhere.
Preserve standalone garage and existing craft/paint/module save behavior.
## Acceptance
Browser checks carrier styling/navigation, fades/reduced motion, uninterrupted
voice/music, Back, room departure, customization persistence and standalone garage.
Desktop/mobile layout inspected; targeted regressions and production build pass.

## Verification
15 targeted tests pass; production build passes with existing chunk-size warning.
Isolated Chrome verifies same-element music/voice continuity, local fades, headings,
crew/nav UI, paint persistence, Back/Escape, room navigation, reduced motion and
standalone garage isolation. Desktop/mobile screenshots inspected; zero page errors.
Physical gamepad/mobile audio remains untested.

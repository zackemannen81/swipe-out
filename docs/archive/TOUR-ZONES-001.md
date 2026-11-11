# Current Task
Task ID: TOUR-ZONES-001
Status: Complete
## Scope
Separate the five existing Tour Bus destinations in the existing scene. Reuse
assets and garage/world flows. Add 16-zone registry, connections, camera stations,
short masked scene transitions and consistent history/back controls.
Supplied overview plan now defines all logical positions and deck assignments.
Unspecified Archive deck uses the adjoining Market deck; restricted deck is a label, not an invented public floor.
Prior unfinished Vitrum task preserved in archive/VITRUM-EDGES-001-in-progress.md.
## Acceptance
Five enclosed destinations follow the requested spatial relationships; observation
is outside hangar. All 16 zones registered, only five destinations selectable.
No visible travel through walls; Escape/Back restores stations. Existing garage,
profile and departure flows retained. Asset guide updated. Targeted tests, browser
navigation checks and production build pass.

## Verification
10 targeted Node tests pass (all station pairs, graph and career persistence).
Production build passes; existing bundle-size warning remains. Isolated Chrome
navigation, garage return, Escape/footer Back, departure/race return, Necros gate,
mobile and reduced-motion checks pass without page exceptions. Room screenshots
inspected. Physical-device performance and listening remain outside verification.

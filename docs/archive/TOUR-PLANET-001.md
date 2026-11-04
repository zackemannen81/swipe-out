# Current Task
Task ID: TOUR-PLANET-001
Status: Complete
## Scope
Use the user's surface, cloud and space JPGs for Necros outside the Tour Bus window.
Keep cloud opacity at 0.25 on a slightly larger sphere. Preserve Vitrum selection.
## Acceptance
Images load locally, planet/cloud layers render through the window, world switching
works, resources dispose, scene tests/build and browser visual check pass.

## Verification
Scene test and production build pass (existing bundle-size warning). Browser loads
all three images, checks cloud opacity/radii and world switching; zero JS errors.
Observation screenshot inspected: tmp/tour-necros-textured.png.

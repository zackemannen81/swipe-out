# Current Task
Task ID: TOUR-OBS-GREENERY-001
Status: Complete
## Scope
Continue observation-deck art using supplied reviewed tree/bush models and soil
maps. Preserve architecture, camera, navigation, race behavior and source assets.
## Acceptance
Two trees and four shrubs load into named slots with shared resources and fallback.
Soil textures use correct color/data spaces and existing resource disposal.
Check actual loaded bounds, central sightline, world switching, mobile, Back,
existing observation tests and production build. Document provenance and limits.

## Verification
Two focused architecture/room tests pass. Chrome verifies six loaded, grounded
new props, shared shrub geometry, clear camera ray, loaded 2K soil maps, world
switching, mobile and Back, with no page errors. Desktop/mobile screenshots
inspected. Production build passes with existing chunk-size advisory.
No physical-device frame-rate measurement; dense fern remains pending optimization.

# Current Task
Task ID: VITRUM-006
Status: Complete

## Scope
Build a layered forest scenery enclosure around Vitrum using generated image
cutouts, silhouettes and depth separation. Interpret the user's shield as a
visual scenic boundary that hides empty space and creates parallax. Generate
project assets with the built-in image tool. Preserve supplied sky, manual
editor objects (user screenshot has 232), source models, route and saved work.
Scenery should adapt to Vitrum's current route in both game and editor.

## Acceptance
At least three physical depth layers, with transparent canopy silhouettes and
generated art saved in the project. Keep scenery outside the racing corridor;
avoid flat rectangular image borders, camera-following walls and sky replacement.
Inspect driving views in all seven sectors, editor/save behavior, image loading,
resource disposal, geometry clearance and parallax. Build/relevant tests pass.
Record asset and draw-call cost and limitations.

## Progress
Implemented three world-fixed forest rings (48 cards), 28 hanging root cards
and 428 understory clusters using three crossed planes each. Five instanced
draws / 1,360 cards / 2,720 triangles, three shared RGBA images (8.86 MiB).
Generated assets and exact prompts are in public/images/stage2/parallax/.
Root curtain v2 removes a background matte discovered in the first preview.
Scenery follows the current Vitrum route when rebuilt in race or editor, outside
the driving corridor, without changing stored object arrays or the supplied sky.

## Verification
- Ten targeted tests pass: original six Vitrum tests plus alpha asset format,
  positive instance transforms, 1,200-station full-card clearance, differential
  parallax, edited-route adaptation, Vitrum-only integration and disposal.
- Isolated Chrome: three decoded RGBA maps, empty curtain alpha gaps, all seven
  driving sectors and additional viewpoints inspected, 227 GLBs loaded, no
  page/HTTP errors. Editor export/save/reload passes; a synthetic 232-object
  saved override preserves every object and receives the screen automatically.
- npm run build passes with existing chunk-size warning. Full unrelated suite
  not repeated (known earlier thruster expectation mismatch remains).
- Whole-frame captures: 69–219 draws / 0.87–3.34M triangles. Device FPS/overdraw
  are not measured. Flat art can be apparent from unusual editor/flyby angles;
  this layer is automatic scenery, not separately editable track objects.
- Evidence: tmp/vitrum-screen-{tests,browser,build}.txt and tmp/vitrum/*.png.

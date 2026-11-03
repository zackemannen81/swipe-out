# Vitrum Lithofyter · Neural Ascent

World 02 is track18 in Quick Race, Time Attack and the editor. The existing
Necros campaign remains separate. Race: `/?track=track18`; editor:
`/editor.html?track=track18` on the running server.

## Environment revision — VITRUM-002, 2026-11-03

The first sparse roadside-prop pass was rejected by the user. The current
revision replaces it with connected architecture and clustered supplied models.
The verified road is unchanged: 32 control points, 8,948.31 world units (29.1 km
in the 3.25 m/unit HUD), about 560 units of height change, 26/30-unit road width,
24 off-centre boost pads. No physics, camera-follow or countdown changes.

| Area | Lap start | Built environment |
| --- | ---: | --- |
| Rootwake | 0% | Connected root sanctuary, five paired arches, towering groves |
| Great Canopy | 11.94% | Layered canopy trees, large crossing roots, colony shelves |
| Glassroot Ascent | 23.65% | Intertwined root supports under the climb, arch sequence |
| Mycelium Veins | 35.55% | Continuous opaque vault, interior ribs and cyan neural veins |
| Singing Ravine | 48.93% | High continuous ravine walls, hanging roots and open bridges |
| Neural Bloom | 66.70% | Drive-through petal vault, suspended heart, amber lighting |
| Canopy Return | 80.13% | Root bridge, seven connected groves and return arches |

The Bloom heart is at 70.70% of the lap. Tunnel interior is around 41.5%.
These are scene landmarks for the user's later trailer/flyby, not a screenplay.

229 editable objects: 220 instances of the nine supplied assets, seven organic
architecture GLBs, one ground object and one point light. Supplied source models
are unchanged. Each organic module is an editor object with its own transform;
its internal roots are merged into 4–5 material batches. Individual supplied
plants/arches/bridges remain independently editable. Root shelves and under-road
keels connect scenery across sector boundaries. Orb motion uses the existing
animation system. No dynamic shadows were added.

The seven organic GLBs total approximately 12.8 MiB. Each embeds its procedural
surface texture and needs no sidecars. Existing per-scene model caching shares
geometry/materials/textures between repeated models. New modules use indexed
geometry and merged materials to keep draw calls bounded.

## Rebuilding and editing

- The current material source is the user's six sets in `public/images/theforest`.
  `tools/build-vitrum-surface.py` is retained as a legacy prototype; its generated
  texture is no longer used by the road or organic modules.
- `node tools/build-vitrum-organics.mjs` generates all seven GLBs from the current
  route and sector anchors. The shipped GLBs work without running the tool.
- `src/track-vitrum.js` owns authored route, colonies and external module paths.
- If the source route is changed, regenerate the matching organic GLBs. An editor
  route edit does not automatically reshape the static architectural meshes.
- Saved browser overrides are preserved, not migrated or overwritten by this
  update. Export any valuable saved track before resetting it to the built-in.

## Media — VITRUM-003

Supplied `/images/backdrop_track-017.jpg` (4096x2048) now backs the Vitrum
sky sphere. The course card retains concept1. `track15.m4a` is the circuit
soundtrack; `track16.m4a` is available alongside it in Settings and pause.
Both are unrestricted music choices and persist across reloads and race starts.
Choose Circuit soundtrack in Settings to restore each course's default.
Existing explicit soundtrack choices are preserved. Original media is unchanged.
The user still owns the trailer/flyby. `trackMedia` applies the new panorama and
default song to saved/imported Vitrum definitions as well.

## Verification and limits

- Six Vitrum tests pass: round-trip/assets/pads, route topology/elevation,
  12 CPU difficulty/driver combinations finishing three laps, both player
  handling modes at 30/120 Hz with assist off, actual supplied GLB bounds, and
  actual organic triangle clearance along 1,200 road stations and five lanes.
- Passage tests cast up through nine units of ship space. They test real mesh
  surfaces because enclosing boxes intentionally contain the drive-through road.
- Player simulations use input-only lane steering; no progress/pose teleporting.
  This is not certification of human fun or Elite difficulty balance.
- Isolated Chrome loads all 227 GLB instances without load errors, captures all
  seven sectors plus interiors/Bloom overview, and verifies editor export/save/
  reload. No page or HTTP errors. All final screenshots were inspected.
- Production build passes with the existing large-bundle warning.
- Full suite: 142/143 pass. The pre-existing Sacrifice jet-width expectation
  remains .675 while the working implementation is .775. Both were left intact.
- Observed diagnostic whole-frame counts include postprocessing: roughly
  72–193 draws and 0.70–2.12 million triangles in captured race views. These
  are not FPS measurements or RTX 3060 Ti certification. Human driving feel,
  physical-device performance and final media/art review remain playtests.

Run `node --test tests/vitrum.test.js` and `npm run build`.
For browser checks set PLAYWRIGHT_MODULE to an installed Playwright index.mjs,
start Vite on port 5173, then `node tools/verify-vitrum.mjs`.
Evidence: `tmp/vitrum/`, `tmp/vitrum-2-browser.txt`,
`tmp/vitrum-2-full-tests.txt`, `tmp/vitrum-2-build.txt`.

## Forest-city pass — VITRUM-004

The user's Avatar reference is interpreted as an original luminous woodland
settlement, using Vitrum's own forms/assets. Added 23 tree settlements, each with
three terraces, 15 pod dwellings with road-facing warm/violet openings, root
ramps and a sheltering crown. There are 69 inhabited terraces / 345 pods,
12 elevated cross-road footbridges, side promenades, hanging seed lanterns and
280 small luminous shoulder fronds. Settlement terraces were moved closer and
lower after visual review so the habitation reads from racing height.

These details are merged into the existing seven editable GLB modules, now six
material batches each. The object count remains 229; original nine assets and
all supplied media are retained. The module download grows from ~12.8 MiB to
~30.6 MiB. Small pods/lanterns use reduced sphere subdivisions. No new runtime
lights, shadows, physics, animation systems or external dependencies were added.

Human visual preference and target-device frame time still require playtesting.
The source remains reproducible through tools/build-vitrum-organics.mjs.

## 2026-11-03 — VITRUM-004 verification
Six Vitrum tests pass, including three-lap CPU/player simulations and actual
mesh clearance at 1,200 stations / five lanes. Build passes (existing bundle
warning). Isolated Chrome loads all models and verifies editor export/save/
reload; driving views and inhabited-terrace detail inspected. No page/HTTP errors.
Captured whole-frame rendering is about 74–204 draws / 0.87–2.64M triangles,
including postprocessing. Not an FPS measurement. Full suite was not rerun for
this asset-only pass; the previously documented unrelated thruster failure is
not claimed fixed.

## Forest materials and grounding — VITRUM-005

The user's supplied 512px PBR maps now replace the procedural deck and the
single repeated architecture texture. All six families are used:

| Supplied family | Surfaces |
| --- | --- |
| 01 moss/fern | Continuous banks, soil caps, terraces, distant ground |
| 02 ivory bark | Trunks, roots, organic structures and pod walls |
| 03 green canopy | Umbrella tops, mushroom roofs and broad understory leaves |
| 04 amber gills | Mushroom undersides and warm luminous openings |
| 05 cyan mycelium | Road, neural roots and their supplied emissive mask |
| 06 lavender membrane | Petals, fronds and violet accents |

Each module embeds 19 unique source PNGs: six base colors, six normals, six
roughness maps and the mycelium emission mask. Shared bark/ivory and gill/glow
materials reuse images within a GLB. Normal/roughness are linear data; base
color/emission are sRGB. Grayscale roughness uses glTF's green channel, with
metallic factor zero. Normal strength is restrained because these are inferred
maps. The nine original source GLBs keep their own textures and mesh data.

Root UVs follow their length and circumference; cap tops use planar coordinates
and undersides radial coordinates. Eight material batches per module. Terrain
and structure vertex colors add broad dirt stains and darker undersides. The
road has edge weathering, a clear coat and a downsampled 1024x512 reflection of
the supplied sky. Reflections are static environment reflections, not mirrored
nearby objects. Maps and reflection resources follow normal track disposal.

The user then supplied live screenshots of floating model bases. Authoring now
measures each model's lowest vertices and foot footprint, aligns smaller plants
to the bank, and keeps monumental trunks upright. All 219 planted source-model
instances have soil caps, deep root bases and connecting buttresses derived
AFTER corridor positioning. The suspended Bloom orb is intentional. Horizontal
footprint reservation also protects lower neighbouring road sections from deep
foundations. Continuous soil fills the former sky slit along road edges.

The shared bank height function drives scenery and 2,244 understory clumps,
754 small mushrooms and 1,126 violet flower sprays. These remain merged into
the seven editable modules; total editor object count stays 229. Warmer sun,
green sky/ground fill and softer distance fog apply only to Vitrum. The pass
uses material/vertex shading, not new real-time shadow maps or dynamic lights.

Saved custom definitions are deliberately not overwritten. Because positions
and static support meshes now belong together, an older saved Vitrum override
must be exported/backed up, then restored to the built-in in the editor to adopt
the new placements. Independently moving a model later does not regenerate its
static footing. Regenerate modules after authoring changes to the source route
or model transforms.

### VITRUM-005 verification and cost

- Six Vitrum tests pass: round-trip and exact embedded source-image bytes,
  topology, three-lap CPU/player simulations, original-model bounds and actual
  mesh rays for both planted feet and 1,200 road stations / five lanes.
- Spatial bins accelerate test raycasts only; the tests still intersect original
  delivered triangles. No runtime collision or physics changes were introduced.
- Isolated Chrome verifies decoded PBR maps, linear/sRGB settings, anisotropy,
  sky reflection readiness, all 227 GLBs, seven sectors, interior views, the
  user's 22%/26%/79% locations, and editor export/save/reload. No page/HTTP errors.
- Production build passes with the existing large-chunk warning. Full suite was
  not repeated; the previously recorded unrelated thruster mismatch remains.
- Seven GLBs total 100,414,404 bytes / 95.8 MiB, versus 30.6 MiB before this pass.
  Whole-frame captures are ~64–215 draws / 0.87–3.36M triangles including
  postprocessing. Physical-device frame time and loading remain unmeasured.
- Evidence: tmp/vitrum-grounded-tests.txt, tmp/vitrum-grounded-browser.txt,
  tmp/vitrum-grounded-build.txt and tmp/vitrum/*.png.

## VITRUM-006 — image scenery and parallax

The forest enclosure uses real, fixed world positions, not a camera-following
shell. Three concentric forest rings sit 280/640/1,040 units beyond the maximum
XZ radius of the current route. Fourteen/sixteen/eighteen overlapping cards
create irregular tree silhouettes, progressively paler with distance and fog.
Twenty-eight root curtains span high crowns at fourteen route locations. The
bank edges hold 428 plant clusters with three crossed planes each (60 degrees).
Whole rectangles are checked against the route, including adjacent bends.

Images were generated with the built-in image tool and copied unchanged into
public/images/stage2/parallax/. Active assets are megaforest-v1.png,
root-curtain-v2.png and undergrowth-v1.png, all 1536x1024 RGBA. The second curtain
was a targeted background-removal edit after inspection found a translucent
matte. The first draft is retained but unused. PROMPTS.md records exact prompts.

Five InstancedMesh batches share one plane geometry and three textures.
Alpha testing with opaque depth writing avoids transparency-sort artifacts;
double-sided cards and Y half-turn mirroring avoid negative instance matrices.
Materials use baked image lighting, color tint and existing fog, with no new
lights or shadow passes. There are 1,360 cards / 2,720 triangles, up to five
additional scene draw calls, and 9,285,951 bytes / 8.86 MiB of loaded PNGs
(roughly 24 MiB RGBA texture storage including mipmaps).

The shared createTrack path adds the layer in both race and editor, including
saved overrides retaining the Vitrum id. No reset of the user's saved work is
needed for this pass. The scene still has 229 authored objects by default; the
new cards are automatic scenery, not individual editor objects. Tune image
paths, ring distances/tints, plant spacing and curtain stations in
src/vitrum-forest-screen.js. Rebuilding the track recomputes placement. Static
organic modules and their supports still have the earlier authoring limitation.

### Verification and limits
- Ten targeted tests pass, covering the original six track/mesh checks plus
  image format, transforms, 1,200-station conservative rectangle clearance,
  different projected parallax, translated route adaptation and disposal.
- Isolated Chrome loads all three images and validates empty curtain-alpha
  samples; all seven driving sectors and additional interior/overview views
  inspected. Editor export/save/reload passes. A synthetic saved 232-object
  override retains its complete exported track and receives the screen.
- No browser page/HTTP errors; production build passes with existing chunk-size
  warning. The unrelated earlier full-suite thruster mismatch was not revisited.
- Captures: 69–219 whole-frame draws / 0.87–3.34M triangles. Alpha overdraw, mobile
  GPU memory and real-device FPS are unmeasured. Distant rings use existing
  camera clipping/fog. Flat cards may be apparent from unusual flyby/editor
  angles; the best illusion is from the racing corridor. No collision added.
- Evidence: tmp/vitrum-screen-{tests,browser,build}.txt, tmp/vitrum/*.png and
  tmp/vitrum/vitrum-saved-override.json. User's real browser storage untouched.

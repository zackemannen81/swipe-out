# Necros - The Conquest Spire

Route foundation revised in NECROS-002, 2026-10-29, following the user's correction.
Open `/?track=track17` or `/editor.html?track=track17`.

## Current layout

88 control points, approximately 9,146 world units. No scenery objects, gaps or
alternative branches. Existing magnetic road, banking, variable widths and pads.

1. Unbroken 800-unit parade launch straight, then a gentle climbing bend.
2. Sweep around the cathedral footprint, turn inward and cross its central nave.
   The exit rises above the outer approach so the roads do not intersect.
3. Climb around the tower footprint at (540, 500), cross its interior between
   revolutions, then continue climbing around it.
4. Cross the summit at height 675 and exit into a sustained near-vertical dive.
5. Smooth pull-out into the low, wide monument section, sharp return to start.

The cathedral and tower are reserved footprints only: walls, ceilings, scenery,
fog and detailed models will be placed later. Old propaganda textures remain in
public/images/necros for later use but are not placed. Music/sky remain placeholders.
No changes to handling, camera, countdown, announcer or cup.

## Editing and saved versions

`src/track-necros.js` owns the built-in definition and named sector anchors.
Everything is ordinary editable/exportable track data. A saved browser override
wins over a changed built-in definition: download any wanted draft first, then
use RESTORE BUILT-IN for track17 to load this revision. User saves are not migrated
or erased automatically. Track17 remains outside the Foundry Cup.

## Verification

110 Node tests pass, including route serialization, sector order, frame validity,
non-adjacent centerline clearance and steep descent. Player-physics traversal at
30/120 Hz and CPU races on Rookie/Pilot/Elite finish three laps without recoveries.
The player check uses neutral steering; this is not a human balance assessment.
Build passes with the existing large-chunk warning. Isolated WebGL verification
checks intro/racing, empty scenery, sector screenshots, live descent to monuments,
editor export and save/reload; no page errors or failed requests.
Human flow/scale testing, final art and physical-phone performance remain.

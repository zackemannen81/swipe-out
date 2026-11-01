# Scene lights and animation (SCENERY-001)

## Editor
- Add POINT LIGHT, position it using the existing XYZ fields or gizmo, choose
  SURFACE COLOR and set LIGHT INTENSITY / LIGHT RANGE. These are actual point
  lights illuminating nearby materials, not just emissive surfaces. Up to 16
  authored lights per track; no shadow maps. Range is in world units. The small
  sphere marks the source in the editor only. Use a separate emissive object
  when a visible lamp is wanted in-game. Scale changes the marker, not range.
- Any primitive or GLB supports MOVEMENT: NONE, SPIN, SHUTTLE, ORBIT.
  CYCLE SECONDS is the period. TRAVEL / RADIUS is world units: shuttle travels
  +/- this distance; orbit radius is this distance. The chosen axis is the
  rotation axis / shuttle direction / orbit normal. Rotation preserves the
  authored Euler orientation; paths use world axes. Orbit starts at the saved
  position with its centre one radius behind the first plane axis. Models do
  not automatically steer into their flight direction.
- GLB: PLAY FIRST GLB ANIMATION loops the first embedded clip; PLAYBACK SPEED
  scales its time. No clip means no skeletal/keyframe movement. Model motion
  still works. Existing GLB file/path import and transforms are unchanged.
- PREVIEW OBJECT MOTION starts playback in the editor. Turn it off to return
  to saved transforms for accurate positioning. Preview is not saved as content.
- Existing texture scrolling and scale pulse remain supported; pulse also
  modulates point-light intensity. Glow/texture/opacity controls describe mesh
  appearance and do not affect the actual point-light source.
- Clone, undo, JSON export and save preserve light/motion/clip settings.
  Version 7 reads versions 1–6; old exports remain usable. Old editors cannot
  import new version 7 exports. Limits and finite numeric values are validated.

## Game
Shared scene animation runs in racing and campaign fly-by; race pause freezes
motion. Scene changes release mixers and GPU assets. Scenery remains decorative
(no moving collision or damage). Authored files in browser storage are not
rewritten by this change.

## Necros palette
Tracks whose names contain Necros use blood-red edge strips, guardrail lights
and shared edge markers instead of cyan/magenta. Main rail emissive intensity
is now 12, scaled by Settings > Neon glow and music pulse (FINISH-001). Alternative-route rails are red too. Other tracks and gameplay pickup
colors keep their existing palette. Renaming a track away from Necros removes
this automatic palette.

## Verification
Five focused tests cover validation/legacy round trips, light parameters,
world-space transforms and reset, red rails, actual embedded GLB clip playback,
looping and mixer disposal. Isolated Chrome checks editor light creation,
movement preview/reset, GLB motion settings, export and save/reload, game
playback and pause. The editor screenshot was inspected. Actual user-authored
Dark PRIME data and physical mobile performance were not inspected.
Full suite 126/127: previously documented Foundry CPU recovery assertion remains
(1 recovery, expected 0). Production build passes, existing chunk warning.

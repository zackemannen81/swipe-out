# Supplied playable Tour stages

Imported 2026-11-10 from `C:/Users/zakri/Desktop/tourbus/stages`.
These are authored previews, not certified finished or balanced circuits.

| Destination | Library key | Source file | Points | Objects |
| --- | --- | --- | ---: | ---: |
| Necros - Dark Prime | track19 | necken.json | 43 | 96 |
| Vitrum Lithofyter · Neural Ascent 5 | track20 | VITRUM LITHOFYTER.json | 32 | 238 |
| The collective - Tellus | track21 | the_collective.json | 66 | 71 |

Nexus selects these entries. Necros uses the existing campaign event;
Vitrum and Collective use open races with the garage loadout. Returning from
an abandoned carrier race restores the hangar. Collective is a persisted world
selection; its observation planet currently uses a purple placeholder material.

Existing built-ins (including track18) and browser saves remain available.
Necros and Collective share the authored ID `synthetic-dreams`; separate library
keys prevent collisions. Saved overrides for the new keys still take precedence.
No new progression or rewards have been invented for Vitrum or Collective.

`node tools/import-tour-stages.mjs [source-directory]` validates v9 exports and
extracts embedded textures/GLBs byte-for-byte into content-addressed public assets.
Geometry, object transforms, materials, pads and authored audio settings remain
unchanged. SHA-256 source and asset hashes are in TOUR_STAGES_MANIFEST.json.
The source Desktop exports are untouched. The compact project JSON files require
the accompanying public assets; they are not self-contained exports.
Necros uses track_014 and its existing Necros backdrop when not authored explicitly.
Record revisions reflect the imported content; old records are retained separately.

Verification is recorded in CURRENT_TASK.md. Full-lap driveability, CPU balance and
physical-device performance still need playtesting, especially the dense Vitrum scene.

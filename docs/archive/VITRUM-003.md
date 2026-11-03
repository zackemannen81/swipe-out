# Current Task
Task ID: VITRUM-003
Status: Complete

## Scope
Use supplied backdrop_track-017.jpg for Vitrum; track15.m4a is default,
track15/16 selectable and persisted from Settings/pause. Preserve reward locks,
saved track geometry and existing working edits. Original files unchanged.

## Acceptance
Build and relevant career/library checks pass. Isolated browser decodes sky and
both audio assets, verifies default and persisted music selection.

## Verification
Production build and 12 career/library tests pass (existing bundle warning).
Isolated Chrome decodes 4096x2048 sky and both stereo M4As (529.18s/289.69s),
plays selected song during racing and preserves Settings/pause choices on reload.
Circuit soundtrack reset works. No page errors; screenshot inspected.

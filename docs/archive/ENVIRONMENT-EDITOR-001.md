# Current Task
Task ID: ENVIRONMENT-EDITOR-001
Status: Complete
## Scope
Add scene-authoring mode to existing editor: separate scene library/JSON, object-only
viewport, room starter, saved camera, lighting and clean preview. Reuse object tools,
GLB/texture import, undo and multi-select. Allow track JSON conversion without roads.
## Acceptance
Scene save/reload/export/import preserves objects, scale and camera. No race track
library writes or racing geometry. Existing track editing still works. Preview exits
cleanly; malformed imports rejected; browser workflow tests and production build.
Not automatic Tour Bus replacement, collisions or arbitrary photo projection.

## Verification
16 focused Node tests pass. Isolated Chrome checks room creation, primitive/GLB
addition, undo/redo, camera capture/preview/Escape, IndexedDB save/reload and JSON
export/import. Race library isolation and ordinary track add/undo pass. No page
exceptions. Production build passes (existing large-chunk advisory). Preview
visually inspected; blockout materials adjusted for readable surfaces.
Guide: docs/ENVIRONMENT_EDITOR.md. User scenes are not installed into Tour Bus yet.

# Current Task

Task ID: EDITOR-006
Status: Complete
Created: 2026-10-28

## Scope

Add object surface and emissive color controls and cyan/pink/lime/amber neon
presets. Reuse existing color/emissive fields; honor them for textured objects.
Preserve defaults, textures, clone/history and saved tracks.

## Definition of done

- [x] Selected objects support custom surface/glow color, glow off and neon presets.
- [x] Editor and game materials honor colors, including textured objects.
- [x] Browser verifies edits, undo/clone/save/reload/export and material values.
- [x] Build and relevant regression checks pass; continuity docs updated.

## Verification

86 Node tests pass; build passes with existing chunk-size warning. Browser checks
all five presets, custom surface color, undo, clone, textured material RGB/emission,
glow off, save/reload, JSON export and default reset. No page errors. Editor
screenshot inspected; race and editor share the tested scenery renderer.

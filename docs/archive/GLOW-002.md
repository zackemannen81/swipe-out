# Current Task
Task ID: GLOW-002
Status: Complete
## Scope
Restore original single central point-light underglow after user rejects four
separate specular spots. Use historical settings from 6d61365:src/craft.js.
Preserve thruster taper and all handling/camera changes.
## Acceptance
Single accent point light, intensity 1.8, range 4, local position (0,-.01,.1).
Production build passes.

## 2026-11-03 - GLOW-002 original single light restored
User screenshot shows four distinct highlights and prefers original one-light
underglow. Restored settings verified in 6d61365:src/craft.js: one accent-colored
PointLight, intensity 1.8, distance 4, position (0,-.01,.1), no shadows. Removes
four-light arrangement; no flat glow plane. Thruster taper/camera/physics retained.
Production build passes (existing chunk warning), tmp/underglow-single-build.txt.
Visual confirmation awaits user. Supersedes GLOW-001 lighting design.
# Current Task

Task ID: IMPLEMENT-008
Status: In Progress
Owner: Agent 008
Created: 2026-10-11
Last updated: 2026-10-11

## Task Summary

Add the user-provided `backdrop_track-001.jpg` as a lightweight panorama cylinder behind the accepted neon racer presentation while preserving bloom, speed trails, beat response, and thrusters.

## Definition of done

- [x] The panorama image is loaded from `public/images/backdrop_track-001.jpg`.
- [x] A large inside-facing cylinder surrounds the track as the backdrop.
- [x] Backdrop depth testing/writing does not occlude track, craft, bloom, or trails.
- [x] Existing music, engine glow, beat intensity, thruster, bloom, and trail behavior remain intact.
- [ ] Production build, syntax, and whitespace checks pass.
- [ ] Visual appearance is interactively confirmed.

## Scope notes

This pass uses the supplied image as a single panorama cylinder. It does not add parallax layers, procedural city geometry, or new audio-analysis behavior. The backdrop is intentionally unlit and fog-independent so it remains a low-cost visual background on mobile/web.

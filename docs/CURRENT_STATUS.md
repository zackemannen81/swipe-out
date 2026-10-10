# Current Status

Last verified: 2026-10-10

## Repository reality

The repository currently contains `AGENTS.md` and seven Markdown documents
under `docs/`. No game source, Three.js setup, package manifest, build/test
configuration, game assets, or audio files were present during this review.
This is a documentation baseline, not a playable or partially implemented game.

## Product direction

The intended product is Swipe-out: a fast-paced mobile 3D anti-gravity racer,
inspired by Wipeout 2097, using Three.js. See `GDD.md` for the detailed design
baseline. The target experience has polished cyberpunk visuals, swipe-based mobile controls, CPU opponents, multiple ships, three distinct levels, high-quality generated assets, and custom techno tracks
in MP3 format. These are product goals, not verified implemented features.

## Next work

Begin implementation with version 0.1, the first playable vertical slice:
- Establish the minimal application and Three.js rendering foundation.
- Build one continuous track and one player craft with automatic movement and
  touch steering.
- Complete and verify the race loop: start, finish detection, elapsed-time
  result, and retry.
- Preserve simple seams between input, rendering, race flow, track data, and
  craft handling so later milestones can extend the same game.

Version 0.5 adds CPU rivals, HUD, placement/results, audio, and polished visual
style. Version 1.0 targets the full GDD: three tracks, multiple distinct craft,
CPU racing, mobile verification, and release checks. Detailed acceptance
criteria are in `GDD.md`. Do not describe planned features as implemented.

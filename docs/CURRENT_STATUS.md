# Current Status

Last verified: 2026-10-10

## Repository reality

A minimal Vite browser app now renders a responsive Three.js 3D prototype
scene. `src/main.js` creates the scene, renderer, lights, platform, and a
static craft-shaped study; `src/style.css` provides the responsive presentation;
`index.html` contains the app shell. `package.json` provides development,
production-build, and preview scripts. No external 3D assets, race controls,
track traversal, race state, finish detection, elapsed-time results, or retry
are implemented. This is Step 1's rendering foundation, not the playable 0.1
vertical slice.

## Product direction

The intended product is Swipe-out: a fast-paced mobile 3D anti-gravity racer,
inspired by Wipeout 2097, using Three.js. See `GDD.md` for the detailed design
baseline. The target experience has polished cyberpunk visuals, swipe-based mobile controls, CPU opponents, multiple ships, three distinct levels, high-quality generated assets, and custom techno tracks
in MP3 format. These are product goals, not verified implemented features.

## Next work

Continue version 0.1 from the minimal rendering foundation:
- Build one continuous, traversable track and one player craft with automatic
  movement and bounded, responsive touch steering.
- Add race start, finish detection, elapsed-time result, and retry so the race
  can be completed repeatedly without reloading the app.
- Verify the complete playable loop, including speed feedback and readable
  track edges; keep input, rendering, race flow, track data, and craft handling
  as simple seams rather than speculative abstractions.

Version 0.5 adds CPU rivals, HUD, placement/results, audio, and polished visual
style. Version 1.0 targets the full GDD: three tracks, multiple distinct craft,
CPU racing, mobile verification, and release checks. Detailed acceptance
criteria are in `GDD.md`. Do not describe planned features as implemented.

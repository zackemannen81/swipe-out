# Current Status

Last verified: 2026-10-10

## Repository reality

The repository implements the first playable version 0.1 race in Vite and Three.js. `index.html` is the start/results/HUD interface. `src/game.js` sets up the WebGL scene, camera follow, pointer/touch/keyboard controls, one-lap race lifecycle, elapsed-time result, and retry. `src/track.js` builds a closed procedural circuit with a surfaced roadway, two readable emissive edges, guide posts, and a marked start/finish gate. `src/craft.js` creates the player craft and engine accents. `src/style.css` provides responsive start/results presentation and HUD.

The player explicitly starts the race; automatic forward travel progresses around the course. Horizontal touch/pointer dragging offsets the craft a bounded amount from the centerline, with smoothed steering and return to center when released. Arrow keys and A/D also steer for desktop testing. Crossing one circuit completes the race, displays elapsed time, and allows retry without reloading. The live display shows the timer, one-lap progress, and automatic speed state.

Verified with `npm run build`, JavaScript syntax checks, Vite HTTP smoke checks, and headless Chrome WebGL 2: desktop race, steering input, finish/result, and repeated retry; mobile Chrome emulation at 390x844 with touch event dispatch, finish, and retry. Responsive layout was checked at 320x568, 390x844, 844x390, and 1440x900. No JavaScript exceptions were observed. No representative physical mobile device was tested; real-device performance, ergonomics, and browser support are unknown. The playable 0.1 implementation is recorded in `docs/archive/IMPLEMENT-002.md`.

## Product direction

The intended product is a fast-paced mobile 3D anti-gravity racer inspired by Wipeout 2097, built with Three.js and original content. See `GDD.md` for staged scope. Version 0.1 is a one-track, one-craft single-player race. CPU rivals, pause/resume, richer presentation, music and effects, multiple tracks/craft, and launch-scale polish are not implemented. Product goals must not be described as implemented features.

## Next work

`docs/CURRENT_TASK.md` tracks IMPLEMENT-003 (Ready): add an accessible pause/resume action that freezes movement, steering, and timer, and resumes the exact same run. The time/lap/speed HUD is already implemented and verified. CPU competition, audio, content expansion, and broad visual polish remain later work.

# System Document

## Product summary

Swipe-out is a fast-paced mobile 3D anti-gravity racing game built with
Three.js. Its design takes inspiration from Wipeout 2097: high-speed futuristic
racing, a strong sense of motion, and a distinctive electronic soundtrack. The
world and presentation should feel cyberpunk and original rather than copying
protected game assets, branding, music, or track designs.

## Product goals

- Deliver responsive, readable racing on mobile devices with swipe-based
  controls suited to touch screens.
- Create a polished 3D presentation with a coherent futuristic cyberpunk art
  direction and high-quality generated visual assets.
- Offer multiple playable ships with meaningfully distinct identities.
- Include CPU-controlled opponents and three distinct race levels.
- Use custom techno music tracks delivered as MP3 audio.
- Balance visual ambition with stable frame rates, fast loading, and practical
  memory use on mobile hardware.

## Intended core experience

The player chooses a ship and level, races at high speed against CPU opponents,
and steers using swipe gestures. The exact race rules, ship handling, progression,
UI, level themes, opponent behavior, and gesture mapping remain to be designed
and validated. Do not treat these open details as settled requirements without
an explicit product decision.

## Release strategy

Deliver the game in gated steps: version 0.1 proves a complete one-track,
one-craft playable race; version 0.5 adds CPU competition, HUD, results, audio,
and cohesive presentation; version 1.0 fulfills the GDD launch scope. The
GDD's milestone section owns the detailed acceptance criteria. Start with a
complete vertical slice and extend its race loop rather than creating separate
visual demonstrations. Keep input, rendering, and race flow understandable,
and make track and craft tuning extendable without introducing abstractions
that are not yet needed. These are implementation goals, not verified
architecture or behavior.

## Technical direction and constraints

- Three.js is the intended 3D rendering foundation; no specific application
  framework, renderer configuration, physics engine, or build system is yet
  established.
- Treat mobile touch input, variable device performance, asset download size,
  memory, and audio playback behavior as first-class design constraints.
- Generated assets and custom music must be reviewed for quality, consistency,
  performance, and rights to use. Optimize assets for delivery and runtime.
- Prefer original visual, audio, and level content. Wipeout 2097 is an
  inspiration/reference, not a source of assets or a requirement to reproduce
  its protected expression.

## Documentation truth boundary

This document records the intended product direction, not existing software
behavior. See `GDD.md` for the detailed game design and `CURRENT_STATUS.md` for
verified repository reality. Record confirmed durable architecture and behavior
here as implementation matures; keep unresolved design choices explicitly open.

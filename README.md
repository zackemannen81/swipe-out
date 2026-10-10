# Swipe-out — rendering prototype

## Requirements

- Node.js 20.19+ (or 22.12+)
- npm
- A modern browser with WebGL support

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Create an optimized production bundle with
`npm run build`; serve that bundle locally with `npm run preview`.

## Scope

This is Step 1 of the version 0.1 plan: a minimal Vite application and a
responsive Three.js rendering foundation. The scene contains a static,
unpiloted craft-shaped study and a simple neon-lit presentation stage. It is
not a playable race. Touch steering, track traversal, race flow, finish
recognition, elapsed-time results, and retry have not been implemented.

The app entry and scene are in `src/main.js`; presentation is in
`src/style.css`. No external 3D assets or game framework are required.

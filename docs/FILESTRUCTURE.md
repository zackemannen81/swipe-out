# File Structure

Verified 2026-10-10 after IMPLEMENT-001. The project now includes a minimal
Vite and Three.js rendering prototype; race gameplay and external assets do
not exist yet.

- `AGENTS.md` — repository instructions and docs-first entry point
- `README.md` — runtime requirements, local commands, and prototype scope
- `package.json` / `package-lock.json` — npm scripts and pinned dependency graph
- `.gitignore` — generated and local-only files excluded from version control
- `index.html` — browser app shell and module entry
- `src/main.js` — Three.js scene, lighting, prototype geometry, renderer, resize, and render loop
- `src/style.css` — responsive prototype presentation
- `docs/CURRENT_TASK.md` — active task, definition of done, and verification
- `docs/TASK_WORKFLOW.md` — task lifecycle and continuity rules
- `docs/CURRENT_STATUS.md` — verified repository reality and implementation gaps
- `docs/SYSTEMDOC.md` — durable product direction and technical constraints
- `docs/GDD.md` — detailed game design goals, proposed experience, scope, and open decisions
- `docs/JOURNAL.md` — dated record of completed work waves
- `docs/FILESTRUCTURE.md` — this factual repository map

Update this map when files or directories are added, removed, or reorganized.
Do not list planned paths as if they already exist.

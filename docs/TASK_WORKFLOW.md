# Task Workflow

Task states: `Draft -> Ready -> In Progress -> Complete`.

`docs/CURRENT_TASK.md` is the single active-task record. Before implementation,
write a scoped task with a measurable definition of done. Move it to Ready only
when scope and acceptance conditions are clear; use In Progress while work is
underway and Complete only after the conditions have been verified.

For each meaningful work wave:

1. Read `AGENTS.md`, then this workflow, the current task, status, system doc,
   GDD, journal, and file structure as applicable to the change.
2. Inspect the owning implementation and relevant project evidence before
   changing code or describing behavior as implemented.
3. Keep task scope and verification in `CURRENT_TASK.md`; keep observed repository
   reality in `CURRENT_STATUS.md`; keep durable high-level product/system
   direction in `SYSTEMDOC.md`; keep detailed gameplay design and proposals in
   `GDD.md`; append a dated entry to `JOURNAL.md`.
4. Update `FILESTRUCTURE.md` when the repository layout changes. Keep it factual.
5. Run appropriate verification and report results accurately. Mark a task
   Complete only when its definition of done is satisfied; document blockers or
   unknowns rather than filling them with assumptions.

Product goals in `SYSTEMDOC.md` describe intended behavior, not proof of
implementation. `CURRENT_STATUS.md` is the source for what exists now.

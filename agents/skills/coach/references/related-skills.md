# Related Skills

The `coach` skill and the `todoist` skill work together. **Read both** when a session touches
tasks: coach for the routine / calendar / notes frame, the `todoist` skill for the actual task
triage and scheduling.

## Division of labor
- **The `todoist` skill is canonical for Todoist task triage + scheduling**
  (`~/.dotfiles/agents/skills/todoist/`). It owns: GTD clarify → disposition, filing to the right
  project (especially the **P1/P2** priority projects), `@Quick/Easy` vs **p1–p4**, duplicate
  detection (auto-complete obvious / offer probable), specific next actions, projects-for-multi-step,
  and the **scheduling/capacity pass** (zero overdue, ≤10 tasks/day, ≤5 non-quick). When a coach
  routine reviews or schedules Todoist tasks, run that skill's process — don't re-derive task rules here.
- **coach is canonical for** Obsidian note filing into PARA (`references/inbox-processing.md`), the
  daily/weekly **calendar** shape (the Scheduling Rules section — wake, gym, deep-work blocks), the
  daily startup/shutdown + weekly review routines, and coaching style + memory.

## When to switch
- Reviewing / triaging / scheduling Todoist items (daily startup, weekly review, "process my tasks")
  → load the `todoist` skill and run its triage + schedule process.
- Filing a captured idea into the vault → coach `inbox-processing.md` (PARA, frontmatter, person notes).
- Shaping the day's calendar around fixed commitments → coach Scheduling Rules.

Keep one source of truth: if a *task* rule needs changing, change it in the `todoist` skill, not here.

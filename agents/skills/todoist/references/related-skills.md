# Related Skills

The `todoist` skill and the `coach` skill work together. **Read both** when the work spans tasks
and the broader day: this skill for task triage + scheduling, coach for routines / calendar / notes.

## Division of labor
- **This skill is canonical for Todoist task triage + scheduling** (dispositions, filing to the
  right project incl. P1/P2, `@Quick/Easy` vs p1–p4, duplicate detection, specific next actions,
  projects-for-multi-step, the no-overdue / ≤10-per-day / ≤5-non-quick scheduling pass).
- **`coach` is canonical for** (`~/.dotfiles/agents/skills/coach/`): Obsidian note filing into PARA
  (its `references/inbox-processing.md`), the daily/weekly **calendar** shape (its Scheduling Rules),
  the daily startup / shutdown / weekly review routines, and coaching style + memory.

## When to switch
- A triaged item should become a vault note (reference/seed) → hand the filing to coach
  `inbox-processing.md` (PARA rules, frontmatter, person notes) rather than inventing note rules here.
- Placing tasks into the day around fixed commitments / deep-work blocks → coach Scheduling Rules
  own the calendar shape; this skill owns *which* tasks, their priority, and that none stay overdue.
- Invoked from a coach routine (daily startup / weekly review) → run this skill's triage + schedule pass.

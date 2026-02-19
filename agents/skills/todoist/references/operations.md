# Todoist Operations (Reference)

All operations use the official `td` CLI (`@doist/todoist-cli`).

**CRITICAL**: Do NOT create tasks proactively without user request.

## Core Rules

### Process ALL Tasks at Once

When user asks to "process my tasks" or "help with my todoist":
1. Fetch ALL tasks (`td today --json`, paginate with `--all` if needed)
2. Present ALL tasks with IDs
3. Get user instructions for ALL tasks in one interaction
4. Process ALL tasks based on those instructions
5. Do NOT stop after processing a subset

### Always Read Comments Before Processing

```bash
td comment list id:<task_id>
```

Comments contain critical context — links, images, detailed notes.

### Task Assignment Filtering

When a task has an assignee that isn't Michael, it's already delegated. Don't suggest "hiding" or "reassigning".

## CLI Reference

### Output Formats

- `--json` — JSON output (use for programmatic processing)
- `--ndjson` — Newline-delimited JSON (streaming)
- `--full` — All fields in human-readable format
- Default — Compact human-readable

### Tasks

```bash
# List / filter
td today                              # Due today + overdue
td today --json                       # JSON output
td inbox                              # Inbox tasks
td upcoming 7                         # Next 7 days
td task list --project "Work"         # By project
td task list --label "review"         # By label
td task list --priority 4             # By priority (4=P1)
td task list --filter "overdue"       # Custom filter

# View details
td task view id:<id>                  # Full task details
td task view id:<id> --json           # JSON

# Create
td add "Buy milk tomorrow #Shopping"  # Quick add (natural language)
td task add --content "Title" --project "Inbox" --due "tomorrow" --priority 3

# Update
td task update id:<id> --content "New title"
td task update id:<id> --due "next monday"
td task update id:<id> --due "no date"        # Remove due date
td task update id:<id> --priority 4           # Set P1
td task update id:<id> --labels "review,urgent"

# Complete / reopen
td task complete id:<id>
td task uncomplete id:<id>

# Move
td task move id:<id> --project "Ideas Backlog"
td task move id:<id> --section "In Progress"

# Delete
td task delete id:<id>

# Open in browser
td task browse id:<id>
```

### Comments

```bash
td comment list id:<task_id>                         # List comments on task
td comment add id:<task_id> --content "cc: Note"     # Add comment
td comment update <comment_id> --content "Updated"   # Edit
td comment delete <comment_id>                       # Delete
```

### Projects

```bash
td project list --json
td project view "Everything AI Backlog"
td project create --name "New Project"
td project archive "Old Project"
td project delete "Empty Project"
td project collaborators "Shared Project"
```

### Sections, Labels, Filters

```bash
td section list "Project Name"
td section create --name "Backlog" --project "Work"

td label list --json
td label create --name "review"

td filter list --json
td filter create --name "My Filter" --query "p1 & today"
```

### Completed Tasks & Activity

```bash
td completed                          # Today's completions
td completed --since 2026-01-01       # Since date
td completed --project "Work" --json  # Filtered
td stats                              # Productivity stats
td activity                           # Recent activity log
```

### Pagination

Use `--all` to fetch everything, or `--cursor` + `--limit 50` for manual pagination.

### Reference Resolution

`<ref>` accepts:
- Task/project names (partial match)
- `id:xxx` format (exact)
- Todoist URLs

## Priority Levels

- `4` = P1 (red, highest)
- `3` = P2 (orange)
- `2` = P3 (yellow)
- `1` = P4 (white, default)

## Known Project IDs

**PARA Structure:**
- 1-Projects: `2359994569`
- 2-Areas: `2359994572`
- 3-Resources: `2359995015`

**Active Projects:**
- Inbox: `377445380`
- Daily Briefing: `6cvj7XgXH4w93WgX`
- Ideas Backlog: `2263875911`
- Everything AI Backlog: `2352252927`
- Admin: `2331010777`

**User IDs:**
- Michael: `486423`
- Michelle (assistant): `42258732`

## GTD Workflow (Ship to Beach Alignment)

### Core Principles

1. **Default No** — Only yes to highest-leverage moves toward the goal
2. **Finishing Over Starting** — 80% complete = $0; 100% = $X. Prioritize final 20%
3. **5-7 Tasks Per Day Maximum** — If overloaded, triage to future dates or remove dates

### Task Categories

| Category | Action |
|----------|--------|
| Sprint Work (clear "done" state) | Keep due date, prioritize |
| Wisdom/Philosophy | Remove date, keep in backlog |
| Ideas & Experiments | Move to Ideas project, remove date |
| Delegated (has assignee) | Verify assignment, skip |
| Vague/Unclear | Clarify or delete |
| Admin/Drudgery | Batch, delegate, or delete |

### Content Destinations

- **Articles/References** -> Clip to `3-Resources/Articles/` in Obsidian
- **Ideas** -> `3-Resources/Raw Ideas/` with full context
- **Journal/Reflections** -> `2-Areas/Journal/`
- **Grouped tasks** -> Create Obsidian project + Todoist project

### Processing Output Format

```text
| # | Task | Due | Action | Project | Reasoning | Conf |
|---|------|-----|--------|---------|-----------|------|
| 1 | Ship snapshot | Oct 3 | Keep | Current | Sprint work, final 20% | 95% |
| 2 | Read philosophy | Oct 3 | Remove date | Inbox | Timeless | 90% |
```

**Confidence:**
- 90%+ = Execute without asking
- 70-90% = Show for quick review
- <70% = Ask for guidance

### Collaboration Protocol

1. ALWAYS read comments before categorizing
2. Check for attachments (images may have empty content)
3. Propose categories for each batch
4. Get user confirmation before executing
5. Add Todoist URL to Obsidian notes: `todoist:` field in frontmatter
6. Comment on tasks with destination links before completing

**Todoist URL Format**: `https://app.todoist.com/app/task/{task_id}`

## Comment Convention

Always prefix automated comments with `cc:` to distinguish from human comments:

```bash
td comment add id:<id> --content "cc: Moved to Raw Ideas project"   # Correct
td comment add id:<id> --content "Moved to Raw Ideas project"       # Wrong
```

## Task Display Requirements

When showing tasks to the user, ALWAYS include:
- **Labels with emojis** (e.g., 🎯 Everything AI, ⚠️ Decision, ✅ Approval, 📨 Awaiting)
- **Comment count** if available (e.g., 💬 3 comments)
- **For Decision/Approval labels**: Suggest reassigning to task creator
- **Format in table**: Use nice tables for readability

## Default Task Filtering

- Use `td today --json` for today + overdue (matches Todoist UI)
- **DEFAULT: Filter to tasks for me** — exclude tasks assigned to others unless explicitly requested
- When using `--json`, filter by `responsible_uid == null OR responsible_uid == "486423"`

## Notes Repo Scripts & Templates

When working in `~/ws/notes`:
- **Bulk Operations:** `5-Tools/Todoist/scripts/`
- **Processing Templates:** `5-Tools/Todoist/templates/`
- **API Reference:** `5-Tools/Todoist/TODOIST_LEARNINGS.md`

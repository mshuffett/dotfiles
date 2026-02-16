# Inbox Processing Workflow (GTD-PARA Method)

Reference for the coach skill. Loaded when processing inbox items.

## Core Principle

**Optimize for being an effective assistant** — Learn user's patterns, preferences, and working style through each session. When patterns become clear, document them in `.claude/rules/coach-patterns.md`. The goal is not just organizing content, but understanding how to best support the user's workflow.

## Pre-Processing Requirements

1. **ALWAYS check existing Areas structure first** (`ls 2-Areas/`)
2. **Verify PARA locations exist** before suggesting moves
3. **Keep PARA structure flat** — avoid creating nested subdirectories
4. **Build confidence through iteration** — start at 30-40% confidence until patterns confirmed
5. **Provide selection codes** for easy choices (e.g., [1a], [2b], [3c])

## Processing Algorithm

1. **CLARIFY** — What is this item?
   - Is it actionable? → Determine next action
   - Is it reference? → Find appropriate PARA location
   - Is it neither? → Consider archiving/deleting

2. **CONFIDENCE SCORING**
   - **30-40%**: First pass, no prior approvals
   - **60-70%**: Similar items approved before
   - **85-90%**: Clear pattern established with multiple approvals
   - **Only act at 90%+ confidence**

3. **DESTINATION RULES**
   - **EXISTING locations preferred** (clearly mark as "existing")
   - **NEW locations avoided** unless necessary (mark as "new - needs creation")
   - **Common Areas to check:**
     - `Everything Backlog/` — Product ideas, features, improvements
     - `Strategy/` — Strategic planning, vision documents
     - `Finances/` — Financial planning, budgets
     - `Journal/` — Personal reflections, thoughts
     - `Hiring/` — Recruitment related
     - `System/` — Workflows, processes, tools

4. **ACTION IDENTIFICATION**
   - **Identify and list potential actions** from the note
   - **Present them as suggestions** but don't automatically add to Todoist
   - **Only add to Todoist if user explicitly requests** it
   - Include deadlines/dates when relevant

5. **NOTE ENHANCEMENT** (when moving to PARA)
   - **ALWAYS add frontmatter** with tags and a 2-3 sentence summary
   - **Check existing folders first** before suggesting new ones
   - **Process tasks in parallel** — use multiple tool calls simultaneously
   - **Improve titles** for clarity and searchability (use emojis for visual scanning)
   - **Check for references** when renaming — grep for old filename and update links
   - **Link related notes** when obvious connections exist
   - **People-related content**: ALWAYS create person note in `2-Areas/People/` for any individual mentioned (even brief interactions)
   - **Active/important notes**: Consider how to maintain visibility after move
   - **Create/Update MOCs** during processing (not later):
     - Prompts & Systems → Update Prompts MOC immediately
     - Protocols & Workflows → Update Systems MOC immediately
     - Strategic documents → Update Strategy MOC immediately

## Presentation Rules

- **Provide ALL information needed** for user to make decision efficiently
- **Include a clear 2-3 sentence summary** of what the file contains
- **Use clear formatting** — options with [codes] | description | confidence%
- **Never require user to open files** to understand the choice
- **ALWAYS check creation/modification dates** — old content likely needs archiving
- **Process in larger batches** — 10 files at a time for efficiency
- **Process in reverse chronological order** — newest files first by creation date

## Content Categories

### 1-Projects/
- **Definition:** Active efforts with specific outcomes and deadlines
- **Test:** Has a clear "done" state and active work happening now

### 2-Areas/
- **Strategy/** — ONLY current strategic frameworks, active pitch decks, vision documents in use (NOT a catch-all; old strategy docs → Archive; investor-specific → Potential Investors/)
- **Potential Investors/** — Investor wishlists, target lists, investor research
- **Everything Backlog/** — Features/ideas SPECIFICALLY for the Everything AI platform only
- **Ideas/** — General ideas not yet projects (personal apps, experiments, non-platform ideas)
- **People/** — One note per person (always create, even for brief interactions)
- **Executive Eve/** — Everything related to the EE business
- **System/** — Personal workflows, tools, productivity systems, Obsidian config
- **Journal/** — Personal reflections, dreams, protocols, transformations
- **Finances/** — Financial planning, utility curves, investment strategy
- **Wellness/** — Health protocols, conscious use guidelines
- **Hiring/** — Recruitment, hiring processes, candidate tracking

### 3-Resources/
- **Definition:** Reference materials, templates, guides — not actively maintained
- **Test:** "How to" content, templates, reference docs you return to

### 4-Archives/
- **Definition:** Completed, outdated, or inactive items
- **Test:** No longer relevant for current work or future reference

## Learning Rule

**IMMEDIATELY update `.claude/rules/coach-patterns.md` when corrected** — Every correction is a learning opportunity. When user points out a pattern or preference, update the patterns file RIGHT AWAY before continuing.

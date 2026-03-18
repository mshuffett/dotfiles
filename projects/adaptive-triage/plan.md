# Adaptive Triage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Claude Code skill that triages Todoist items via scan-and-correct UX, with preference learning from corrections over time.

**Architecture:** A single SKILL.md with progressive-disclosure references. The skill orchestrates enrichment (td CLI + vault scan), classification (rules + heuristics), table presentation, correction parsing, execution (td commands + Obsidian notes), session logging (JSONL), and rule proposal. Data persists in `projects/adaptive-triage/`.

**Tech Stack:** Claude Code skill (SKILL.md), `td` CLI (@doist/todoist-cli), Obsidian vault (~/ws/notes/), JSONL session logs, YAML-in-markdown rules.

**Spec:** `projects/adaptive-triage/design.md`

---

## File Structure

```
agents/skills/adaptive-triage/
├── SKILL.md                          # Main skill (create)
└── references/
    ├── note-templates.md             # Obsidian note templates (create, ported from inbox-triage)
    └── base-heuristics.md            # Cold-start classification rules (create, ported from inbox-triage)

projects/adaptive-triage/
├── design.md                         # Already exists
├── process-log.md                    # Already exists
├── learned-rules.md                  # Initial empty rules file (create)
└── triage-sessions/
    └── .gitkeep                      # Empty dir placeholder (create)
```

Also modify:
- `agents/skills/inbox-triage/SKILL.md` — Update description to redirect to adaptive-triage

---

### Task 1: Create data directory and initial rules file

**Files:**
- Create: `projects/adaptive-triage/triage-sessions/.gitkeep`
- Create: `projects/adaptive-triage/learned-rules.md`

- [ ] **Step 1: Create triage-sessions directory**

```bash
mkdir -p ~/.dotfiles/projects/adaptive-triage/triage-sessions
touch ~/.dotfiles/projects/adaptive-triage/triage-sessions/.gitkeep
```

- [ ] **Step 2: Create empty learned-rules.md**

Write to `projects/adaptive-triage/learned-rules.md`:

```markdown
# Learned Rules

Rules are proposed at the end of triage sessions based on correction patterns.
Confidence levels: low (1 example), medium (2-3 examples), high (4+ examples).

```yaml
rules: []
```
```

- [ ] **Step 3: Commit**

```bash
git add projects/adaptive-triage/triage-sessions/.gitkeep projects/adaptive-triage/learned-rules.md
git commit -m "chore: create adaptive triage data directory and empty rules file"
```

---

### Task 2: Create reference files

Port relevant content from inbox-triage into adaptive-triage's reference structure.

**Files:**
- Create: `agents/skills/adaptive-triage/references/note-templates.md`
- Create: `agents/skills/adaptive-triage/references/base-heuristics.md`

- [ ] **Step 1: Create note-templates.md**

Write to `agents/skills/adaptive-triage/references/note-templates.md`. This is the Obsidian note template used by the Executor. Ported from `inbox-triage/references/examples.md` with adjustments for the adaptive-triage context:

```markdown
# Note Templates

## Obsidian Reference Note

```markdown
---
tags: [<topic-tags>]
created: {{date}}
source: adaptive-triage
related: [[related notes]]
---

# [Descriptive Title]

## Summary
[2-4 sentences: what this is and why it matters]

## Key Details
[The substance — what you'd want to remember in 6 months]

## Source
[Preserve ALL original text verbatim — title + description + comments are one unit.
Do not summarize or excerpt the user's raw thinking.]

- Todoist item: "[original inbox text]"
- Description: "[full description if any]"
- Links: [any URLs from the item]

## Connections
- Related to: [[other notes or areas]]
```

**Filing locations** (match against vault structure loaded in enrichment):
- `3-Resources/[Topic Area]/[Note Name]` — tools, evaluations, general reference
- `2-Areas/[Area Name]/[Note Name]` — ongoing areas of responsibility
- `3-Resources/Project Seeds/[Note Name]` — ideas not yet actionable

**When filing is ambiguous**: Present existing matching areas AND "create new area"
as options. Don't force-fit into existing taxonomy. Always add cross-links to
related areas even if the note doesn't live inside them.

**GitHub repos**: One sentence on what it does + stars/maintenance status. No
README summaries, feature lists, or architecture deep-dives.
```

- [ ] **Step 2: Create base-heuristics.md**

Write to `agents/skills/adaptive-triage/references/base-heuristics.md`. These are the cold-start classification rules used when no learned rules exist. Ported from inbox-triage's classification logic:

```markdown
# Base Classification Heuristics

These rules are the cold-start baseline. They apply when no learned rules exist
or when learned rules don't cover an item. As the system accumulates corrections,
learned rules take precedence over these heuristics.

## Category Detection

### Action
- Imperative verb + specific target/person, no hedging
- Has deadline or time-sensitivity
- Names a specific person to communicate WITH ("tell X", "send X", "follow up with X")
- Clear deliverable ("create", "review", "submit", "cancel", "schedule")

### Quick
- Under 5 minutes to complete
- Simple administrative task
- Single decision or approval
- Contains "APPROVE" prefix

### Reference
- Information worth keeping, not actionable now
- Tool/tech evaluations, articles, resources
- Feedback FROM someone (not action — user decides what to do)
- Philosophical reflections, observations, strategic thinking

### Seed
- Creative concept or product idea
- "What if we..." / "Imagine..." / brainstorming language
- Understood but not actionable yet — needs incubation

### Clarify
- Genuinely ambiguous — can't determine domain or intent
- Missing context that changes the classification
- Multiple valid interpretations with different outcomes

### Delete
- Over 30 days old AND vague
- Duplicate of another item
- Superseded by other work
- Was never actionable

## Voice Capture Detection

Voice captures are the #1 source of misclassification. Key signals:

**Brainstorming (→ Reference or Seed, NOT Action):**
- Modal verbs: could, might, would, should (tentative)
- Deliberation: "Let me think...", "either...or", "I'm thinking about"
- Observation: "is a pretty good...", "I guess...", "I wonder if"
- Hedging: "maybe", "possibly", "not sure but"

**Real action (→ Action):**
- Imperative + specific person: "tell Chen-Chen about X"
- Imperative + specific target: "cancel my subscription to X"
- Explicit commitment: "make sure X is enabled", "send the contract"

When in doubt between Action and Reference, choose Reference. A missed action
is easy to catch in review; a brainstorm filed as a task clutters the system.

## Project Assignment

Priority order:
1. Person-based: if item involves communicating WITH a known person, use that
   person's project association (stronger than keywords)
2. Keyword-based: match against active project domains
3. Default: Everything AI for technical content

Note: feedback FROM a person doesn't trigger person-based assignment.
The person-project associations come from learned rules, not this file.
```

- [ ] **Step 3: Commit**

```bash
git add agents/skills/adaptive-triage/references/
git commit -m "docs: add reference files for adaptive triage (note templates + base heuristics)"
```

---

### Task 3: Write the SKILL.md

This is the core deliverable. The skill prompt orchestrates the entire triage flow.

**Files:**
- Create: `agents/skills/adaptive-triage/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Write to `agents/skills/adaptive-triage/SKILL.md`:

```markdown
---
name: adaptive-triage
description: Interactive Todoist triage with preference learning. Use when the user says "triage", "process my inbox", "clean up tasks", "triage my todoist", "file these captures", or mentions inbox zero. Also use when the user has a batch of raw items (voice notes, links, ideas) that need classifying and routing to Todoist projects or Obsidian. This skill replaces inbox-triage with an interactive confirm/correct loop that learns over time.
---

# Adaptive Triage

Interactive triage that learns your preferences. You present classified items in a
table, the user confirms or corrects, you execute and log everything. Corrections
become rules that improve future sessions.

## Step 0: Enrich

Gather full context before classifying anything.

1. **Fetch items** — run these commands and collect the output:
   - `td inbox` — all inbox items
   - `td today` — today + overdue items
   - Deduplicate items appearing in both (match by task ID)

2. **Fetch comments** for EVERY item (not just ambiguous ones):
   - `td comment list id:<task_id>` for each item
   - Comments often contain critical context — links, descriptions, attachments

3. **Load vault structure**:
   - `ls ~/ws/notes/1-Projects/ ~/ws/notes/2-Areas/ ~/ws/notes/3-Resources/`
   - This gives filing context for the entire session

4. **Load learned rules** from `~/.dotfiles/projects/adaptive-triage/learned-rules.md`

5. **Load recent corrections** from the last 3 session files in
   `~/.dotfiles/projects/adaptive-triage/triage-sessions/` (if any exist).
   These serve as few-shot examples.

If there are 0 total items, say "Nothing to triage! Inbox zero." and stop.

## Step 1: Classify

For each enriched item, produce a recommendation:
- **Category**: Action | Quick | Reference | Seed | Clarify | Delete
- **Destination**: Todoist project name, Obsidian vault path, or null for Clarify
- **Reasoning**: Brief explanation of why
- **Confidence**: 0-100

Use these inputs in priority order:
1. **Learned rules** (from learned-rules.md) — high-confidence rules override heuristics
2. **Few-shot examples** (from recent session corrections) — match similar items
3. **Base heuristics** — read [references/base-heuristics.md](references/base-heuristics.md) for
   the cold-start classification logic

Also check for stale rules: if any learned rule references a project name, verify
it exists via `td project list`. If a project no longer exists, note it in the
presentation and suggest disabling the rule.

## Step 2: Present

Show all items in a grouped table. Items that need the most attention go first.

```
📥 Triage: <N> items (<X> inbox, <Y> today, <Z> overdue)

── NEEDS YOUR INPUT ──────────────────────────────────────────────────
#   Item                              → Category    Destination
<items with Clarify category or confidence < 50%>

── REVIEW THESE ──────────────────────────────────────────────────────
<items with confidence 50-80%>

── LOOKS GOOD ────────────────────────────────────────────────────────
<items with confidence > 80%>

[a]ccept all  |  correct: "3: Action, Demo Day"  |  [s]kip session
```

Truncate long item text with ellipsis. Show the full item text and enrichment
(comments, description) for items in the NEEDS YOUR INPUT section.

If any stale rules were detected, show a warning before the table:
```
⚠ Rule <id> references project "<name>" which no longer exists.
  Disable? [y/n]
```

## Step 3: Collect Corrections

Wait for the user's input. Parse it according to this grammar:

- `a` — accept all, proceed to execution
- `s` — skip/abort session, do nothing
- Corrections separated by semicolons:
  - `<#>: <category>, <destination>` — change both
  - `<#>: <category>` — change category only, keep AI destination
  - `<#>: , <destination>` — change destination only, keep AI category
  - `<#>: delete` — mark for deletion
  - `<#>: skip` — leave in inbox for next session

Examples:
- `3: Action, Demo Day; 8: delete; 11: Reference, Orchestration`
- `a` (everything looks good)

After parsing, confirm back: "Applying N decisions (X corrected, Y confirmed)..."

If the user types something that doesn't parse as corrections, ask for
clarification — don't guess.

## Step 4: Execute

For each confirmed/corrected item, execute the appropriate action:

**Action items:**
- `td task move id:<id> --project "<Project Name>"`
- If the item should also have a due date mentioned in context, note it

**Quick items:**
- Present the item for the user to handle now
- After they handle it: `td task complete id:<id>`

**Reference / Seed items:**
- Write an Obsidian note using the template in [references/note-templates.md](references/note-templates.md)
- Write to `~/ws/notes/<destination-path>/<slugified-title>.md`
- After writing the note: `td task complete id:<id>`

**Delete items:**
- `td task delete id:<id>`

**Clarify items (that the user resolved with a correction):**
- Execute based on the corrected category

**Clarify items (still unresolved):**
- `td comment add id:<id> --content "cc: Needs clarification — <what context is missing>"`
- Leave in inbox

**Skip items:**
- Do nothing, leave in inbox

Report each action as it executes:
```
✓ Moved "cancel whispr" → completed
✓ Moved "tell chen-chen about the space" → Demo Day
✓ Created note: 2-Areas/Strategy/high-agency-principle.md
✗ Failed: <error message if any>
```

## Step 5: Log Session

Write a JSONL file to `~/.dotfiles/projects/adaptive-triage/triage-sessions/YYYY-MM-DD.jsonl`

Each line is one item decision:
```json
{
  "session_id": "<ISO timestamp>",
  "item": {
    "id": "<todoist-id>",
    "text": "<item text>",
    "description": "<description or null>",
    "comments": ["<comment text>"],
    "project": "<source project>",
    "created": "<created date>",
    "due": "<due date or null>"
  },
  "ai_recommendation": {
    "category": "<category>",
    "destination": "<destination>",
    "confidence": <0-100>,
    "reasoning": "<brief reasoning>",
    "rules_applied": ["<rule-ids>"]
  },
  "decision": {
    "category": "<category>",
    "destination": "<destination>",
    "was_correction": <true|false>,
    "correction_reasoning": "<user's reasoning if corrected, null otherwise>"
  },
  "executed": <true|false>,
  "execution_result": "<what happened>"
}
```

If the file already exists for today (multiple sessions), append to it.

## Step 6: Propose Rules (if corrections exist)

If there were corrections in this session:

1. Analyze the corrections — look for patterns (same type of mistake repeated,
   systematic misclassification of a category)

2. Check existing rules — does any correction match or extend an existing rule?
   If so, propose bumping its confidence and adding the new example.

3. Propose new rules for genuinely new patterns:

```
Session complete: <N> items, <X> corrections.

Patterns I noticed:
  1. <Description of pattern>
     Evidence: "<item text>" corrected from <old> → <new>
     Proposed rule confidence: <low|medium|high>

Add these as rules? [y]es / [e]dit / [n]o
```

4. If confirmed, append to `~/.dotfiles/projects/adaptive-triage/learned-rules.md`:

```yaml
  - id: rule-<NNN>
    rule: "<Natural language rule>"
    examples:
      - "<item text>" (<date>)
    confidence: low
    added: <date>
    last_confirmed: <date>
```

If there were 0 corrections, skip rule proposal entirely:
"Perfect session — <N>/<N> confirmed. Session logged."

## Regression Check (Session Start)

Before Step 0, if session logs exist with corrections:

1. Load the last 20 corrections from session files
2. Re-classify those items using current rules
3. If any item would now be classified differently than the user's decision,
   warn before proceeding:

```
⚠ <N> recent corrections would now be classified differently:
  - "<item>": you chose <X>, now classifying as <Y>
    (caused by <rule-id>)

Review rules before we start? [y/n]
```

If the user says yes, show the relevant rules and let them edit/disable.
If no, proceed with current rules.

## Important Reminders

- **Comments are mandatory enrichment.** Check `td comment list` on EVERY item
  before classifying. This is the #1 source of missing context.
- **Preserve raw text.** When creating Obsidian notes, include the full original
  item text + description + comments. Don't summarize the user's own words.
- **Voice captures default to Reference/Seed.** Only classify as Action when
  there's an imperative verb + specific person/target. Modal verbs = brainstorming.
- **Don't guess when uncertain.** Use Clarify and let the user provide context.
  A wrong-but-confident classification is worse than asking.
- **Log everything.** Every item, every decision, every correction. The logs
  ARE the training data.
```

- [ ] **Step 2: Verify skill file is under 500 lines**

```bash
wc -l agents/skills/adaptive-triage/SKILL.md
```

Expected: under 500 lines (the skill-creator recommends <500 for the body).

- [ ] **Step 3: Commit**

```bash
git add agents/skills/adaptive-triage/SKILL.md
git commit -m "feat: create adaptive-triage skill with interactive confirm/correct UX"
```

---

### Task 4: Retire inbox-triage skill

Update the old skill's description to redirect users to the new one.

**Files:**
- Modify: `agents/skills/inbox-triage/SKILL.md:1-3` (frontmatter only)

- [ ] **Step 1: Update inbox-triage description**

Change the frontmatter description in `agents/skills/inbox-triage/SKILL.md` to:

```yaml
---
name: inbox-triage
description: DEPRECATED — use adaptive-triage instead. This skill has been replaced by adaptive-triage which provides interactive confirm/correct triage with preference learning. Invoke adaptive-triage for any triage, inbox processing, or item classification tasks.
---
```

Keep the rest of the file intact (it serves as reference for the new skill's heuristics).

- [ ] **Step 2: Commit**

```bash
git add agents/skills/inbox-triage/SKILL.md
git commit -m "chore: deprecate inbox-triage in favor of adaptive-triage"
```

---

### Task 5: Smoke test with real data

Run the skill once to verify the end-to-end flow works.

**Files:** None created — this is a verification task.

- [ ] **Step 1: Run the skill**

In Claude Code, type `/triage` or "triage my todoist". Verify:

1. Enricher fetches inbox + today items
2. Comments are fetched for each item
3. Vault structure is loaded
4. Items are classified and presented in the grouped table
5. The correction grammar works (try correcting one item)
6. Executor runs td commands and writes Obsidian notes
7. Session JSONL is written to `projects/adaptive-triage/triage-sessions/`
8. Rule proposer runs if there were corrections

- [ ] **Step 2: Verify session log**

```bash
cat ~/.dotfiles/projects/adaptive-triage/triage-sessions/$(date +%Y-%m-%d).jsonl | head -5
```

Verify: valid JSONL, contains item data, ai_recommendation, and decision fields.

- [ ] **Step 3: Document findings**

Append any issues or adjustments to `projects/adaptive-triage/process-log.md`.

- [ ] **Step 4: Commit any fixes**

If the smoke test revealed issues that needed fixing:

```bash
git add -A
git commit -m "fix: address issues from adaptive-triage smoke test"
```

---

## Post-MVP Roadmap

After the MVP is working and has accumulated 5+ sessions of real data:

1. **`/eval-triage` command** — Run accumulated dataset through current rules, report accuracy
2. **Auto confidence bumping** — When a rule's pattern appears in corrections across 2-3 sessions, auto-promote from low → medium → high
3. **Clustering** — Detect related items and suggest grouping before filing
4. **Sub-type classification** — Add idea/principle/evaluation/reflection sub-types when correction patterns demand it
5. **Integration with TypeScript eval system** — Feed real session data into the existing eval infrastructure at `claude-plugins/productivity/scripts/todoist-eval/`

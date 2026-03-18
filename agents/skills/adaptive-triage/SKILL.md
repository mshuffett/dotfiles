---
name: adaptive-triage
description: Interactive Todoist triage with preference learning. Use when the user says "triage", "process my inbox", "clean up tasks", "triage my todoist", "file these captures", or mentions inbox zero. Also use when the user has a batch of raw items (voice notes, links, ideas) that need classifying and routing to Todoist projects or Obsidian. This skill replaces inbox-triage with an interactive confirm/correct loop that learns over time.
---

# Adaptive Triage

Interactive triage that learns your preferences. You present classified items in a
table, the user confirms or corrects, you execute and log everything. Corrections
become rules that improve future sessions.

## Regression Check (before anything else)

If session logs exist in `~/.dotfiles/projects/adaptive-triage/triage-sessions/`:

1. Load the last 20 corrections (items where `was_correction: true`) from recent session files
2. Re-classify those items using current learned rules
3. If any item would now be classified differently than the user's decision, warn:

```
⚠ <N> recent corrections would now be classified differently:
  - "<item>": you chose <X>, now classifying as <Y>
    (caused by <rule-id>)

Review rules before we start? [y/n]
```

If no session logs exist yet, skip this step entirely.

## Step 0: Enrich

Gather full context before classifying anything.

1. **Fetch items** — run these and collect output:
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
   These serve as few-shot examples of the user's preferences.

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
3. **Base heuristics** — read [references/base-heuristics.md](references/base-heuristics.md)

Also check for stale rules: if any learned rule references a project name, verify
it exists via `td project list`. Flag stale rules in the presentation.

## Step 2: Present

Show all items in a grouped table. Items needing the most attention go first.

```
📥 Triage: <N> items (<X> inbox, <Y> today, <Z> overdue)

── NEEDS YOUR INPUT ──────────────────────────────────────────────────
#   Item                              → Category    Destination
<items with Clarify category or confidence < 50%>
<show full comments/description for these items>

── REVIEW THESE ──────────────────────────────────────────────────────
<items with confidence 50-80%>

── LOOKS GOOD ────────────────────────────────────────────────────────
<items with confidence > 80%>

[a]ccept all  |  correct: "3: Action, Demo Day"  |  [s]kip session
```

If any stale rules were detected, show a warning before the table:
```
⚠ Rule <id> references project "<name>" which no longer exists.
  Disable? [y/n]
```

## Step 3: Collect Corrections

Wait for user input. Parse according to this grammar:

- `a` — accept all, proceed to execution
- `s` — skip/abort session, do nothing
- Corrections separated by **semicolons**:
  - `<#>: <category>, <destination>` — change both
  - `<#>: <category>` — change category only, keep AI destination
  - `<#>: , <destination>` — change destination only, keep AI category
  - `<#>: delete` — mark for deletion (reserved word)
  - `<#>: skip` — leave in inbox for next session (reserved word)

Examples:
- `3: Action, Demo Day; 8: delete; 11: Reference, Orchestration`
- `a` (everything looks good)

After parsing, confirm: "Applying N decisions (X corrected, Y confirmed)..."

If input doesn't parse, ask for clarification — don't guess.

## Step 4: Execute

For each confirmed/corrected item:

**Action items:**
- `td task move id:<id> --project "<Project Name>"`

**Quick items:**
- Present for the user to handle now (e.g., "Cancel whispr — do it now?")
- After they handle it: `td task complete id:<id>`

**Reference / Seed items:**
- Write Obsidian note using template in [references/note-templates.md](references/note-templates.md)
- Path: `~/ws/notes/<destination-path>/<slugified-title>.md`
- Then: `td task complete id:<id>`

**Delete items:**
- `td task delete id:<id>`

**Clarify items (resolved by correction):**
- Execute based on the corrected category

**Clarify items (still unresolved):**
- `td comment add id:<id> --content "cc: Needs clarification — <what context is missing>"`
- Leave in inbox

**Skip items:**
- Do nothing, leave in inbox

Report each action:
```
✓ Moved "cancel whispr" → completed
✓ Moved "tell chen-chen about the space" → Demo Day
✓ Created note: 2-Areas/Strategy/high-agency-principle.md
✗ Failed: <error message>
```

## Step 5: Log Session

Write JSONL to `~/.dotfiles/projects/adaptive-triage/triage-sessions/YYYY-MM-DD.jsonl`

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
    "confidence": "<0-100>",
    "reasoning": "<brief reasoning>",
    "rules_applied": ["<rule-ids>"]
  },
  "decision": {
    "category": "<category>",
    "destination": "<destination>",
    "was_correction": false,
    "correction_reasoning": null
  },
  "executed": true,
  "execution_result": "<what happened>"
}
```

If the file already exists for today (multiple sessions), append to it.

## Step 6: Propose Rules (if corrections exist)

If there were 0 corrections: "Perfect session — N/N confirmed. Session logged." Stop.

If there were corrections:

1. Analyze patterns — same type of mistake repeated, systematic misclassification
2. Check existing rules — does a correction match/extend an existing rule?
   If so, propose bumping confidence and adding the new example.
3. Propose new rules for genuinely new patterns:

```
Session complete: <N> items, <X> corrections.

Patterns I noticed:
  1. <Pattern description>
     Evidence: "<item>" corrected from <old> → <new>
     Proposed confidence: <low|medium|high>

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

## Key Reminders

- **Comments are mandatory enrichment.** Check `td comment list` on EVERY item
  before classifying. This is the #1 source of missing context.
- **Preserve raw text.** Obsidian notes include full original item text +
  description + comments. Don't summarize the user's own words.
- **Voice captures default to Reference/Seed.** Only classify as Action when
  there's an imperative verb + specific person/target. Modal verbs = brainstorming.
- **Don't guess when uncertain.** Use Clarify. A confident wrong classification
  is worse than asking.
- **Log everything.** Every item, every decision, every correction. The logs
  ARE the training data for future sessions.

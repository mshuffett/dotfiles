# Adaptive Triage: Interactive Todoist Triage with Preference Learning

> Design doc for an interactive triage system that learns Michael's classification
> preferences over time through a confirm/correct loop.

## Problem Statement

Todoist triage is a preference learning problem being attacked with prompt engineering tools.
The correct classification depends on internal user state — current projects, relationships,
priorities, temporal context — that a static prompt can't encode. Previous attempts (inbox-triage
skill v0-v2) failed because:

1. **Context gap**: Many items are unclassifiable without user context ("tell chen-chen about the space")
2. **Eval poisoning**: Synthetic test scenarios introduced wrong rules that the correction loop amplified
3. **Interaction mismatch**: Batch-in/batch-out design when triage is inherently interactive
4. **Taxonomy rigidity**: Categories too coarse to match user's actual mental model

See: `agents/skill-workspaces/inbox-triage-workspace/sessions/2026-02-21-live/corrections.md`
for the 11 corrections that surfaced these structural issues.

## Design Principles

1. **Make triage fast, not automatic** — the AI accelerates Michael's decisions, doesn't replace them
2. **Learning is a side effect of use** — no separate training step; each session improves the next
3. **Real data only** — no synthetic scenarios; eval dataset comes from actual triage sessions
4. **Confidence-aware** — the system knows what it doesn't know and flags uncertainty explicitly
5. **Minimal infrastructure** — Claude Code skill, JSONL logs, markdown rules; no custom apps

## User's Inputs & Constraints (from conversation)

- Michael has tried and failed multiple times to make a triage skill work
- He identified this as a general alignment/personalization problem
- One-at-a-time item presentation is too cumbersome — needs batch review
- Wants documentation of the design process, assumptions, and discoveries
- Approach A (Claude Code skill) chosen over standalone TUI or web app
- The hard problem is calibration, not UX — solve calibration first

## Skill Location & Entrypoint

The skill lives at `agents/skills/adaptive-triage/SKILL.md` and is triggered by
`/triage` or natural language like "triage my todoist", "process my inbox", "clean up tasks".

The existing `inbox-triage` skill at `agents/skills/inbox-triage/` will be retired
(description updated to redirect to adaptive-triage). Adaptive triage replaces it entirely
but reuses its Obsidian note templates from `inbox-triage/references/examples.md`.

Data files (session logs, learned rules, eval results) live in `projects/adaptive-triage/`.

## Architecture

### Overview

```
┌─────────────────────────────────────────────────────┐
│                   /triage skill                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Enricher │→ │Classifier│→ │ Presenter (table)  │  │
│  │          │  │          │  │                    │  │
│  │ td inbox │  │ rules +  │  │ scan & correct UX  │  │
│  │ td today │  │ few-shot │  │                    │  │
│  │ comments │  │ examples │  │ confirm / correct  │  │
│  │ vault ls │  │          │  │                    │  │
│  └──────────┘  └──────────┘  └────────┬───────────┘  │
│                                       │              │
│                              ┌────────▼───────────┐  │
│                              │    Executor         │  │
│                              │                     │  │
│                              │ td move/update      │  │
│                              │ write Obsidian note │  │
│                              │ log session JSONL   │  │
│                              └────────┬───────────┘  │
│                                       │              │
│                              ┌────────▼───────────┐  │
│                              │   Rule Proposer     │  │
│                              │                     │  │
│                              │ analyze corrections  │  │
│                              │ propose new rules    │  │
│                              │ update learned-rules │  │
│                              └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Components

#### 1. Enricher (Step 0)

Before any classification, gather full context:

- `td inbox` — fetch all inbox items
- `td today` — fetch today + overdue items (Critique 1: scope includes today+overdue)
- `td comment list <id>` — fetch comments for EVERY item (Critique 4: mandatory, not optional)
- `ls ~/ws/notes/1-Projects/ 2-Areas/ 3-Resources/` — load vault taxonomy (Critique 9)
- Deduplicate items appearing in both inbox and today

Output: enriched item list with full metadata.

#### 2. Classifier

Takes enriched items and produces recommendations using:

- **Learned rules** (from `learned-rules.md`) — weighted by confidence
- **Few-shot examples** (from recent session logs) — most similar past items
- **Base heuristics** — the static classification logic from the current skill

**Categories** (used consistently throughout all components):

| Category | Meaning | Destination |
|----------|---------|-------------|
| Action | Clear next step, needs tracking | Todoist project |
| Quick | < 5 min, handle now | Execute inline or mark complete |
| Reference | Knowledge worth keeping | Obsidian vault note |
| Seed | Idea/concept not yet actionable | Obsidian vault (Project Seeds) |
| Clarify | Genuinely ambiguous | Stay in inbox with annotation |
| Delete | Stale, duplicate, not actionable | Remove from Todoist |

**First session behavior**: With no learned rules and no session history, the
Classifier uses only base heuristics — the static classification logic ported
from `inbox-triage/SKILL.md` (Eisenhower matrix, action detection, modal verb
detection). This is the cold-start baseline. It will be imperfect. That's fine —
the corrections from session 1 seed the learning loop.

Classification output per item:
```typescript
{
  item_id: string
  item_text: string
  enrichment: { comments: string[], description: string }
  recommendation: {
    category: "Action" | "Quick" | "Reference" | "Seed" | "Clarify" | "Delete"
    destination: string       // project name, Obsidian path, or null for Clarify
    reasoning: string         // why this classification
    confidence: number        // 0-100
    matching_rules: string[]  // rule IDs that influenced this, e.g. ["rule-003"]
  }
}
```

#### 3. Presenter ("scan and correct" UX)

Present all items in a table grouped by confidence tier:

```
📥 Triage: 14 items (8 inbox, 4 today, 2 overdue)

── NEEDS YOUR INPUT ──────────────────────────────────────────────────
#   Item                              → Category    Destination
8   check if that works                 Clarify     ?
11  let raiya know about autogen        Clarify     ?

── REVIEW THESE ──────────────────────────────────────────────────────
3   high agency is my top principle     Reference   2-Areas/Strategy
5   could make the bot smarter with…   Seed        Project Seeds

── LOOKS GOOD (confirm or correct) ──────────────────────────────────
4   check out github.com/some/repo     Reference   Orchestration
7   there's like this force that…      Reference   2-Areas/Journal
2   tell chen-chen about the space     Action      Demo Day
1   cancel whispr subscription         Quick       —
6   schedule dentist appointment       Quick       —

[a]ccept all  |  correct: "3: Action, EAI"  |  [s]kip session
```

**Edge cases:**
- 0 inbox items but today/overdue exist: run normally with those items
- 0 total items: "Nothing to triage! Inbox zero." and exit
- 0 corrections in a session: log the session (all confirms), skip rule proposal,
  print "Perfect session — 14/14 confirmed. Session logged."

#### Correction Grammar

Corrections use semicolons to separate multiple corrections (since commas
appear within corrections):

```
<item#>: <category>, <destination>
```

Examples:
- `3: Action, Demo Day` — change item 3 to Action in Demo Day project
- `8: delete` — delete item 8 (single-word commands: delete, skip)
- `3: Reference` — change category only, keep AI's destination
- `3: , 2-Areas/Strategy` — change destination only, keep AI's category
- Multiple: `3: Action, Demo Day; 8: delete; 11: Reference, Orchestration`

Reserved single-word commands: `delete`, `skip` (no comma needed).

Interaction modes:
- `a` — accept all recommendations, execute
- Correction string — apply corrections, confirm everything else, execute
- `s` — abort session without executing anything

After corrections entered:

```
Applying 14 decisions (2 corrected, 12 confirmed)...

✓ Moved "cancel whispr subscription" → completed
✓ Moved "tell chen-chen about the space" → Demo Day
✓ Created note: 2-Areas/Strategy/high-agency-principle.md
...

Session logged to triage-sessions/2026-03-17.jsonl
```

#### 4. Executor

Carries out confirmed/corrected decisions. **Verify `td` command syntax against
`td --help` and the todoist skill at `agents/skills/todoist/` before implementation.**

- **Action items**: Move to project in Todoist, set priority if specified
- **Quick items**: Present for inline handling ("cancel whispr subscription" — Michael
  does it now, then skill marks complete). Quick means "do it now", not "auto-complete".
- **Reference/Seed items**: Write `.md` file to Obsidian vault using the note template
  from `inbox-triage/references/examples.md`:
  ```markdown
  ---
  tags: [<topic-tags>]
  source: todoist-triage
  created: <date>
  related: [<linked-notes>]
  ---
  # <Title>

  ## Summary
  <2-4 sentence summary>

  ## Source
  <Original item text, description, and comments — preserved verbatim (Critique 10)>

  ## Connections
  <Links to related areas/notes>
  ```
  Destination path comes from the classification. Skill checks existing vault
  structure (loaded in Enricher step) and presents options if ambiguous (Critique 8):
  existing match vs create new area.
- **Delete items**: Remove from Todoist (confirm if < 7 days old)
- **Clarify items**: Leave in inbox, add a Todoist comment noting what context is needed

After execution, mark each Todoist task as complete (for items that were filed/handled)
or moved (for items reassigned to a project). The audit trail is the session log.

#### 5. Rule Proposer (end of session)

After execution, if there were corrections:

```
Session complete: 14 items, 2 corrections.

Patterns I noticed:
  1. Values/principles about EAI → 2-Areas/Strategy (not 2-Areas/EAI)
     Evidence: "high agency is my top principle" corrected EAI → Strategy
     Similar past corrections: none yet (new pattern)
     Proposed rule confidence: low (1 example)

  2. Raiya = personal contact, no default project
     Evidence: you corrected project from "Everything AI"
     Similar past corrections: none yet
     Proposed rule confidence: low (1 example)

Add these as rules? [y]es / [e]dit / [n]o / review [i]ndividually
```

Rules are stored in `learned-rules.md` with provenance:

```yaml
rules:
  - id: rule-001
    rule: "Items expressing personal values, principles, or cultural beliefs → file to 2-Areas/Strategy, not the domain area they reference"
    examples:
      - "high agency is my top principle" (2026-03-17)
    confidence: low    # low=1 example, medium=2-3, high=4+
    added: 2026-03-17
    last_confirmed: 2026-03-17

  - id: rule-002
    rule: "Raiya is a personal contact with no default project association"
    examples:
      - "let raiya know about autogen" corrected from EAI (2026-03-17)
    confidence: low
    added: 2026-03-17
    last_confirmed: 2026-03-17
```

When a new correction matches an existing low-confidence rule, the rule gets
bumped to medium/high and the example gets appended. This is how rules
"graduate" from tentative to reliable.

### Learning Verification

#### Silent Check (every session start)

Before presenting recommendations, the skill loads the last ~20 corrections from
session logs and re-classifies those items using current rules. This is a separate
classification pass (same prompt, just the historical items) to check for regressions.

If any previously-corrected item would now be classified differently than Michael's
decision:

```
⚠ Heads up: 2 recent corrections would now be classified differently.
  - "tell chen-chen about the space": Michael chose Demo Day, now classifying as EAI
    (caused by rule-007 added last session)

Review rules before we start? [y/n]
```

This check requires ~20 extra classification calls at session start. If this is too
slow, it can be reduced to checking only items affected by rules added in the last
session.

#### On-demand Eval (`/eval-triage`)

Runs full accumulated dataset:
- Accuracy by category (Action, Reference, ProjectSeed, Clarify)
- Accuracy by confidence tier (high/medium/low)
- Rules ranked by helpfulness (how many corrections they prevent)
- Rules ranked by harmfulness (how many regressions they cause)
- Biggest remaining error patterns (suggests new rules to try)

This connects to the existing TypeScript eval infrastructure in
`claude-plugins/productivity/scripts/todoist-eval/` but feeds it real data.

## Data Model

### Directory Structure

```
projects/adaptive-triage/
├── design.md                    # this file
├── learned-rules.md             # accumulated rules with provenance
├── triage-sessions/             # raw session logs
│   ├── 2026-03-17.jsonl
│   ├── 2026-03-18.jsonl
│   └── ...
├── eval-results/                # eval run outputs
│   └── 2026-03-20-eval.md
└── process-log.md               # design decisions, discoveries, assumptions
```

### Session Log Format (JSONL)

Each line is one item decision:

```jsonl
{
  "session_id": "2026-03-17T09:30:00",
  "item": {
    "id": "todoist-id-123",
    "text": "high agency is my top principle",
    "description": "...",
    "comments": ["..."],
    "project": "Inbox",
    "created": "2026-03-15",
    "due": null
  },
  "ai_recommendation": {
    "category": "Reference",
    "destination": "2-Areas/EAI",
    "confidence": 72,
    "reasoning": "Mentions EAI, filed under area",
    "rules_applied": ["rule-003"]
  },
  "decision": {
    "category": "Reference",
    "destination": "2-Areas/Strategy",
    "was_correction": true,
    "correction_reasoning": "Values/principles go to Strategy, not the domain they reference"
  },
  "executed": true,
  "execution_result": "Created 2-Areas/Strategy/high-agency-principle.md"
}
```

### Learned Rules Format

See section 5 above. Rules are YAML in a markdown file so they're
human-readable and editable. The skill parses them at session start.

## MVP Scope

### In Scope (v1)
- `/triage` skill that fetches, enriches, classifies, and presents items
- Scan-and-correct table UX with batch confirm
- Session JSONL logging
- End-of-session rule proposal
- `learned-rules.md` accumulation
- Silent regression check at session start
- Executor for td commands and Obsidian note creation

### Out of Scope (future)
- `/eval-triage` on-demand eval (v2 — need data first)
- Fancy TUI or web dashboard
- Automatic rule confidence bumping across sessions (v2)
- Integration with the TypeScript eval infrastructure
- Clustering/MOC suggestions (can add once basic triage works)
- Due date inference for action items
- Sub-type classification (idea/principle/evaluation/reflection) — start with the 4 base categories, add sub-types once we see correction patterns that demand it

## Assumptions

1. The `td` CLI is installed and authenticated
2. Obsidian vault is at `~/ws/notes/` with PARA structure
3. Michael uses Claude Code frequently enough that a skill is the right shell
4. Most items (>50%) will be confirmable on first try after ~5 sessions
5. The bottleneck is calibration data, not prompt sophistication
6. Rules in natural language (parsed by the LLM each session) are sufficient;
   we don't need structured rule engines

## Success Criteria

- **Usable**: A triage session of 15 items takes < 3 minutes
- **Learning**: Confirmation rate measurably improves over 5+ sessions
- **Data**: After 5 sessions, enough data exists to run a meaningful eval
- **No regressions**: Rule additions don't silently break previously-correct classifications

## Rule Staleness (MVP-minimal)

Rules that reference Todoist project names are checked against `td projects` at session
start. If a project no longer exists, the skill flags it:

```
⚠ Rule rule-005 references project "Demo Day" which no longer exists in Todoist.
  Disable this rule? [y/n/edit]
```

This prevents the most common staleness failure. More sophisticated expiry (time-based
decay, usage frequency) is deferred to v2.

## Open Questions

1. Should the skill handle recurring items differently (e.g., "process email" appears every day)?
2. What's the right threshold for auto-confirming very high confidence items (>95%)?
   Or should Michael always see every item? (Starting with: always show everything.)
3. How should time-based rule decay work? (Deferred — project-based staleness check covers
   the most common case for now.)

## Relationship to Existing Infrastructure

- **inbox-triage skill** (agents/skills/inbox-triage/) — the current batch skill. Adaptive triage
  replaces its classification + filing logic but can reuse its Obsidian note templates and
  scenario documentation.
- **todoist-eval** (claude-plugins/productivity/scripts/todoist-eval/) — the TypeScript eval
  system. Will be fed real session data once we have enough. The schemas (corrections.ts,
  dataset.ts) are compatible with our JSONL format.
- **skill-creator** — the eval/iteration framework. Useful for optimizing the skill's trigger
  description and for structured A/B testing of prompt changes once we have data.

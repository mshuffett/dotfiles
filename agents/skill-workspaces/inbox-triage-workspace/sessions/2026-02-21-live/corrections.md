# Corrections — 2026-02-21 Live Triage Session

## Critique 1: Scope of "inbox clearing"
**What was wrong:** The skill only processes Todoist Inbox items.
**What it should be:** "Inbox clearing" means inbox + due today + overdue. The user's mental model of inbox clearing is about processing everything that needs attention right now, not just items in the Inbox project.
**Impact:** Skill scope / Step 1 definition. The skill should fetch `td inbox` AND `td today` and deduplicate.

## Critique 2: Person-project associations were fabricated from synthetic test data
**What was wrong:** The skill says "Key contacts: Chen-Chen, Raiya, Anar" under Everything AI.
**What it should be:**
- Chen-Chen → Demo Day contact
- Anar → friend (no specific project association)
- Raiya → unrelated (no specific project association)
**Impact:** This means eval 3's expectation that "let chen-chen know about the space" → Everything AI is WRONG. It should be Demo Day (Chen-Chen is a Demo Day contact AND "the space" is event-related). The original v0 classification was actually correct and we "fixed" it in the wrong direction. The person-project association RULE is valid, but the specific associations in the prompt were fabricated from hypothetical correction scenarios, not real data.
**Eval changes needed:**
- eval 3, expectation 2: Change from "IS classified as Action (imperative + person)" to also verify project = Demo Day
- SKILL.md: Update active projects to remove incorrect contact associations
- triage-correction-scenarios.md: Scenario 1 is wrong — Chen-Chen IS Demo Day

## Critique 3 (meta): Corrections must be written to a file, not just stated in conversation
**What was wrong:** I said "Critique #1 captured" and "Critique #2 captured" but didn't write them anywhere persistent.
**What it should be:** Every correction gets written to the session's `corrections.md` immediately. The self-improvement protocol requires a record — conversation text disappears on context compaction.
**Impact:** Skill workflow / post-triage discipline. Could add to SKILL.md principles or the "After Triage" section.

## Critique 4: Must check comments on ALL tasks before classifying
**What was wrong:** I only checked comments on the ambiguous/clarification items. Skipped checking comments on items I felt confident about.
**What it should be:** Comments must be checked on EVERY task before classification. Comments often contain critical context — links, descriptions, attachments — that change the classification. The todoist skill itself says "Read comments before acting; comments may contain critical context and attachments." This should be a mandatory enrichment step, not optional.
**Impact:** Skill workflow / Step "Enrich". Add explicit instruction: "For every item, check `td comment list` before classifying. Comments are part of the item, not supplementary."

## Critique 5: Outputs should be real files, not just descriptions in a report
**What was wrong:** The triage report describes what notes to create and where to file them, but doesn't actually write the Obsidian notes to `~/ws/notes/` or run `td` commands to move Todoist items.
**What it should be:** A real triage session should produce:
1. Actual `.md` files written to `~/ws/notes/` (the Obsidian vault)
2. Actual `td` commands executed to move/update Todoist items to the right projects
3. The triage report as the audit trail of what was done
**Impact:** Skill workflow / Outputs section. The skill should be clear that outputs are real artifacts, not just descriptions. The triage report documents decisions; the notes and Todoist changes are the actual work product.
**Testing note:** The eval framework tests classification logic (text-in, text-out) which is the hard part. File writing is mechanical and better validated during real sessions.

## Critique 6 (fundamental): The skill's role needs to shift from autonomous triage to assisted triage
**What was wrong:** The skill tries to autonomously classify and file items. But many items require user context the AI can't have — project priorities, people relationships, date urgency, whether something is relevant to Demo Day right now vs deferred.
**What it should be:** The AI's role is to make the human's triage as fast as possible, not to replace it. Concretely:
- Pre-process: enrich, cluster, format, recommend classifications
- Present items in bunches for rapid human confirmation (keyboard-driven)
- On confirm: execute (file to Todoist, write Obsidian note)
- On critique: learn new rules in background without regressions, move to next item
- This is an interactive TUI, not a batch prompt.

**Additional requirements surfaced:**
- Everything AI is an AREA (ongoing), not a PROJECT (has end date) — PARA distinction matters
- Actions need due dates but no logic exists for determining them
- Demo Day items need hierarchy — what applies vs what gets deferred
- Evolving project ideas need a clear PKM home that persists and grows
- The eval/self-improvement loop is still valuable but wraps the interaction layer, not replaces it

**Impact:** This is a fundamental architecture change, not a prompt edit.

## Critique 7: Naming by concept/area, not by tool
**What was wrong:** Named the cluster "Claude Code Orchestration Tools" — too tool-specific.
**What it should be:** Name by the conceptual area — "Orchestration" — since these repos span multiple tools and the user thinks about this as a domain area, not a tool-specific collection. File under an area called Orchestration, not Resources/AI.
**Impact:** Reinforces existing MOC principle ("Agent Orchestration Patterns" not "Claude Code Links") but also suggests the filing location should be an Area, not Resources. The user's mental model is areas of interest, not tool categories.

## Critique 8: Must check existing vault structure before creating new locations — but user may still want a NEW area
**What was wrong:** Created `2-Areas/Orchestration/` without checking existing areas. Then over-corrected by trying to shoehorn it into `2-Areas/Orchestrator Model/` when the user actually wanted the new area.
**What it should be:** Scan existing areas first, then PRESENT OPTIONS including both existing matches and "create new area" — let the user decide. Don't assume existing = correct home. Sometimes the user's capture reveals a new area that should exist. The key is: show what exists, suggest a match, but don't force it.
**Also:** Notes should link to related areas (e.g., Everything AI Strategy, Orchestrator Model) even if they don't live inside them.
**Impact:** Skill workflow / filing step. Present existing options + new area option. Always add cross-links to related areas.

## Critique 9: Load vault structure at the start of the process
**What was wrong:** The skill doesn't scan the vault structure upfront.
**What it should be:** At the beginning of the triage process (Step 0 / "Before You Start"), do an `ls` of `2-Areas/`, `3-Resources/`, and `1-Projects/` to load the current PARA structure. This gives the filing context needed for the entire session — which areas exist, what folders are available, what the taxonomy looks like. Without it, every filing decision is a guess.
**Impact:** Skill workflow / Step 0. Add: "Scan ~/ws/notes/1-Projects/, 2-Areas/, 3-Resources/ to load current vault taxonomy before processing any items."

## Critique 10: Must include ALL description content in notes, not just links
**What was wrong:** The "one way to go about it" item had important context in the description — references to GST, Ralph Orchestrator, and a clear intent to "map abstractions, find common patterns, productize." I only captured the repo link and one-liner. Also missed the gist URL from "more orchestration things."
**What it should be:** Descriptions are the user's raw thinking captured alongside the item. ALL description content must be preserved in the note — it's as important as the item title. Treat title + description + comments as one unit of information to capture.
**Impact:** Skill workflow / Enrich step and note creation. The note template should include the full description text, not just extracted links.

## Critique 11: Don't batch-classify by keyword proximity — distinguish item types
**What was wrong:** When processing ~50 voice capture items, I lumped everything mentioning EAI into an "EAI Product Ideas" note. But "High agency is my top principle for EAI" is a strategic principle/culture value, not a product idea. Similarly, orchestration evaluations ("GSD is better than ralph") are decision-context, not ideas. Personal reflections ("too many shiny ideas") are operating insights, not product brainstorming.
**What it should be:** Before filing, classify the *nature* of each item:
- **Idea/brainstorm** — a possible thing to build or try → Ideas area
- **Principle/value** — a guiding belief or cultural commitment → Strategy or Culture area
- **Evaluation** — a comparative judgment about tools/approaches → relevant domain area as analysis
- **Reflection** — personal insight about how to work/think → Journal or personal operating notes
Don't batch by keyword ("mentions EAI → EAI Product Ideas"). Think about what the item actually IS.
**Impact:** Classification logic / Step 2b. The current categories (Action/Reference/Project Seed/Clarify) may need a finer lens for reference sub-types, or at minimum the filing step needs to distinguish between these before choosing a destination.

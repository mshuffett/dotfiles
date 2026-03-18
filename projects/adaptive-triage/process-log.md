# Process Log: Adaptive Triage

Running record of decisions, discoveries, assumptions, and Michael's inputs.

## 2026-03-17: Initial Design Session

### Context
Michael has tried multiple times to create a good todoist triage skill. The inbox-triage
skill went through v0, v1, v2 with a live correction session on 2026-02-21 that produced
11 detailed critiques. The fundamental realization: this is a preference learning problem,
not a prompt engineering problem.

### Michael's Inputs
- "I keep trying and failing to create a good skill/prompt that would allow you to
  successfully triage my todoist items in the way I would ideally want to"
- Identified two root causes: (1) items lack context for reliable processing,
  (2) no good calibration process or training dataset for evals
- "I think it is a general alignment/personalization problem which would be incredibly
  valuable to solve across many different domains"
- Asked about the skill-creator's approach as inspiration
- Wanted minimal back-and-forth; preferred I think through the options and propose
- On one-at-a-time UX: "can be a bit cumbersome at times" — led to scan-and-correct model
- On learning loop: "what happens if I did correct something, where does the learning
  happen and the verification of the learning?" — led to the three-layer architecture
- Approved Approach A (Claude Code skill) over standalone TUI or web app

### Key Discoveries
1. **The 11 corrections from 2026-02-21 are the Rosetta Stone.** They reveal structural
   issues, not surface-level prompt tweaks. Critique 6 (shift to assisted triage) and
   Critique 2 (eval poisoning from synthetic data) are the most important.

2. **Existing eval infrastructure is well-built but data-starved.** The TypeScript eval
   system (corrections.ts, dataset.ts, runner.ts) is ready to go but has no real data.
   The bottleneck is data collection, which the interactive loop solves.

3. **The skill-creator's eval framework is designed for objective tasks.** Triage is
   subjective. The framework's grader/assertion model doesn't directly apply, but the
   iteration loop pattern and the description optimization loop (train/test split) do.

4. **Confidence-based sorting is more useful than confidence-based filtering.** Rather
   than auto-confirming high-confidence items (risky), sort by confidence so Michael
   sees uncertain items first and can quickly scan past the confident ones.

### Assumptions Made
- `td` CLI is the right interface to Todoist (vs API calls)
- Natural language rules parsed by the LLM each session are sufficient (no rule engine)
- JSONL is the right format for session logs (append-only, line-per-item)
- YAML-in-markdown for learned rules (human-readable, LLM-parseable)
- The confirmation rate is the right North Star metric

### Open Decisions
- Sub-type classification (idea/principle/evaluation/reflection from Critique 11):
  deferred to v2, will add when correction patterns demand it
- Rule expiry mechanism: not designed yet, will need once projects change
- Auto-confirm threshold: not set, starting with "always show everything"

### Design Decisions
| Decision | Choice | Why |
|----------|--------|-----|
| Platform | Claude Code skill | Zero infrastructure, Michael lives in terminal, corrections captured naturally |
| UX model | Scan-and-correct table | Faster than one-at-a-time; Michael only types what's wrong |
| Data format | JSONL session logs | Append-only, easy to analyze, compatible with existing eval infra |
| Rule storage | YAML in markdown | Human-readable, LLM-parseable, versionable in git |
| Learning trigger | End-of-session proposal | Natural pause point, corrections fresh in context |
| Verification | Silent replay at session start | Catches regressions before they affect real items |
| Eval approach | Real decisions only | Synthetic scenarios caused eval poisoning in v1/v2 |

### Spec Review Findings (2026-03-17)

Ran spec-document-reviewer subagent. Key issues found and fixed:

1. **Category vocabulary inconsistency** — Presenter used "Obsidian" while Classifier used
   "Reference". Unified to 6 categories: Action, Quick, Reference, Seed, Clarify, Delete.

2. **Correction grammar underspecified** — `3: Action, EAI` format was ambiguous with
   comma-separated multi-corrections. Fixed: semicolons between corrections, commas within.
   Added partial correction syntax (category-only, destination-only).

3. **Obsidian note template missing** — Executor said "proper frontmatter" without defining it.
   Added concrete template with fields, referencing inbox-triage's existing examples.md.

4. **Silent regression check not implementable** — Described as "replay through rules" but
   rules are LLM-interpreted, not deterministic. Clarified: it's a separate classification
   pass using the same prompt on historical items.

5. **First session behavior undefined** — Added: falls back to base heuristics ported from
   inbox-triage SKILL.md. Imperfect cold-start is expected and fine.

6. **Quick items ambiguous** — Clarified: Quick means "do it now interactively", not
   auto-complete. Skill presents for inline handling.

7. **Rule staleness** — Added MVP-minimal staleness check: compare rule project references
   against `td projects` at session start, flag stale rules.

8. **Edge cases** — Added: 0 items (exit), 0 corrections (log + skip rule proposal),
   0 inbox but today/overdue items exist (run normally).

9. **Skill location** — Added section: skill at `agents/skills/adaptive-triage/SKILL.md`,
   retires inbox-triage, data in `projects/adaptive-triage/`.

### Implementation (2026-03-17)

Built and committed all components:

1. `projects/adaptive-triage/triage-sessions/` — session log directory (empty)
2. `projects/adaptive-triage/learned-rules.md` — empty rules file
3. `agents/skills/adaptive-triage/references/note-templates.md` — Obsidian note template
4. `agents/skills/adaptive-triage/references/base-heuristics.md` — cold-start classification logic
5. `agents/skills/adaptive-triage/SKILL.md` — the skill (238 lines)
6. `agents/skills/inbox-triage/SKILL.md` — deprecated, redirects to adaptive-triage

### Smoke Test (2026-03-17)

Verified all CLI infrastructure works:
- `td inbox` — 79 items available
- `td today` — 42 items (including overdue)
- `td comment list id:<id>` — works (returns comments or "No comments")
- `td project list` — returns project names with IDs
- `ls ~/ws/notes/{1-Projects,2-Areas,3-Resources}/` — vault structure accessible

**Ready for first real triage session.** The skill should be invocable via
`/triage` or natural language. First session will be cold-start (no rules, no
examples) using base heuristics only. Expect imperfect results — the corrections
from session 1 seed the learning loop.

---
name: prompt-self-improvement
description: Make any AI prompt self-improving through structured corrections, understanding development, and isolated testing. Use when a prompt produced wrong output and needs calibration, when reviewing corrections to improve a prompt, when bootstrapping a new prompt through iterative sessions, or when running a prompt improvement cycle. Covers the orchestrator/subagent isolation pattern, correction-as-test-case methodology, and prompt hygiene principles. Complements prompt-alignment (initial development) and eval-triage (automated classification testing).
---

# Prompt Self-Improvement

Make any prompt that processes inputs and produces correctable outputs into a self-improving system. Corrections become test cases, history becomes the test suite, the prompt is the code being improved.

## Architecture

```
ORCHESTRATOR (full context)
├── Has: base prompt, session history, corrections, expected outputs
├── Does NOT execute the prompt under test
└── Spawns ▼

SUBAGENT (isolated context)
├── Has: ONLY the prompt + ONLY the input
├── No access to: corrections, expected outputs, orchestrator reasoning
└── Returns: raw output to orchestrator
```

**Why isolation matters:** If the agent can see the right answer, it produces that answer regardless of whether the prompt steers it there. Isolation tests the prompt's steering power.

## The 5-Phase Improvement Cycle

### Phase 1: Capture Corrections
Save user corrections verbatim. Don't interpret yet.

### Phase 2: Develop Understanding
For each correction, articulate:
- **What was wrong** — quote the specific error
- **Why it was wrong** — the reasoning failure, not a restatement. What signal was over/under-weighted?
- **What understanding prevents this** — a principle, not a rule

Bad: "I classified it as action but it should have been reference."
Good: "I treated 'could' as intent to act. In voice captures, modal language signals ideation, not commitment."

### Phase 3: Propose a Fix
For each correction (or cluster): exact diff to the prompt with location, reasoning, and blast radius analysis. See [references/protocol.md](references/protocol.md) for the full proposal template.

Options: strengthen existing language (preferred), add new instruction, add context/annotations to reference data, or no change needed (one-off ambiguity).

### Phase 4: Test with Isolated Subagents
Run the updated prompt through isolated subagents. Three test case types required:

| Type | Source | Must... |
|------|--------|---------|
| **Fix cases** | Corrected items | Now produce correct output |
| **Similar cases** | Past items of same type | Improve or stay correct |
| **Regression cases** | Random previously-correct items | Stay correct |

For the Claude Code subagent pattern and alternative testing approaches (including LLM-as-judge via `eval-triage`), see [references/protocol.md](references/protocol.md).

### Phase 5: Present & Apply
Show the user an improvement log with: what was wrong, diagnosis, proposed edit, test results. User approves → apply. User rejects → iterate. See [references/protocol.md](references/protocol.md) for the log template.

## Prompt Hygiene Principles

1. **Consolidate, don't accumulate.** Merge overlapping instructions. Good improvements sometimes make the prompt shorter.
2. **Principles over rules.** "Voice captures default to reference" beats a keyword list. The model applies principles; rules create edge cases.
3. **Annotations are free context.** Adding domain keywords or examples to reference data the prompt already uses is low-risk, high-value.
4. **One edit per pattern.** Don't make five edits for five instances of the same mistake. Find the underlying principle.
5. **Delete what doesn't work.** If a past edit isn't helping or is causing new errors, remove it. The improvement log provides the audit trail.

## When NOT to Edit

- **Genuine ambiguity:** Reasonable guess that happened to be wrong. Save the correction as context.
- **Missing context:** The prompt couldn't have known. Fix the input, not the prompt.
- **Taste, not logic:** User preferred a different style for this case. Note the preference, don't encode it.

Always explicitly flag when no prompt edit is warranted, with reasoning.

## Bootstrapping a New Prompt

1. Run 3-5 sessions collecting corrections without editing. Need enough data for patterns vs. noise.
2. After session 5: batch improvement cycle — review all corrections, identify 2-3 biggest patterns, targeted edits, test.
3. Switch to per-session cycles. Most sessions: 0-2 small edits.
4. Expect diminishing returns. Major edits after 15+ sessions → rethink fundamental structure.

## Related Skills

- **prompt-alignment** — For initial prompt development (fit-to-generalize loops). Use self-improvement for ongoing calibration after deployment.
- **eval-triage** — A concrete automated implementation of this pattern for Todoist classification. Uses LLM-as-judge (Opus evaluates Sonnet) rather than subagent isolation. Complements this protocol's Phase 2 (understanding development) which eval-triage doesn't fully cover.
- **mistake-tracking** — For tracking operational mistakes by Claude itself. This skill tracks prompt output quality.

## Full Reference

See [references/protocol.md](references/protocol.md) for: session folder structure, detailed phase instructions, subagent execution patterns, improvement log template, and adapting this protocol to a specific prompt.

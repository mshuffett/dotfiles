# Prompt Self-Improvement Protocol — Full Reference

## Session Folder Structure

Every session that uses a self-improving prompt should produce:

```
sessions/
  {date}-{uuid}/
    input.json            # Raw inputs to the prompt
    output.md             # What the prompt produced
    corrections.md        # User's corrections (added post-review)
    improvement-log.md    # Understanding + proposed edits + test results
```

The prompt itself and any reference docs live at the project root alongside the sessions folder.

## Phase Details

### Phase 1: Capture Corrections

Save user corrections verbatim in whatever format is natural:

- "X was wrong, should be Y"
- "This whole section misunderstands what I wanted"
- "Good but too verbose"
- "Stop doing Z"

Save to `corrections.md`. Don't interpret yet.

### Phase 2: Develop Understanding

For each correction:

**a) What was wrong** — the specific output error, quoted.

**b) Why it was wrong** — the reasoning failure. What signal did the prompt over-weight, under-weight, or miss? What assumption failed? This requires genuine diagnosis, not restating the correction.

**c) What understanding would prevent this** — a principle, not a rule. Rules are brittle ("never classify 'could' as action"). Principles generalize ("voice captures with speculative language default to ideation").

### Phase 3: Propose a Fix

For each correction (or cluster of related corrections):

1. **Location:** Where in the prompt? Options:
   - Strengthen existing language (preferred — keeps prompt tight)
   - Add a new instruction/principle
   - Add context/annotations to reference data
   - No prompt change needed — one-off ambiguity

2. **The diff:** Exact old text → new text. If adding, specify where and what's around it.

3. **Reasoning:** Why this location? Why this wording? What other behaviors might this edit affect?

### Phase 4: Test with Isolated Subagents

#### Claude Code Pattern

```bash
claude --print \
  --system-prompt "$(cat /path/to/updated-prompt.md)" \
  --message "$(cat /path/to/test-input.json)" \
  > /path/to/test-output.md
```

The subagent:
- Receives the prompt under test as its system prompt
- Receives the test input as the user message
- Has NO visibility into corrections, expected outputs, or orchestrator reasoning
- Returns raw output

The orchestrator compares the subagent's output against expected output.

#### If subagents aren't available

Write the updated prompt and test inputs to clearly separated files. Run the test in a fresh session. Slower but preserves isolation.

#### Alternative: LLM-as-Judge

For domains with automated eval pipelines (e.g., `eval-triage` for Todoist classification), an LLM-as-judge approach can substitute for or complement subagent isolation. The judge model evaluates the classifier's output against criteria and expected values independently. The self-improvement protocol's value in those cases is primarily in Phase 2 (developing understanding) and the prompt hygiene principles.

#### Test Case Categories

Every test run should include three types:

| Type | Source | Must... |
|------|--------|---------|
| **Fix cases** | The corrected items | Now produce correct output |
| **Similar cases** | Past items of the same type | Improve or stay correct |
| **Regression cases** | Random sample of previously-correct items | Stay correct |

A proposed edit that fixes the target but breaks regressions is not ready. Iterate.

### Phase 5: Present & Apply

#### Improvement Log Template

```markdown
## Improvement Log — {date}

### Correction 1: [short description]

**What was wrong:** [quote the error]

**Why:** [your diagnosis]

**Proposed edit:**
- Location: [where in prompt]
- Change: [old → new, or new addition]
- Reasoning: [why here, why this wording]

**Test results:**
- ✅ Fix case: [item] → now correctly produces [output]
- ✅ Regression: [N] past items unchanged
- ⚠️ Edge case: [any uncertain results]

### [repeat for each correction]
```

User approves → apply edits to the prompt file, save test cases permanently.
User rejects → iterate on the proposal or discard.

## Adapting This Protocol to a Specific Prompt

To make any prompt self-improving:

1. Add a `Step 0: Load Context` that reads recent session history
2. Add a post-session improvement step that references this protocol
3. Set up the session folder structure
4. Define what "correct output" means for your use case (so corrections and test comparisons are meaningful)

The only requirement: the prompt's task has **observable, correctable outputs.** If the user can say "this was wrong, it should have been this," the protocol applies.

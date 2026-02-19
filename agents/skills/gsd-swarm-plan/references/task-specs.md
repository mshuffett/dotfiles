# Task Specifications for Parallel Phase Planning

Prompt templates for each agent role. The orchestrator fills in `{placeholders}` with actual
project context before spawning agents.

## Table of Contents

1. [Phase Planner Prompt](#phase-planner-prompt)
2. [Cross-Phase Reviewer Prompt](#cross-phase-reviewer-prompt)
3. [Revision Prompt](#revision-prompt)

---

## Phase Planner Prompt

Each planner follows the existing GSD plan-phase workflow. The prompt provides project
context and points the agent at the canonical agent definitions — it does NOT reimplement
the research/planning logic.

```markdown
You are planning Phase {phase_number}: {phase_name} for a GSD project.

## Your Mission

Research the phase domain, then create executable PLAN.md files following the standard
GSD plan-phase workflow.

## How to Work

Follow the standard GSD plan-phase workflow — it's your primary reference:
- `/Users/michael/.claude/get-shit-done/workflows/plan-phase.md` — the full orchestration flow (init, research, plan, verify, iterate)

This workflow references these agent definitions, which you can also read directly:
- `/Users/michael/.claude/agents/gsd-phase-researcher.md` — research methodology
- `/Users/michael/.claude/agents/gsd-planner.md` — plan format, task breakdown, must_haves
- `/Users/michael/.claude/agents/gsd-plan-checker.md` — plan verification

You can spawn subagents (gsd-phase-researcher, gsd-planner, gsd-plan-checker) since you
have access to the Task tool. The workflow file shows the exact prompts and spawn patterns.

## Project Context

**STATE.md:**
{state_content}

**ROADMAP.md:**
{roadmap_content}

**REQUIREMENTS.md (relevant section):**
{requirements_for_this_phase}

**Phase from roadmap:**
{phase_section_from_roadmap}

## Phase-Specific Context

{context_content if CONTEXT.md exists, otherwise "No CONTEXT.md — no prior user decisions to honor."}

{research_content if RESEARCH.md exists, otherwise "No existing research."}

## Output

Write to `.planning/phases/{padded_phase}-{slug}/`:
1. `{padded_phase}-RESEARCH.md` — research findings
2. `{padded_phase}-{NN}-PLAN.md` — executable plans

When done, send a message to team-lead with:
- Plans created (count, file paths)
- Wave structure
- `files_modified` list (CRITICAL for cross-phase conflict detection)
- Any concerns or blockers

## Constraints

- Do NOT modify any source code — planning only
- Do NOT plan work that belongs to other phases (check roadmap for phase boundaries)
- Honor locked decisions from CONTEXT.md, exclude deferred ideas
- Message team-lead only when: blocked, done, or discovered something affecting other phases
- Do NOT message other planners — route through team-lead
```

---

## Cross-Phase Reviewer Prompt

Spawned after all planners complete. This is the novel role — it doesn't exist in standard
`/gsd:plan-phase`. The reviewer reads all plans together and finds cross-phase issues.

```markdown
You are the cross-phase reviewer for a GSD parallel planning session.

## Your Mission

Red-team all phase plans for cross-phase conflicts, contradictions, and gaps.
You are adversarial — your job is to find problems, not to approve.

## Plans to Review

Read ALL plan files across these phases:
{list of phase directories with their PLAN.md files}

For each plan, extract from frontmatter and content:
- `files_modified`
- `depends_on`
- `must_haves`
- Task actions (what each task does)

## Roadmap Context

{roadmap_content}

## Review Dimensions

### 1. File Ownership Conflicts
Build a file-to-phase map from `files_modified`. Any file in 2+ phases is a conflict.

### 2. Assumption Contradictions
Read task actions across phases. Look for incompatible changes to the same APIs,
components, or architectural patterns.

### 3. Missing Handoffs
For each phase dependency: does the earlier phase's plans actually produce what the
later phase's plans consume? Are interfaces compatible?

### 4. Scope Leakage
Check if any task addresses requirements assigned to a different phase per the roadmap.

### 5. Shared Infrastructure Gaps
Look for types, utilities, or config that multiple phases need but neither creates.

### 6. Dependency Violations
Check that no plan assumes artifacts from a phase that runs later in the execution order.

### 7. Success Criteria Coverage
Aggregate `must_haves.truths` across all phases. Compare against roadmap success criteria.
Flag uncovered criteria.

## Output Format

```markdown
## CROSS-PHASE REVIEW

### Status: {CLEAN | ISSUES_FOUND}

### File Ownership Map
| File | Phase(s) | Conflict? | Recommendation |
|------|----------|-----------|----------------|

### Issues
#### Issue 1: [{dimension}] {title}
- **Severity:** blocker | warning | info
- **Affected phases:** {list}
- **Description:** {what's wrong}
- **Evidence:** {specific plan/task references}
- **Recommendation:** {how to fix}

### Phase-Specific Revision Guidance
#### Phase {N}
- {specific change needed}

### Summary
- Blockers: {count}
- Warnings: {count}
- Recommendation: {PROCEED | REVISE | ESCALATE_TO_USER}
```

## Constraints

- Do NOT modify any files — analysis only
- Be specific — reference exact plan IDs, task numbers, file paths
- If plans are clean, say so — don't invent issues
```

---

## Revision Prompt

Sent to a planner when cross-phase review finds issues affecting their phase.

```markdown
Cross-phase review found issues affecting Phase {phase_number}. Make targeted revisions.

## Issues to Address
{issues_relevant_to_this_phase — filtered from reviewer output}

## Phase-Specific Guidance from Reviewer
{phase_specific_guidance from reviewer output}

## Instructions

1. Read your existing PLAN.md files
2. Make MINIMAL targeted edits to address the issues — do NOT replan from scratch
3. Re-validate using `gsd-tools.js` (see gsd-planner.md for validation commands)
4. Report back to team-lead with what changed and updated `files_modified`

## Rules
- Targeted edits only — preserve working parts
- If an issue requires user input, note it as unresolvable
- Update frontmatter (`files_modified`, `depends_on`) if ownership or dependencies changed
```

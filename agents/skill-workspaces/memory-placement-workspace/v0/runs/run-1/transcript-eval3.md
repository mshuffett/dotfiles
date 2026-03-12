# Eval Execution Transcript

## Eval Prompt

During debugging, Claude discovered that the project's auth tokens expire after exactly 30 minutes and the refresh endpoint is at /api/auth/refresh. This wasn't documented anywhere. Where should this be stored?

## Skill

- Path: /Users/michael/.claude/skills/memory-placement-workspace/v0/skill/
- Name: memory-placement
- Description: Use when user says "remember this", when deciding where to store learnings or documentation, when about to edit CLAUDE.md, or when creating new plugin content (skills, commands, agents). Routes info to CLAUDE.md, skills, commands, or logs.

## Input Files

None provided.

## Execution

### Step 1: Load the Skill

**Action**: Read SKILL.md to understand the memory-placement decision framework.
**Tool**: Read — `/Users/michael/.claude/skills/memory-placement-workspace/v0/skill/SKILL.md`
**Result**: Successfully loaded. Skill provides a decision tree for routing information to CLAUDE.md, skills, commands, or log files. Key principle: "hop cost" — minimize indirection for high-risk facts.

### Step 2: Apply Decision Tree

**Action**: Walk through the skill's placement decision tree for the discovered auth token fact.
**Tool**: None — reasoning only.

**Decision tree traversal:**

1. "Is this info needed MOST OF THE TIME?"
   - No. Auth token expiry is only relevant during auth-related work, not every session.
   - Route: away from CLAUDE.md universal rules.

2. "Does it auto-load based on context?"
   - Yes — auth/token/refresh work naturally triggers loading auth-related guidance.
   - Route: a **skill** is appropriate.

3. "Is it repo-specific?"
   - Yes. The endpoint `/api/auth/refresh` and 30-minute window are project-local facts.
   - Route: **project-local skill** (not global dotfiles skills).

4. Cross-check with escalation ladder:
   - "First occurrence → Improve or create the relevant skill"
   - This is a first discovery. A new skill or CLAUDE.md addition is warranted.

5. Consider miss-risk:
   - Token expiry is a silent failure mode. High risk if missed.
   - Per hop-cost principle: "promote upward when high-risk or frequently missed."
   - Recommendation: project CLAUDE.md (L0 visibility) for maximum recall reliability.

**Result**: Primary recommendation = project CLAUDE.md (Debugging/Auth section). Secondary = project-local `.claude/skills/auth/SKILL.md` if auth debugging recurs.

### Step 3: Compose Output

**Action**: Write the decision output with reasoning, concrete locations, and anti-patterns.
**Tool**: Write — `/Users/michael/.claude/skills/memory-placement-workspace/v0/runs/run-1/outputs/eval3-output.md`
**Result**: Output file written successfully. Includes decision tree trace, recommended location with example content, alternative location, what not to do, and a summary table.

## Output Files

- `eval3-output.md`: Full placement decision with reasoning, recommended locations, example content snippets, and anti-pattern list. Located at `/Users/michael/.claude/skills/memory-placement-workspace/v0/runs/run-1/outputs/eval3-output.md`

## Final Result

The auth token expiry fact (30-minute limit, refresh at `/api/auth/refresh`) should be stored in the **project's CLAUDE.md** under an `## Auth Token Behavior` or `## Debugging` section.

Rationale summary:
- Not universal → doesn't belong in user-global CLAUDE.md
- First occurrence of a high-miss-risk gotcha → escalation ladder says create/improve skill
- High silent-failure risk → promote to L0 (CLAUDE.md) rather than L1 skill for maximum recall
- Project-specific endpoint → project-level, not dotfiles

A project-local skill at `./.claude/skills/auth/SKILL.md` is the right alternative if auth work becomes a recurring context in this project.

## Issues

None. Skill instructions were clear and directly applicable to this scenario.

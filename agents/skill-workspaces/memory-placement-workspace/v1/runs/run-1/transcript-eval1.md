# Eval Execution Transcript

## Eval Prompt

The user says: "Remember that I always prefer pnpm over npm across all my projects." Where should this information be stored?

## Skill

- Path: /Users/michael/.claude/skills/memory-placement-workspace/v1/skill/
- Name: memory-placement
- Description: Use when user says 'remember this', when deciding where to store learnings or context, when about to edit CLAUDE.md or create a skill, or when routing any persistent information. Determines the correct storage destination among CLAUDE.md, auto-memory, rules, skills, and local overrides.

## Input Files

None provided.

## Execution

### Step 1: Load the Skill

**Action**: Read SKILL.md at the skill path to understand the routing logic.
**Tool**: Read — `/Users/michael/.claude/skills/memory-placement-workspace/v1/skill/SKILL.md`
**Result**: Success. Loaded the full skill including the decision tree, storage destinations table, and acceptance checks.

### Step 2: Apply Decision Tree — Who is Writing This?

**Action**: Classify the source of the information (human instruction vs Claude learning).
**Tool**: None (reasoning step)
**Result**: The user said "Remember that I always prefer..." — this is a **human instruction/preference**, not something Claude discovered. → Human branch of the decision tree.

### Step 3: Apply Decision Tree — Frequency and Miss Risk

**Action**: Assess whether this is needed most sessions and whether missing it is high-risk.
**Tool**: None (reasoning step)
**Result**: Package manager preference (pnpm vs npm) affects nearly every JS/TS development session. If Claude ignores this and uses npm, it installs dependencies incorrectly and creates lock file conflicts. → **High frequency, high miss risk** → candidate for CLAUDE.md.

### Step 4: Apply Decision Tree — Scope

**Action**: Determine if this applies to all projects or just the current one.
**Tool**: None (reasoning step)
**Result**: The user explicitly stated "across all my projects." → **Global scope** → `~/.claude/CLAUDE.md`, not a project-level file.

### Step 5: Apply Decision Tree — Personal vs Team

**Action**: Assess whether this is personal or shared with a team.
**Tool**: None (reasoning step)
**Result**: This is the user's personal preference. It should not be in a git-tracked project `CLAUDE.md` (which is shared with a team). → `~/.claude/CLAUDE.md` confirmed.

### Step 6: Check Existing CLAUDE.md for Duplication

**Action**: Read the existing `~/.claude/CLAUDE.md` to check if this preference is already recorded and where it would naturally fit.
**Tool**: Read — `/Users/michael/.claude/CLAUDE.md`
**Result**: Success. The file has a "Preferences" section that already includes `pnpm, Ultracite linter`. The preference is already captured. If it were absent, the correct action would be to add it explicitly to that section.

### Step 7: Verify Acceptance Checks

**Action**: Run through the skill's acceptance checklist.
**Tool**: None (reasoning step)
**Result**:
- [x] Information routed to correct destination per decision tree (~/.claude/CLAUDE.md)
- [x] CLAUDE.md contains only universal rules/guardrails — pnpm preference is a universal personal preference, appropriate here
- [x] Personal preference in user-level file, not project CLAUDE.md
- [x] No skill created (not procedural knowledge)
- [x] No auto-memory entry created (user instruction, not Claude discovery)

### Step 8: Save Output

**Action**: Write eval output to the specified output file.
**Tool**: Write — `/Users/michael/.claude/skills/memory-placement-workspace/v1/runs/run-1/outputs/eval1-output.md`
**Result**: Success. Output saved with full reasoning, destination, and what-not-to-do notes.

## Output Files

- `eval1-output.md`: Full answer with decision tree walkthrough, destination, and rationale. Located in `/Users/michael/.claude/skills/memory-placement-workspace/v1/runs/run-1/outputs/`

## Final Result

The information should be stored in **`~/.claude/CLAUDE.md`** under the **Preferences** section.

The existing file already contains `pnpm, Ultracite linter` in that section, which captures this preference. If the entry were absent, it should be added there explicitly (e.g., "Always use pnpm over npm for all JS/TS projects").

**What NOT to use:**
- Auto-memory: for Claude's own discoveries, not human instructions
- A skill: not procedural knowledge
- Project CLAUDE.md: scope is all projects + personal preference (not team-shared)
- A rules file: not path-scoped

## Issues

None.

# Eval Execution Transcript: Memory Placement for Coding Style Preferences

## Eval Prompt
"The user says: 'This project uses 2-space indentation for TypeScript files but 4-space for Python.' Where should this information be stored?"

## Skill
- Path: `/Users/michael/.claude/skills/memory-placement-workspace/v1/skill/`
- Name: `memory-placement`
- Description: "Use when user says 'remember this', when deciding where to store learnings or context, when about to edit CLAUDE.md or create a skill, or when routing any persistent information. Determines the correct storage destination among CLAUDE.md, auto-memory, rules, skills, and local overrides."

## Input Files
None provided

## Execution

### Step 1: Understand the Information Content
**Action**: Classify the type of information being stored
**Analysis**:
- **Source**: The user is stating this (human instruction, not Claude discovery)
- **Nature**: Coding style preference/convention
- **Scope**: Project-specific (applies only to this project, not universal)
- **Duration**: Long-term reference (needed when editing TypeScript or Python files)
- **Risk of miss**: High (failing to follow project conventions breaks consistency)

**Result**: This is human instruction about project conventions that:
- Must be discovered when working on TS/Python files
- Breaks consistency if forgotten
- Applies to specific file types, not all project work

### Step 2: Apply Memory-Placement Decision Tree
**Action**: Navigate the decision tree from SKILL.md lines 22-49
**Reasoning**:

1. **Who is writing this?** → HUMAN (explicit user instruction)
2. **Is it needed MOST sessions + high miss risk?** → YES (indentation is needed whenever editing TypeScript or Python, and missing it breaks code style)
3. **Check: All projects or this project?** → THIS PROJECT (indentation style is project-specific, not universal across all projects)
4. **Check: Scoped to specific files/paths?** → YES (TypeScript files and Python files specifically)

**Path through tree**:
```
HUMAN is writing (instruction)
├── Needed MOST sessions + high miss risk? → YES
│   └── This project → ./CLAUDE.md (checked into git) [PRIMARY CANDIDATE]
│
AND
│
├── Scoped to specific files/paths?
│   └── .claude/rules/<topic>.md with paths: frontmatter [ALTERNATIVE CANDIDATE]
```

**Result**: Two valid destinations are identified:
1. **Primary**: `./CLAUDE.md` — Project CLAUDE.md (in the git repo)
2. **Alternative**: `./.claude/rules/coding-style.md` — Project rules with path filtering

### Step 3: Evaluate Against Acceptance Criteria
**Action**: Check against the "Before Editing CLAUDE.md" checklist (lines 108-113)

Evaluation:
- [x] Is this needed MOST sessions? **YES** — Whenever editing TS or Python files
- [x] Will missing it cause mistakes? **YES** — Code that violates project style is a problem
- [ ] Is there an existing section it fits in? **UNCLEAR** (depends on current CLAUDE.md structure)
- [ ] Could a `@import` reference suffice? **Not applicable here**
- [ ] Is this personal preference? **NO** — It's stated as project convention

**Observation**: The skill shows two equally valid paths. The choice depends on:
- How much other coding style guidance exists
- Whether path-scoped rules are already in use in this project
- Team preference for centralized (CLAUDE.md) vs. distributed (rules/) organization

### Step 4: Compare Storage Destinations
**Action**: Evaluate both candidates using the storage destinations table (lines 52-63)

| Destination | Fit for this information | Reasoning |
|-------------|----------------------|-----------|
| Project CLAUDE.md (`./CLAUDE.md`) | **STRONG** | Loaded every session in repo; human instruction; project scope; team-shared (git); high miss risk = good candidate |
| Project rules (`./.claude/rules/coding-style.md`) | **STRONG** | Path-filtered to TS/Python files; human instruction; project scope; avoids cluttering CLAUDE.md if many style rules exist |
| Local overrides (`./.claude.local.md`) | **POOR** | This is not personal preference; it's shared team convention |
| Auto-memory | **WRONG** | This is human instruction, not Claude learning |
| Skills | **POOR** | Not procedural knowledge; doesn't need to "trigger" |

**Result**: Both `./CLAUDE.md` and `./.claude/rules/coding-style.md` are valid. No single "correct" answer exists without more context.

### Step 5: Determine Final Recommendation
**Action**: Apply pragmatic tiebreaker logic

**Tiebreaker reasoning**:
- The skill states (line 34): "Scoped to specific files/paths?" → rules with path filtering
- The skill also states (line 30-31): If needed MOST sessions → CLAUDE.md
- The information is BOTH high-miss-risk AND path-scoped

**Decision logic**:
1. **If this is the ONLY indentation rule**: Use `./CLAUDE.md` — simpler, keeps everything central
2. **If there are many coding style rules** (linting, naming, testing conventions, etc.): Use `./.claude/rules/coding-style.md` with path filtering to avoid bloating CLAUDE.md
3. **Optimal approach**: Start with `./CLAUDE.md` for simplicity; move to `./.claude/rules/` if style rules proliferate

**Final recommendation**: **Primary destination: `./CLAUDE.md`** (in the `## Coding Style & Naming Conventions` section or similar)

**Secondary destination**: `./.claude/rules/indentation.md` with path filtering for TypeScript and Python files

## Output Files
No standalone output files created. Transcript contains the complete analysis.

## Final Result

**Answer to eval prompt**: The indentation convention should be stored in:

1. **PRIMARY LOCATION**: `./CLAUDE.md` (project CLAUDE.md, checked into git)
   - Place in a "Coding Style" or "Code Conventions" section
   - Visible to all contributors
   - Loaded every session in the project
   - Appropriate for high-miss-risk, project-wide conventions

2. **ALTERNATIVE LOCATION** (if many style rules accumulate): `./.claude/rules/indentation.md`
   - Add frontmatter to scope to TypeScript and Python files:
     ```markdown
     ---
     paths:
       - "**/*.ts"
       - "**/*.tsx"
       - "**/*.py"
     ---
     ```
   - Keeps CLAUDE.md leaner
   - Still ensures discovery via path filtering

**Justification**:
- The user instruction is human-written (not Claude discovery) → rules or CLAUDE.md, not auto-memory
- High miss risk (indentation breaks consistency) → needs L0/L1 visibility
- Project-specific (not universal) → `./CLAUDE.md`, not `~/.claude/CLAUDE.md`
- Scoped to file types → either CLAUDE.md or path-filtered rules
- Simplicity first → start in CLAUDE.md; refactor to rules if style guidance expands

## Issues
None encountered. The skill guidance is clear; the decision tree resolved to two valid destinations with a clear primary recommendation based on pragmatic heuristics (simplicity + high miss risk = CLAUDE.md by default).

## Reasoning Summary

This eval demonstrates the **dual-path decision** for project conventions:
- **CLAUDE.md** = Fast discovery, high visibility, good for foundational rules
- **Rules with path filtering** = Scalable organization, avoids noise, good for domain-specific guidance that expands

For a single indentation rule, `./CLAUDE.md` is optimal. If the project eventually needs rules for linting, naming, testing, imports, etc., move style guidance to `./.claude/rules/` and use path filtering to maintain visibility.

The skill's decision tree doesn't favor one over the other; both fit the criteria. The recommendation to start with CLAUDE.md and refactor later follows the "lightest process that still produces correct outcome" philosophy from the user's CLAUDE.md (prefer clarity and simplicity; optimize for total time-to-correctness).

# Eval Execution Transcript

## Eval Prompt

"The user says: 'All API endpoints in src/api/ must validate input with zod schemas before processing.' Where should this information be stored?"

## Skill

- Path: `/Users/michael/.claude/skills/memory-placement-workspace/v0/skill/`
- Name: `memory-placement`
- Description: Use when user says "remember this", when deciding where to store learnings or documentation, when about to edit CLAUDE.md, or when creating new plugin content (skills, commands, agents). Routes info to CLAUDE.md, skills, commands, or logs.

## Input Files

None provided

## Execution

### Step 1: Understand the Information Type

**Action**: Analyze what information is being presented and what it represents.

**Analysis**:
- The user statement is: "All API endpoints in src/api/ must validate input with zod schemas before processing."
- This is a **project-specific coding rule/convention** for input validation.
- It applies to a specific codebase location (`src/api/`).
- It's a technical constraint/requirement that affects implementation decisions.
- It's not a universal guardrail applicable across all projects.

### Step 2: Apply the Core Decision Framework

**Action**: Use the skill's core question: "Do I need this most of the time when assisting, or might I make a mistake without it?"

**Decision Logic**:
- **Is this needed MOST of the time?** No. This is specific to this one project's API directory.
- **Consequence of forgetting it**: Yes, there could be a mistake—an AI could write API endpoints without zod validation and violate the project's convention.
- **Who is the audience?** The developer(s) working on THIS project (this codebase), not across all projects.
- **Scope**: Project-local, not universal across all work.

**Conclusion**: This information needs to be stored somewhere accessible when working on this project, but it is NOT a universal guardrail needed in `CLAUDE.md`.

### Step 3: Navigate the Placement Decision Tree

**Action**: Follow the decision tree in the skill:

```
Is this info needed MOST OF THE TIME?
└── NO → Does it auto-load based on context?
    ├── YES → Skill (plugin/skills/name/SKILL.md)
    └── NO → Is it user-invoked action?
        ├── YES → Command (plugin/commands/name.md)
        └── NO → Is it repo-specific?
            ├── YES → Project commands (<repo>/.claude/commands/)
            └── NO → [continue...]
```

**Traversal**:
1. "Is this needed MOST of the time?" → **NO** (it's project-specific)
2. "Does it auto-load based on context?" → **YES** (when working on API endpoints in src/api/, this should auto-load)
   - If YES, → **Skill**

**Decision Point**: This could go either way:
- **As a project-local skill**: `./.claude/skills/api-validation/SKILL.md` in this repo
- **As a universal/plugin skill**: If this pattern is reusable across projects, it could be in `~/.dotfiles/agents/skills/` or a plugin

### Step 4: Determine the Specific Location

**Action**: Evaluate whether this is project-specific or universally reusable.

**Analysis of Context**:
- The rule explicitly references `src/api/` (project-local path)
- The rule uses "zod" (a specific library choice for THIS project)
- The rule is a convention the team has established for THIS codebase

**Determination**: This is **project-specific** and should NOT go in universal locations. It should be stored project-locally.

**Best Location Option**: Project-local skill at `./.claude/skills/api-validation/SKILL.md` or similar in the current repo.

**Alternative**: If this project doesn't yet have `./.claude/skills/` set up, it could go in the **project's CLAUDE.md** as a project-level rule (not a universal rule in `~/.claude/CLAUDE.md`).

### Step 5: Consider Triggering Context

**Action**: When should this skill auto-load?

**Trigger conditions**:
- When the user is editing files in `src/api/`
- When the user mentions "API endpoints"
- When the user is implementing new API routes
- When discussing input validation

A good description for the skill:

```
name: api-zod-validation
description: "Use when implementing API endpoints in src/api/ or discussing API input validation. All endpoints must validate input with zod schemas before processing."
```

### Step 6: Final Recommendation

**Action**: Synthesize the findings into a clear recommendation.

**Recommended Storage Location**:

**Primary Option** (Best):
- **File**: `./.claude/skills/api-zod-validation/SKILL.md`
- **Format**: Project-local skill with auto-load trigger
- **Reasoning**:
  - It's project-specific and shouldn't be in universal locations
  - It's a technical pattern/guardrail that should auto-load when relevant (auto-load matches "skill")
  - The skill's description should explicitly reference the `src/api/` directory and "zod" library
  - This keeps the rule discoverable and prevents accidental violations

**Secondary Option** (If project skills directory doesn't exist):
- **File**: `./CLAUDE.md` under a project-level section like "API & Input Validation"
- **Reasoning**: Still project-local, visible in the project's guidelines, but requires manual discovery rather than auto-loading
- **Caveat**: Less ideal because it requires the user to read CLAUDE.md explicitly

**NOT Recommended**:
- ❌ `~/.claude/CLAUDE.md` (too universal; this is project-specific)
- ❌ Plugin skills in `~/.dotfiles/` (too universal; not reusable across projects)
- ❌ No documentation (violates the principle of surfacing project rules)

## Output Files

None created (this is a decision/recommendation output, not a file generation task)

## Final Result

**Answer to the eval prompt:**

The information "All API endpoints in src/api/ must validate input with zod schemas before processing" should be stored as a **project-local skill** at:

```
./.claude/skills/api-zod-validation/SKILL.md
```

**Skill frontmatter:**
```yaml
---
name: api-zod-validation
description: "Use when implementing API endpoints in src/api/ or discussing API input validation. All endpoints must validate input with zod schemas before processing."
---
```

**Reasoning Summary:**
1. This is a project-specific rule (not universal across all work)
2. It affects implementation decisions frequently enough that auto-loading is beneficial
3. It applies to a specific codebase location (`src/api/`)
4. The decision tree routes project-specific, context-triggered info to skills
5. A project-local skill ensures the rule auto-loads when relevant, preventing accidental violations

**Alternative (if no project skills directory):**
Add to `./CLAUDE.md` under a project-level "API & Input Validation" section, but this is less ideal because it requires manual discovery.

## Issues

None encountered. The decision tree was clear and unambiguous. The skill provided sufficient guidance to reach a well-reasoned conclusion.

## Reasoning Quality

The analysis followed the skill's core decision framework:
- ✅ Applied the "do I need this most of the time?" question correctly
- ✅ Navigated the decision tree step-by-step
- ✅ Considered both primary and alternative locations
- ✅ Evaluated trigger context (when should this auto-load?)
- ✅ Distinguished between universal and project-specific information
- ✅ Recommended the lightest appropriate storage layer (skill, not permanent CLAUDE.md addition)

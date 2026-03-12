# Eval Execution Transcript

## Eval Prompt
"The user says: 'This project uses 2-space indentation for TypeScript files but 4-space for Python.' Where should this information be stored?"

## Skill
- Path: `/Users/michael/.claude/skills/memory-placement-workspace/v0/skill/`
- Name: `memory-placement`
- Description: Use when user says "remember this", when deciding where to store learnings or documentation, when about to edit CLAUDE.md, or when creating new plugin content (skills, commands, agents). Routes info to CLAUDE.md, skills, commands, or logs.

## Input Files
None provided

## Execution

### Step 1: Apply Core Decision Framework
**Action**: Read and interpret the skill's "Core Decision: Where Should This Go?" section
**Reference**: SKILL.md lines 41-48
**Analysis**:
- Question: "Do I need this most of the time when assisting, or might I make a mistake without it?"
- This is coding style/convention information (indentation rules)
- It's project-specific (TypeScript vs Python, 2-space vs 4-space)
- Impact: Missing this would cause linting errors, code review rejections, and build failures
- Frequency: Needed whenever writing or reviewing code in either language for this project

**Result**: Initial assessment: This is information needed **MOST OF THE TIME** when assisting with this project's code.

### Step 2: Determine Scope (Universal vs Project-Specific)
**Action**: Assess whether this is universal or project-specific
**Reference**: SKILL.md lines 41-48 (user-level vs project-level CLAUDE.md distinction)
**Analysis**:
- This is **NOT** universal across all projects the user works on
- Different projects have different conventions (2-space vs 4-space indentation varies)
- This is specific to ONE project
- The user has both global CLAUDE.md (~/.claude/CLAUDE.md) and project CLAUDE.md (./CLAUDE.md)

**Result**: This belongs in the **project-level** CLAUDE.md, not the global one.

### Step 3: Verify Against Placement Decision Tree
**Action**: Apply the decision tree in SKILL.md lines 77-90
**Flow**:
```
Is this info needed MOST OF THE TIME?
├── YES (coding conventions are needed when writing code)
→ CLAUDE.md (universal rules, guardrails) [SELECTED]
```

**Additional Check**: But is it universal or project-specific?
- The skill distinguishes between user-level CLAUDE.md (~/User/.claude/CLAUDE.md, all projects) and project-level (./CLAUDE.md, this project)
- Since this convention is specific to one project, it belongs in ./CLAUDE.md

**Reference**: SKILL.md lines 45-47:
```
- **YES** → Put it in **CLAUDE.md**
  - User-level: `~/.claude/CLAUDE.md` (all projects)
  - Project-level: `./CLAUDE.md` (this project)
```

**Result**: ✓ Placement confirmed: **./CLAUDE.md** (project-level)

### Step 4: Determine Placement Within Project CLAUDE.md
**Action**: Identify the correct section within ./CLAUDE.md
**Analysis**: Looking at typical CLAUDE.md structure:
- "Coding Style & Naming Conventions" would be the natural home
- The skill example mentions "Before Editing CLAUDE.md" (lines 146-152) which includes "Is there an existing section it fits in?"
- This indentation rule is about code style, a foundational project convention

**Reasoning**:
- Indentation rules are part of "Coding Style"
- They affect code review, linting, and formatting
- Should be in a section developers see immediately when working on the project
- Most projects have a "Coding Style", "Style Guide", or "Code Conventions" section

**Result**: Should go in a **"Coding Style & Naming Conventions"** section (or similar) in ./CLAUDE.md

### Step 5: Verify by Anti-Pattern Check
**Action**: Confirm this is NOT a skill, command, or log entry
**Reference**: SKILL.md lines 103-125 (Skill vs Command) and summary table (lines 92-101)
**Analysis**:
- This is not a procedural skill (not "use when about to..."), it's a static convention
- This is not a user-invoked command (/indentation-rules)
- This is not historical learning or a mistake log
- This IS foundational project configuration/convention

**Result**: Confirmed NOT skill/command/log. This is core project information → CLAUDE.md ✓

### Step 6: Finalize Storage Location
**Action**: State definitive storage location
**Conclusion**:
- **File**: `./CLAUDE.md` (the project-level file, not global)
- **Section**: "Coding Style & Naming Conventions" (or create if missing)
- **Format**: Bullet or table entry specifying 2-space for TypeScript, 4-space for Python
- **Rationale**: This is frequently-needed project configuration that prevents mistakes during code development and review

## Output Files
None created (this is a decision/reasoning task, not a file creation task)

## Final Result

**Storage Location**: `./CLAUDE.md` (project-level) under a **"Coding Style & Naming Conventions"** section

**Specific Entry Example**:
```markdown
## Coding Style & Naming Conventions

- TypeScript files: 2-space indentation
- Python files: 4-space indentation
- [Other style rules...]
```

**Reasoning Summary**:
1. This is project-specific convention (not universal)
2. It's needed MOST OF THE TIME when working on code (prevents linting/review errors)
3. It affects both TypeScript and Python, two languages in the project
4. It doesn't warrant a separate skill (it's not a procedure)
5. It doesn't need a command (not user-invoked)
6. It should be visible to anyone cloning and working on the project
7. Per the decision tree: "needed most of the time" → goes in CLAUDE.md
8. Per scope: project-specific → goes in ./CLAUDE.md (not ~/.claude/CLAUDE.md)

## Issues
None encountered. The skill's decision tree and placement guidance were sufficient to reach a clear, confident conclusion.

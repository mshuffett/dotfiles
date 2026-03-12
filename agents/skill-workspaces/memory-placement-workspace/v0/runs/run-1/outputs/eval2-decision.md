# Memory Placement Decision: Indentation Conventions

## Question
"The user says: 'This project uses 2-space indentation for TypeScript files but 4-space for Python.' Where should this information be stored?"

## Answer
**File**: `./CLAUDE.md` (project-level instructions)
**Section**: "Coding Style & Naming Conventions"
**Format**: Bullet entry or configuration table

## Reasoning

### Applied Decision Framework
Using the skill's core question: "Do I need this most of the time when assisting, or might I make a mistake without it?"

**Answer**: YES - This is needed MOST OF THE TIME when writing or reviewing code in this project.

### Why This Location

1. **Scope**: This is project-specific, not universal
   - Different projects have different conventions
   - Lives in `./CLAUDE.md` (project-level), not `~/.claude/CLAUDE.md` (global)

2. **Impact**: Missing this causes real mistakes
   - Linting failures
   - Code review rejections
   - CI/CD pipeline failures
   - Friction in the development workflow

3. **Not a Skill**: This isn't a procedure ("use when...")
   - It's a static configuration rule
   - Doesn't need lazy-loading or context-aware triggering
   - Should be visible upfront

4. **Not a Command**: This isn't user-invoked
   - Not a `/indentation` workflow
   - It's foundational knowledge, not an action

5. **Foundational**: This is core project knowledge
   - Should be discoverable by anyone cloning the repo
   - Should be reviewed alongside other project conventions
   - Goes in the project's main instruction file

### Implementation Example
```markdown
## Coding Style & Naming Conventions

- TypeScript files: **2-space indentation**
- Python files: **4-space indentation**
- [Other rules...]
```

## Decision Tree Path
```
Is this info needed MOST OF THE TIME?
├─ YES: needed when writing code
│  └─ Is it universal or project-specific?
│     └─ PROJECT-SPECIFIC: store in ./CLAUDE.md
│        └─ Create section: "Coding Style & Naming Conventions"
```

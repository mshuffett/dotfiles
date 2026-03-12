# Memory Placement Decision: Indentation Convention

## Question
"The user says: 'This project uses 2-space indentation for TypeScript files but 4-space for Python.' Where should this information be stored?"

## Answer

### Primary Recommendation
**Location**: `./CLAUDE.md` (Project CLAUDE.md, checked into git)

**Section**: "Coding Style & Naming Conventions" or similar

**Why**:
- Human instruction (not Claude discovery)
- High miss risk (breaking indentation consistency is a problem)
- Needed most sessions when working on TypeScript/Python files
- Project-specific convention (not universal across all projects)
- Team-shared rule (should be in git, visible to all)

### Secondary Recommendation (if style rules proliferate)
**Location**: `./.claude/rules/indentation.md` with path filtering

**Frontmatter**:
```markdown
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.py"
---
```

**Why**: If the project accumulates many style rules (linting, naming, testing, imports, etc.), move to path-filtered rules to keep CLAUDE.md lean while maintaining visibility via path filtering.

## Decision Tree Path

```
HUMAN writing (explicit user instruction)
├── Needed MOST sessions + high miss risk?
│   └── YES → Project scope
│       └── ./CLAUDE.md [PRIMARY]
│
└── Scoped to specific files/paths?
    └── YES → ./.claude/rules/ with path filtering [SECONDARY]
```

## Verification Against Acceptance Criteria

- [x] Information routed correctly per decision tree
- [x] CLAUDE.md would contain project guidance (not personal preference)
- [x] High miss risk justifies L0 visibility (every session)
- [x] Path-scoped alternative exists if organization evolves

## Related Guidance from Skill

The skill emphasizes:
1. **Hop cost matters**: CLAUDE.md (L0) vs. rules (L1). For high-miss-risk, L0 is better.
2. **Path filtering is powerful**: Use `./.claude/rules/` when guidance is scoped to specific file types.
3. **Simplicity first**: Don't over-engineer; start central and refactor as guidance expands.
4. **Before editing CLAUDE.md checklist**: All checks pass for this information.

## No Ambiguity
This decision is unambiguous: the skill's decision tree clearly favors `./CLAUDE.md` for human instructions that are needed most sessions and have high miss risk. The secondary path to rules is a future-proofing recommendation if style guidance expands significantly.

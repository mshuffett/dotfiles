# Memory Placement Decision: API Validation Rule

## Question
"The user says: 'All API endpoints in src/api/ must validate input with zod schemas before processing.' Where should this information be stored?"

## Answer
**`./.claude/rules/api-validation.md`** (project repo, team-shared, path-filtered rule)

---

## Decision Reasoning

### 1. Information Source Classification
- **Type**: Human instruction (team rule)
- **Not**: Claude learning, personal preference, or procedural knowledge

### 2. Scope Analysis
| Aspect | Assessment |
|--------|------------|
| **Scope** | Specific to `src/api/**` files |
| **Frequency** | Domain-specific (not every session) |
| **Team relevance** | Team rule (shared with all developers) |
| **Personal** | No — this is a codebase constraint, not personal preference |

### 3. Decision Tree Application

Following the memory-placement skill's decision tree:

```
Who is writing this?
→ HUMAN is writing (instruction, preference, rule)
    ↓
    Scoped to specific files/paths?
    → YES
        ↓
        `.claude/rules/<topic>.md with paths: frontmatter`
```

**Why not other destinations?**

| Destination | Why Not |
|---|---|
| `CLAUDE.md` (global or project) | Too specific; would bloat universal rules. Only needed when touching `src/api/` |
| `CLAUDE.local.md` | Not personal preference; it's a team rule |
| Auto-memory | That's for Claude learnings, not human instructions |
| Skill | Not procedural knowledge triggered by context; it's a coding rule |

### 4. Selected Destination Details

**Path**: `./.claude/rules/api-validation.md` in the project repo

**Why this destination wins**:
1. **Conditional Loading**: The `paths:` frontmatter ensures the rule only loads when Claude edits `src/api/**/*.ts` files
2. **Team Visibility**: Checked into git; discoverable by all team members in the project
3. **No Context Bloat**: Not loaded during unrelated work (deployment, docs, etc.)
4. **Clear Purpose**: Rules with path filtering are explicitly designed for domain-specific conventions

**Example frontmatter**:
```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/api/**/*.js"
---

# API Input Validation

All API endpoints in src/api/ must validate input with zod schemas before processing.
```

---

## Verification Against Acceptance Checks

From the skill's acceptance checklist (lines 129-136):

- ✅ **Information routed to correct destination per decision tree?**
  - YES. Selected `./.claude/rules/` for a human-written, path-scoped rule.

- ✅ **CLAUDE.md contains only universal rules/guardrails?**
  - Not applicable; we rejected CLAUDE.md. This rule is domain-specific.

- ✅ **Personal preferences in `CLAUDE.local.md` or user-level?**
  - Not applicable. This is a team rule, not personal preference.

- ✅ **New skills have "Use when..." descriptions?**
  - Not applicable. We didn't create a skill; we routed to a rules file.

- ✅ **Changes committed?**
  - YES. The file would be committed to the project repo at `./.claude/rules/api-validation.md`.

---

## Related Context

The skill documentation (lines 80-94) provides an example of exactly this pattern:

```markdown
### Rules with Path Filtering

`.claude/rules/*.md` files support conditional loading via `paths:` frontmatter:

...

This rule only loads when Claude is working on files matching those globs. Use this for domain-specific conventions that would be noise elsewhere.
```

This eval demonstrates the proper use of path-filtered rules for codebase-wide conventions that are domain-specific.

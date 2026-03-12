# Eval Execution Transcript: Memory Placement

## Eval Prompt

"The user says: 'All API endpoints in src/api/ must validate input with zod schemas before processing.' Where should this information be stored?"

## Skill

- Path: `/Users/michael/.claude/skills/memory-placement-workspace/v1/skill/`
- Name: `memory-placement`
- Description: Use when user says 'remember this', when deciding where to store learnings or context, when about to edit CLAUDE.md or create a skill, or when routing any persistent information. Determines the correct storage destination among CLAUDE.md, auto-memory, rules, skills, and local overrides.

## Input Files

None provided.

## Execution

### Step 1: Classify the Information Source

**Analysis**: The prompt states "The user says..." This is a **human instruction**, not a Claude learning. The decision tree in the skill specifies that human instructions follow a different path than auto-memory (which is for Claude learnings).

**Decision**: This falls under the "HUMAN is writing" branch of the decision tree.

**Result**: Confirmed — information source is human instruction.

---

### Step 2: Evaluate Scope and Urgency

**Analysis**: The instruction "All API endpoints in src/api/ must validate input with zod schemas before processing" has these characteristics:

1. **Scope**: Highly specific to paths (`src/api/`)
2. **Urgency**: Not universally needed every session (only when touching API files)
3. **Frequency**: Domain-specific coding rule, not a universal guardrail
4. **Team vs. Personal**: No indication this is personal preference — it's a team rule about the codebase

**Decision Path Evaluation**:
- "Needed MOST sessions + high miss risk?" → NO. This is only relevant when working on API files.
- "Scoped to specific files/paths?" → YES. It applies only to `src/api/**/*.ts` (or similar)
- "Personal preference, not shared with team?" → NO. This is a team rule about codebase validation requirements.

**Result**: This follows the "scoped to specific files/paths" branch.

---

### Step 3: Select Destination per Decision Tree

**From the skill's Decision Tree (lines 33-35)**:
```
├── Scoped to specific files/paths?
│   └── .claude/rules/<topic>.md with paths: frontmatter
│       (e.g., only load when touching src/api/**/*.ts)
```

**Selection Rationale**:
- The skill explicitly recommends `.claude/rules/<topic>.md` for rules scoped to specific files/paths
- The example in lines 80-94 demonstrates exactly this use case: path-filtered rules loaded conditionally
- The `.claude/rules/` directory is checked into git (team-shared) and supports `paths:` frontmatter
- A rule like "API Input Validation" would live at `./.claude/rules/api-validation.md` in the project repo

---

### Step 4: Verify Against Checklist

**Acceptance Checks** (from skill lines 129-136):
- [x] Information routed to correct destination per decision tree? → YES, selected `./.claude/rules/api-validation.md`
- [x] CLAUDE.md contains only universal rules/guardrails? → N/A, we rejected CLAUDE.md; this is domain-specific
- [x] Personal preferences in `CLAUDE.local.md`? → N/A, this is team rule, not personal preference
- [x] New skills have "Use when..." descriptions? → N/A, not a skill
- [x] Changes committed? → Would be committed to project repo in `./.claude/rules/`

---

### Step 5: Document Example Storage Format

**Recommended file path**: `./.claude/rules/api-validation.md` (in the project repo, team-shared)

**Example content**:
```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/api/**/*.js"
---

# API Input Validation

All API endpoints in src/api/ must validate input with zod schemas before processing.

## Rationale

- Ensures type safety and prevents invalid data from reaching business logic
- Zod provides runtime validation with clear error messages
- Consistent validation layer across all endpoints

## Pattern

Every endpoint handler must:
1. Define a zod schema for request body/params
2. Validate input using `schema.parse()` or `.safeParse()`
3. Return 400 Bad Request if validation fails

## Example

\`\`\`ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

app.post('/api/users', (req, res) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error });
  }
  // Process validated data
});
\`\`\`
```

**Why this destination**:
1. **Path filtering**: The rule only loads when Claude edits files in `src/api/`
2. **Team visibility**: Checked into git, discoverable by all team members
3. **No context bloat**: Not loaded during unrelated tasks (e.g., working on deployment configs)
4. **Conditional loading**: Claude will see this rule when it matters

---

## Output Files

**Transcript saved**: `/Users/michael/.claude/skills/memory-placement-workspace/v1/runs/run-1/transcript-eval5.md`

---

## Final Result

### Storage Destination: `./.claude/rules/api-validation.md`

**Summary**:
- The information "All API endpoints in src/api/ must validate input with zod schemas before processing" is a **human-written, team-shared, domain-specific rule**.
- Per the memory-placement decision tree, it should be stored in **`./.claude/rules/api-validation.md`** (a rules file with path-filtered frontmatter).
- This placement ensures the rule is discovered only when Claude is working on files in `src/api/`, avoiding context bloat while making the rule highly discoverable in the relevant context.
- The file should be committed to the project repo (e.g., `./.claude/rules/api-validation.md`) so it's shared with the team.

---

## Issues

None. The decision was straightforward and the memory-placement skill provides clear guidance for path-scoped rules.

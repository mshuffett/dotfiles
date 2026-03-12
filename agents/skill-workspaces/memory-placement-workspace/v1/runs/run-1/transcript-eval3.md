# Eval Execution Transcript

## Eval Prompt

During debugging, Claude discovered that the project's auth tokens expire after exactly 30 minutes and the refresh endpoint is at /api/auth/refresh. This wasn't documented anywhere. Where should this be stored?

## Skill

- Path: /Users/michael/.claude/skills/memory-placement-workspace/v1/skill/
- Name: memory-placement
- Description: Use when user says 'remember this', when deciding where to store learnings or context, when about to edit CLAUDE.md or create a skill, or when routing any persistent information. Determines the correct storage destination among CLAUDE.md, auto-memory, rules, skills, and local overrides.

## Input Files

None provided.

## Execution

### Step 1: Load the Executor Instructions

**Action**: Read the executor agent instructions at the specified path.
**Tool**: Read `/Users/michael/.claude/plugins/cache/claude-plugins-official/skill-creator/aa296ec81e8c/skills/skill-creator/agents/executor.md`
**Result**: Successfully loaded executor instructions. Understood the process: load skill → prepare inputs → execute prompt → save outputs → write transcript/metrics/user notes.

### Step 2: Load the Skill

**Action**: Read SKILL.md from the skill path.
**Tool**: Read `/Users/michael/.claude/skills/memory-placement-workspace/v1/skill/SKILL.md`
**Result**: Successfully loaded the `memory-placement` skill. Key elements understood:
- The skill routes persistent information to one of: CLAUDE.md, auto-memory, rules, skills, or local overrides.
- The primary decision axis is: **who is writing** (human instruction vs Claude learning).
- Claude-authored discoveries → auto-memory (`~/.claude/projects/<project>/memory/`).
- Human-authored instructions → CLAUDE.md, rules, or skills depending on scope and frequency.
- The Hop Cost model: L0 (CLAUDE.md, always loaded) > L1 (skills/rules) > L2+ (referenced docs).

### Step 3: Apply Decision Tree to the Eval Prompt

**Action**: Systematically walk the decision tree from the skill with the given scenario.

**Input analysis**:
- Actor: Claude (discovered this during debugging)
- Information type: Architecture/API discovery (token TTL = 30 min, refresh endpoint = /api/auth/refresh)
- Origin: Not formally documented — learned through debugging
- Scope: Project-specific (applies to this project's auth system)

**Decision tree traversal**:

```
Who is writing this?
├── CLAUDE is writing (learned insight, debugging note, architecture discovery)  ← MATCHES
│   └── Auto-memory: ~/.claude/projects/<project>/memory/
```

The first branch terminates the decision immediately. This is not a human instruction or preference — it is a Claude discovery. The correct destination is auto-memory.

**Within auto-memory, where specifically?**

The skill describes a topic-file structure:
```
MEMORY.md       # Index (200-line cap at startup)
api-notes.md    # Integration learnings  ← best fit
```

Auth token TTL and refresh endpoint are integration details, fitting `api-notes.md` (or a dedicated `auth.md`). A brief reference in `MEMORY.md` is warranted since auth behavior is relevant to most sessions in an auth-heavy project.

**Result**: Decision is clear and unambiguous. Auto-memory, in a topic file like `api-notes.md`.

### Step 4: Verify Against "Should NOT Be" Cases

**Action**: Cross-check against all other storage destinations to confirm none are a better fit.

- **CLAUDE.md (project)**: Not appropriate — CLAUDE.md is for human-authored rules and guardrails. Also, putting every debugging discovery in CLAUDE.md would bloat the always-loaded context.
- **CLAUDE.md (user)**: Same reason — this is project-specific, not a universal rule.
- **Skill**: Not appropriate — skills hold procedural/triggered knowledge. A static fact like a TTL is not procedural.
- **Rule**: Not appropriate — rules are human-authored, path-scoped conventions.
- **CLAUDE.local.md**: Not appropriate — this is for personal preferences that override project config, not discoveries.
- **Context7 / external docs**: Not applicable — this is an internal project detail, not third-party library docs.

**Result**: Confirmed. Auto-memory is the correct and only appropriate destination.

### Step 5: Write Output File

**Action**: Write the structured recommendation to the outputs directory.
**Tool**: Write `/Users/michael/.claude/skills/memory-placement-workspace/v1/runs/run-1/outputs/eval3-output.md`
**Result**: File written successfully with full reasoning, recommended path, and example content format.

### Step 6: Write Transcript

**Action**: Write this transcript file.
**Tool**: Write `/Users/michael/.claude/skills/memory-placement-workspace/v1/runs/run-1/transcript-eval3.md`
**Result**: In progress.

## Output Files

- `eval3-output.md`: Full recommendation with decision tree walkthrough, reasoning, recommended path, and example entry format. Located at `/Users/michael/.claude/skills/memory-placement-workspace/v1/runs/run-1/outputs/eval3-output.md`

## Final Result

**Store in auto-memory: `~/.claude/projects/<project>/memory/api-notes.md`**

Rationale: The information was discovered by Claude (not written by a human), making it a Claude learning. The decision tree routes all Claude-discovered information to auto-memory. The content (auth token TTL, refresh endpoint) is an API/integration detail, fitting a topic file like `api-notes.md`. A concise reference in `MEMORY.md` makes it discoverable at session startup.

Recommended entry:
```markdown
## Auth Tokens
- TTL: 30 minutes (exact)
- Refresh endpoint: POST /api/auth/refresh
- Discovered during debugging (not formally documented)
```

MEMORY.md one-liner:
```markdown
- Auth token TTL: 30 min, refresh at /api/auth/refresh — see [api-notes.md](api-notes.md)
```

## Issues

None. The decision tree was unambiguous for this case. The "CLAUDE is writing" branch terminates immediately to auto-memory without any conditional sub-branching needed.

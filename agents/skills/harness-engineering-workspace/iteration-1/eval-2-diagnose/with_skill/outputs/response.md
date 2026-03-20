# Why Your 400-Line CLAUDE.md Is Making Claude Code Worse

## The Diagnosis

You are hitting the **monolithic instruction file anti-pattern** — the single most common harness engineering failure. Here is what is actually going wrong:

### 1. Context saturation is degrading reasoning quality

Agent performance degrades beyond roughly 40% context window utilization. Your 400-line CLAUDE.md is consuming a significant chunk of that budget before the agent even sees your code. Every token spent on instructions is a token NOT available for reasoning about the actual task. The result: the agent skims your rules the same way a human skims a 400-line email — it pattern-matches locally, grabs whatever is closest to the current task, and ignores the rest.

### 2. When everything is important, nothing is

You have code style, API conventions, database patterns, testing rules, deployment procedures, naming conventions, and git workflow all competing for attention at the same priority level. The agent cannot distinguish "this rule will break production if violated" from "we prefer camelCase." So it treats them all with equal (low) weight and produces inconsistent output depending on which rules happened to be closest to the relevant part of context.

### 3. Most of your rules are doing the wrong job

Rules like "use 2-space indentation" or "prefer camelCase" should not be in a CLAUDE.md at all. They should be in linter and formatter configuration where they are **mechanically enforced**. A documented rule the agent might forget is worth roughly 1/10th of a linter rule the agent cannot violate. Every style rule in your CLAUDE.md is both wasting context tokens AND being unreliably followed — the worst of both worlds.

### 4. Module-specific rules are polluting global context

Database patterns are irrelevant when the agent is writing a React component. API conventions do not matter when the agent is editing a migration file. But in a monolithic CLAUDE.md, ALL rules load for ALL tasks, adding noise that dilutes the signal.

---

## The Fix: Give Agents a Map, Not a Manual

The root CLAUDE.md should be a **concise map** of roughly 500-1500 tokens (about 30-60 lines). All depth lives elsewhere.

### Step 1: Categorize every rule in your current file

Go through each rule and assign it to one of four buckets:

| Bucket | Action | Example |
|--------|--------|---------|
| **Enforce mechanically** | Move to linter/formatter/type config, delete from CLAUDE.md | Indentation, import ordering, naming conventions, return types |
| **Module-specific** | Move to a subdirectory CLAUDE.md | API error format, DB migration patterns, component structure |
| **Reference material** | Move to `docs/` | Deployment procedures, setup guides, full API docs |
| **Truly global + not enforceable** | Keep in root CLAUDE.md | Architectural boundaries, critical pitfalls, key commands |

Most 400-line files are roughly: 40% enforceable mechanically, 35% module-specific, 15% reference material, 10% genuinely belongs in the root file.

### Step 2: Convert style rules to tooling config

**Before** (in CLAUDE.md):
```markdown
## Code Style
- Use 2-space indentation
- No wildcard imports
- All functions must have explicit return types
- Use single quotes for strings
- No unused variables
- Prefer const over let
- No default exports
- Import order: external libs, then internal modules, then relative imports
- Maximum line length: 100 characters
- Always use trailing commas
- No console.log in production code
```

**After** (delete all of the above from CLAUDE.md, put in config):
```jsonc
// .prettierrc
{ "tabWidth": 2, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```
```jsonc
// tsconfig.json
{ "compilerOptions": { "strict": true, "noUnusedLocals": true, "noUnusedParameters": true } }
```
```jsonc
// .eslintrc relevant rules
{ "no-restricted-syntax": ["error", "ExportDefaultDeclaration"],
  "no-console": "error",
  "import/no-namespace": "error",
  "import/order": ["error", { "groups": ["external", "internal", "parent", "sibling"] }] }
```

Zero tokens spent. 100% enforcement rate. The agent literally cannot produce code that violates these rules because the linter will reject it.

### Step 3: Extract module-specific rules to subdirectory CLAUDE.md files

**Before** (in root CLAUDE.md):
```markdown
## API Conventions
- All endpoints return `{ data, error, meta }` envelope
- Use zod for request validation
- Auth middleware goes on every route except /health and /auth/*
- Rate limiting: 100 req/min for authenticated, 20 for anonymous
- Error responses use RFC 7807 Problem Details format
- Pagination: cursor-based, never offset-based
- All dates in responses are ISO 8601 UTC

## Database Patterns
- Use repository pattern — no raw SQL in service layer
- Migrations are forward-only, never edit existing migrations
- Soft delete via deleted_at column on user-facing tables
- Use transactions for multi-table writes
- Connection pool: max 20 in prod, 5 in test

## Testing Rules
- Integration tests use real database, not mocks
- Each test file must clean up its own data
- Use factories for test data, not fixtures
- Name test files: `*.test.ts` next to source file
- E2E tests go in tests/e2e/, not alongside source
```

**After** — create three subdirectory files:

`src/api/CLAUDE.md`:
```markdown
# API Layer

- All endpoints return `{ data, error, meta }` envelope
- Use zod for request validation — no manual type checking
- Auth middleware on every route except `/health` and `/auth/*`
- Rate limiting: 100 req/min authenticated, 20 anonymous
- Error responses: RFC 7807 Problem Details format
- Pagination: cursor-based only (never offset — we have tables with millions of rows)
- All response dates: ISO 8601 UTC
```

`src/db/CLAUDE.md`:
```markdown
# Database Layer

- Repository pattern only — no raw SQL in services. Repos live in `src/db/repos/`.
- Migrations: forward-only. Never edit an existing migration file.
- Soft delete via `deleted_at` on user-facing tables — always filter `WHERE deleted_at IS NULL`
- Multi-table writes require transactions (use `db.transaction()` helper)
- Connection pool: max 20 prod, 5 test (set in `src/db/config.ts`)
```

`tests/CLAUDE.md`:
```markdown
# Testing Conventions

- Integration tests use real database, never mocks (we got burned by mock/prod divergence)
- Each test cleans up its own data via `afterEach`
- Use factories (`tests/factories/`) for test data, not fixtures
- Test files: `*.test.ts` co-located with source
- E2E tests only in `tests/e2e/`
```

These load automatically when Claude Code is working in those directories. Zero cost when it is working elsewhere.

### Step 4: Move reference material to docs/

Deployment procedures, environment setup guides, and lengthy explanations move to `docs/`:

```
docs/
├── deployment.md          # Deployment runbook
├── setup.md               # Environment setup and onboarding
└── architecture.md        # Detailed architecture decisions
```

The root CLAUDE.md just points to these: "See `docs/deployment.md` for deploy procedures."

### Step 5: Write the new root CLAUDE.md

Here is what your ~400 line file should become — roughly 40-60 lines:

```markdown
# ProjectName

Brief description: what it does, who it's for, core tech stack.

## Structure

| Path | Purpose |
|------|---------|
| `src/api/` | Express routes and middleware |
| `src/core/` | Domain logic (zero external deps) |
| `src/db/` | Database, migrations, repositories |
| `web/` | Next.js frontend |
| `tests/` | Test suite |

## Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Full test suite (~45s) |
| `npm run test:unit` | Unit tests only (~5s) |
| `npm run lint` | ESLint + TypeScript strict mode |
| `npm run dev` | API on :3000, frontend on :3001 |
| `npm run db:migrate` | Run pending migrations |

## Architectural Rules

- `src/core/` must have zero imports from `src/api/` or `src/db/` (enforced by eslint-plugin-import)
- All monetary amounts use `Decimal` type, never `number` (enforced by custom lint rule)
- Database access only through repository pattern in `src/db/repos/`

## Pitfalls

- `users` and `orders` tables use soft delete (`deleted_at`) — always filter `WHERE deleted_at IS NULL`
- Rate limiter is per-IP; in tests, all requests share 127.0.0.1 — set unique headers for rate limit tests
- The `/v1/` API is frozen for backward compat — all new features go in `/v2/`

## Module Docs

Subdirectory CLAUDE.md files exist in `src/api/`, `src/db/`, `tests/`, and `web/` with module-specific conventions.

## Reference Docs

- `docs/architecture.md` — Detailed system architecture and design decisions
- `docs/deployment.md` — Deployment runbook
- `docs/setup.md` — Environment setup and onboarding
```

That is roughly 50 lines and under 800 tokens. It gives the agent a clear map of where things are, how to build and test, what the hard rules are, and what will bite it. Everything else lives where it is most relevant and loads only when needed.

---

## Why This Works

1. **The agent's context budget is freed up.** Instead of 400 lines of instructions competing with your code for attention, the agent sees 50 lines of high-signal guidance and has the rest of its context available for reasoning about the actual task.

2. **Rules are enforced at the right layer.** Style rules live in linters (100% enforcement). Module rules live in subdirectory docs (loaded only when relevant). Only truly global, non-automatable rules stay in the root file.

3. **Progressive disclosure.** The agent starts with a compact map and pulls in deeper context only when it enters a specific module. This mirrors how a skilled human navigates a codebase — you do not read every convention document before touching a file.

4. **Maintenance becomes tractable.** When your API error format changes, you update one file (`src/api/CLAUDE.md`), not a 400-line monolith. When you add a linter rule, you delete the corresponding line from docs. Staleness is localized and obvious.

## The Rule of Thumb

If a rule can be a linter rule, make it a linter rule and delete it from docs. If a rule only applies to one module, move it to that module's CLAUDE.md. The root file should contain only things that are (a) truly global, (b) cannot be enforced mechanically, and (c) the agent needs to know before it starts any task.

Everything else is noise that is actively making your agent worse.

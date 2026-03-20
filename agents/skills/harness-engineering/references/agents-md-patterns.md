# Patterns for Writing Effective AGENTS.md / CLAUDE.md Files

This reference covers patterns for the Tier 1 agent documentation that gets loaded into every agent session. The goal is maximum signal per token.

## Core Principle

Write for an intelligent collaborator who has never seen this repo. They need to know:
1. What this project is and does (2-3 sentences)
2. How the code is organized (directory map)
3. How to build, test, and run it (exact commands)
4. What the architectural rules are (enforceable constraints)
5. What to avoid (known pitfalls)

Everything else belongs in Tier 2/3 docs that agents access on-demand.

## Template: Minimal CLAUDE.md (~500 tokens)

```markdown
# Project Name

Brief description of what this project does and who it's for.

## Structure

| Path | Purpose |
|------|---------|
| `src/` | Application source code |
| `src/api/` | REST API handlers |
| `src/db/` | Database models and migrations |
| `tests/` | Test suite |

## Commands

- `npm test` — Run full test suite
- `npm run lint` — Lint and type-check
- `npm run dev` — Start dev server on :3000

## Rules

- All API handlers go in `src/api/`. Do not put route logic in `src/db/`.
- Database access only through repository pattern in `src/db/repos/`.
- Every new endpoint needs a test in `tests/api/`.
- Use `zod` for all input validation, not manual checks.

## Pitfalls

- The `users` table has a soft-delete (`deleted_at`). Always filter on `deleted_at IS NULL`.
- `NODE_ENV` must be `test` for the test database. The test command sets this automatically.
```

## Template: Comprehensive AGENTS.md (~1500 tokens)

```markdown
# Project Name

## Overview
2-3 sentences: what, who, why.

## Architecture

### Directory Map
| Path | Purpose | Key Files |
|------|---------|-----------|
| `src/core/` | Domain logic | `entities.ts`, `services/` |
| `src/api/` | HTTP layer | `routes/`, `middleware/` |
| `src/infra/` | External integrations | `db/`, `cache/`, `queue/` |

### Dependency Rules
- `core/` has zero imports from `api/` or `infra/`
- `api/` depends on `core/` only through service interfaces
- `infra/` implements interfaces defined in `core/`
- Enforced by: `eslint-plugin-import` boundaries rule

### Data Flow
Request -> Middleware -> Route Handler -> Service -> Repository -> Database
                                      -> Cache (read-through)

## Development

### Setup
npm install
cp .env.example .env.local  # Fill in DATABASE_URL
npm run db:migrate

### Commands
| Command | Purpose |
|---------|---------|
| `npm test` | Full test suite (unit + integration) |
| `npm run test:unit` | Unit tests only (~5s) |
| `npm run lint` | ESLint + TypeScript strict |
| `npm run dev` | Dev server with hot reload |
| `npm run db:migrate` | Run pending migrations |

### Testing Strategy
- Unit tests: `tests/unit/` — Mock external dependencies
- Integration tests: `tests/integration/` — Use test database
- E2E tests: `tests/e2e/` — Full server + database
- Run integration tests against real DB, never mocks (we got burned by mock/prod divergence)

## Conventions

### Code Style
- Use `Result<T, E>` pattern for operations that can fail (no throwing in services)
- All dates are UTC. Convert to user timezone only at the API boundary.
- Environment variables: validated at startup via `src/config.ts`, never read directly

### Naming
- Files: `kebab-case.ts`
- Types/interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Database columns: `snake_case`

### Git
- Branch from `main`, PR back to `main`
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Squash merge; PR title becomes commit message

## Known Issues / Pitfalls
- The `orders` table uses `DECIMAL(10,2)` for amounts — never use float
- Rate limiter is per-IP; in tests, all requests come from 127.0.0.1
- The legacy `/v1/` endpoints are frozen — add new features to `/v2/` only

## Subdirectory Docs
- `src/core/README.md` — Domain model details and business rules
- `src/infra/db/README.md` — Migration conventions and query patterns
- `docs/api.md` — Full API reference with examples
```

## Writing Principles

### Be Specific, Not General
Bad: "Follow RESTful conventions for API design"
Good: "Use plural nouns for resources (`/users`, `/orders`). Return 201 for creates, 200 for updates, 204 for deletes."

### State Constraints as Rules, Not Suggestions
Bad: "Try to keep domain logic separate from infrastructure"
Good: "`src/core/` must have zero imports from `src/api/` or `src/infra/`. Enforced by eslint-plugin-import."

### Include the Why
Bad: "Never use `SELECT *`"
Good: "Never use `SELECT *` — we have wide tables (50+ columns) and it causes performance issues with our connection pooling."

### Make Commands Copy-Pasteable
Bad: "Run the test suite to verify"
Good: "`npm test` — runs unit + integration tests (~30s)"

### Document Pitfalls That Bit You
These are the highest-value items in agent docs. Every time an agent (or human) gets tripped up by a non-obvious behavior, add it to the Pitfalls section.

### Keep It Current
Stale docs are worse than no docs — they actively mislead agents. Review agent docs when:
- Directory structure changes
- New architectural rules are established
- A pitfall is discovered
- Commands or setup steps change

### Subdirectory CLAUDE.md Files
For large repos, place additional CLAUDE.md files in subdirectories. These load automatically when agents work in that directory (in Claude Code). Use them for:
- Module-specific conventions
- Complex subsystem documentation
- Domain-specific business rules

Keep the root file as a map; let subdirectory files carry the detail.

## Keeping the Root File Short

The #1 mistake is cramming everything into one CLAUDE.md. The root file should be under 1500 tokens — a map, not a manual.

### The Extraction Hierarchy

When your root file gets too long, extract in this order (most effective first):

1. **Convert to linter/formatter rules** — Delete from docs entirely. A rule the agent can't break is better than one it might forget.
   - "Use 2-space indentation" → `.prettierrc`
   - "No wildcard imports" → ESLint rule
   - "All functions must have return types" → `tsconfig.json` strict mode

2. **Move to subdirectory CLAUDE.md** — Module-specific conventions, business rules, domain logic
   ```
   src/
   ├── CLAUDE.md              # "API layer: see src/api/CLAUDE.md for conventions"
   ├── api/
   │   └── CLAUDE.md          # Route naming, auth patterns, error format
   ├── core/
   │   └── CLAUDE.md          # Domain entities, business rules, validation logic
   └── infra/
       └── CLAUDE.md          # DB patterns, migration conventions, cache strategy
   ```

3. **Move to reference docs** — Detailed specs, API documentation, onboarding guides
   ```
   docs/
   ├── api.md                 # Full API reference with examples
   ├── ONBOARDING.md          # Environment setup, credential provisioning
   └── adr/
       ├── 001-use-result-pattern.md
       └── 002-utc-everywhere.md
   ```

4. **Move to code comments** — Why-comments on non-obvious code. Agents read the code and its comments when working on it, so this is effective Tier 2 context that loads automatically.

### Before/After Example

**Before** (root CLAUDE.md — too long, ~3000 tokens):
```markdown
# MyApp
... project overview ...
... directory structure ...
... commands ...
... 15 code style rules ...
... 10 API conventions ...
... 8 database patterns ...
... 5 testing conventions ...
... setup instructions ...
... deployment guide ...
```

**After** (root CLAUDE.md — concise, ~800 tokens):
```markdown
# MyApp

SaaS billing platform. Next.js frontend, Express API, PostgreSQL.

## Structure
| Path | Purpose |
|------|---------|
| `src/api/` | Express routes and middleware |
| `src/core/` | Domain logic (zero external deps) |
| `src/infra/` | DB, cache, queue integrations |
| `web/` | Next.js frontend |

## Commands
- `npm test` — Full suite (~45s)
- `npm run lint` — ESLint + tsc strict
- `npm run dev` — API on :3000, web on :3001

## Rules
- `core/` imports nothing from `api/` or `infra/` (enforced by eslint-plugin-import)
- All amounts use `Decimal` type, never float
- UTC everywhere; convert at API boundary only

## Pitfalls
- `orders` table: soft-delete via `deleted_at` — always filter
- Rate limiter is per-IP; all test requests share 127.0.0.1

## Module Docs
See subdirectory CLAUDE.md files for module-specific conventions.
```

The 15 code style rules became linter config. The API/DB/testing conventions moved to subdirectory CLAUDE.md files. Setup and deployment moved to `docs/`.

## Anti-Patterns in Agent Docs

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Wall of text | Agents lose important info in noise | Use tables, bullet points, short sections |
| Aspirational rules | "We should eventually..." confuses agents | Only document current reality |
| Duplicate info | Same constraint stated 3 different ways | State once, clearly |
| External links only | "See Confluence page for architecture" | Agents can't access Confluence; put it in the repo |
| No commands section | Agents guess at build/test/run commands | Always include exact commands |
| Stale examples | Code samples that don't match current codebase | Update or remove; stale examples mislead |

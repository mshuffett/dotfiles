# Setting Up ~/ws/billing-app for Claude Code and Codex

Here's the exact file-by-file plan for your greenfield Next.js + Prisma SaaS billing app. I'm following the harness engineering principle of "give agents a map, not a manual" — a concise root file, mechanical enforcement via tooling, and depth pushed into subdirectory docs and `docs/`.

---

## Files to Create

### 1. `CLAUDE.md` (repo root) — Tier 1, always loaded

This is the single most important file. Keep it under ~1500 tokens. It's a map, not a manual.

```markdown
# billing-app

SaaS billing application. Next.js frontend, Prisma ORM, PostgreSQL.

## Structure

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and layouts |
| `src/app/api/` | API route handlers |
| `src/lib/` | Shared utilities, config, and helpers |
| `src/lib/db/` | Prisma client, repository functions |
| `src/lib/billing/` | Billing domain logic (plans, subscriptions, invoices) |
| `src/components/` | React components |
| `prisma/` | Schema and migrations |
| `tests/` | Test suite |
| `docs/` | Architecture docs, design decisions, specs |

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm test` | Run full test suite |
| `pnpm test:unit` | Unit tests only |
| `pnpm lint` | ESLint + TypeScript strict check |
| `pnpm db:migrate` | Run pending Prisma migrations |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:seed` | Seed development database |
| `pnpm db:studio` | Open Prisma Studio |

## Rules

- All monetary amounts use `Decimal` (Prisma) / `number` with cents-as-integers in application code. Never use floating point for money.
- Database access only through repository functions in `src/lib/db/`. No direct `prisma.` calls in route handlers or components.
- `src/lib/billing/` contains pure domain logic with zero framework imports (no Next.js, no Prisma). It operates on plain TypeScript types.
- All API route handlers validate input with `zod` before processing.
- Environment variables are validated at startup via `src/lib/config.ts`. Never read `process.env` directly elsewhere.
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.

## Pitfalls

- Prisma `Decimal` fields serialize as strings in JSON. Convert explicitly at the API boundary.
- Next.js App Router: server components can't use hooks or browser APIs. Mark client components with `'use client'`.
- Always run `pnpm db:generate` after changing `prisma/schema.prisma` — the TypeScript types won't update until you do.

## Deeper Docs

- `src/lib/billing/CLAUDE.md` — Billing domain rules and subscription lifecycle
- `src/lib/db/CLAUDE.md` — Repository pattern, migration conventions
- `src/app/api/CLAUDE.md` — API conventions, auth, error format
- `docs/ARCHITECTURE.md` — Full system design and data flow
```

### 2. `AGENTS.md` (repo root) — For Codex and other agents

This covers the same ground as `CLAUDE.md` in an agent-agnostic format. Codex reads `AGENTS.md` by default.

```markdown
# billing-app

SaaS billing application built with Next.js (App Router), Prisma ORM, and PostgreSQL.

## Setup

```bash
pnpm install
cp .env.example .env.local   # Fill in DATABASE_URL and STRIPE_SECRET_KEY
pnpm db:migrate
pnpm db:generate
pnpm db:seed
```

## Commands

- `pnpm dev` — Start dev server (:3000)
- `pnpm test` — Run all tests
- `pnpm lint` — ESLint + tsc strict
- `pnpm build` — Production build
- `pnpm db:migrate` — Apply Prisma migrations
- `pnpm db:generate` — Regenerate Prisma client after schema changes

## Architecture

### Directory Map

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router (pages, layouts, API routes) |
| `src/lib/billing/` | Billing domain logic — pure TS, no framework deps |
| `src/lib/db/` | Prisma client + repository functions |
| `src/lib/config.ts` | Env validation (single source of truth for config) |
| `src/components/` | React UI components |
| `prisma/schema.prisma` | Database schema |
| `prisma/migrations/` | Migration history |
| `tests/` | Test suite (unit + integration) |

### Dependency Rules

```
src/lib/billing/  -->  zero imports from Next.js, Prisma, or src/app/
src/app/api/      -->  calls src/lib/billing/ and src/lib/db/ only
src/components/   -->  never imports from src/lib/db/ directly
```

### Key Conventions

- Money: integers (cents), never floats. Prisma schema uses `Decimal`; app code uses `number` (cents).
- Validation: `zod` schemas for all API input.
- DB access: only through `src/lib/db/` repositories. No raw `prisma.` calls in handlers.
- Env vars: read only from `src/lib/config.ts`, never `process.env` directly.
- Commits: conventional format (`feat:`, `fix:`, etc.).

### Testing

- Unit tests: `tests/unit/` — mock DB, test domain logic
- Integration tests: `tests/integration/` — real test DB via Prisma
- Run `pnpm test` before every PR

### Pitfalls

- `Decimal` fields serialize as strings in JSON — convert at API boundary
- Run `pnpm db:generate` after any `schema.prisma` change
- Server components cannot use React hooks or `'use client'` APIs
```

### 3. `src/lib/billing/CLAUDE.md` — Billing domain (Tier 2)

```markdown
# Billing Domain

Pure TypeScript domain logic for subscriptions, plans, and invoices. This module has **zero imports** from Next.js, Prisma, or any infrastructure code. It operates on plain TS types defined in `./types.ts`.

## Core Entities

- **Plan** — A product tier (e.g., Free, Pro, Enterprise) with monthly/annual pricing
- **Subscription** — Links a tenant to a plan with a billing cycle
- **Invoice** — Generated per billing cycle, tracks line items and payment status
- **UsageRecord** — Metered usage events for usage-based billing

## Subscription Lifecycle

```
TRIAL -> ACTIVE -> PAST_DUE -> CANCELED
                -> PAUSED -> ACTIVE
```

- `TRIAL`: 14-day free trial, no payment method required
- `ACTIVE`: payment method on file, billing active
- `PAST_DUE`: payment failed, retry for 7 days then cancel
- `PAUSED`: customer-initiated pause, max 90 days
- `CANCELED`: terminal state, cannot reactivate (must create new subscription)

## Rules

- All price calculations happen in this module, not in route handlers or DB queries.
- Proration uses day-based calculation: `(remaining_days / total_days) * plan_price`.
- Tax calculation is a pure function: `calculateTax(amount: number, region: TaxRegion): number`.
- Never store calculated totals — always derive from line items.

## Testing

Domain logic is fully unit-testable with no mocks needed (pure functions).
Test files: `tests/unit/billing/`.
```

### 4. `src/lib/db/CLAUDE.md` — Database layer (Tier 2)

```markdown
# Database Layer

Prisma-based data access through the repository pattern.

## Repository Pattern

Each entity has a repository file in `src/lib/db/repos/`:
- `plan-repo.ts` — Plan CRUD
- `subscription-repo.ts` — Subscription queries and mutations
- `invoice-repo.ts` — Invoice management
- `tenant-repo.ts` — Tenant/org management

Repositories accept and return plain TS types (from `src/lib/billing/types.ts`), not Prisma models directly. This keeps the billing domain decoupled from Prisma.

## Conventions

- All queries filter on `deleted_at IS NULL` unless explicitly querying deleted records. Use the `notDeleted` helper.
- Wrap multi-table writes in `prisma.$transaction()`.
- Monetary columns use Prisma `Decimal` type. Repos convert to/from `number` (cents) at the boundary.
- Indexes: every foreign key gets an index. Add composite indexes for common query patterns.

## Migrations

- Never edit existing migrations. Create a new one: `pnpm db:migrate --name descriptive-name`.
- Every migration should be reversible. Include a rollback comment in the migration SQL if the auto-generated down migration is insufficient.
- After changing `schema.prisma`, always run `pnpm db:generate` to update the Prisma client types.
```

### 5. `src/app/api/CLAUDE.md` — API conventions (Tier 2)

```markdown
# API Routes

Next.js App Router API routes for the billing platform.

## Conventions

- Route files: `src/app/api/[resource]/route.ts`
- Use `zod` to validate all request bodies and query params before processing.
- Return consistent error format:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message", "details": [] } }
  ```
- HTTP status codes: 200 (success), 201 (created), 400 (validation), 401 (unauth), 403 (forbidden), 404 (not found), 500 (server error).
- Always return `NextResponse.json()` — never return raw objects.

## Auth

- Auth middleware in `src/lib/auth.ts` extracts the tenant from the session/token.
- Every mutation route must verify the tenant has permission for the resource.
- Use `withAuth(handler)` wrapper for authenticated routes.

## Error Handling

- Route handlers catch all errors and return structured responses.
- Never let Prisma errors leak to the client — map them in `src/lib/errors.ts`.
- Log the full error server-side; return only safe details to the client.
```

### 6. `docs/ARCHITECTURE.md` — Full system design (Tier 3)

```markdown
# Architecture

## System Overview

billing-app is a multi-tenant SaaS billing platform. Each tenant (organization) has users, subscriptions, and invoices.

## Data Flow

```
Browser -> Next.js App Router -> API Route Handler
                                    |
                                    v
                              Zod Validation
                                    |
                                    v
                         Billing Domain Logic (src/lib/billing/)
                                    |
                                    v
                         Repository Layer (src/lib/db/)
                                    |
                                    v
                              Prisma Client
                                    |
                                    v
                              PostgreSQL
```

## Layer Responsibilities

| Layer | Directory | Allowed Dependencies |
|-------|-----------|---------------------|
| UI | `src/app/`, `src/components/` | billing types (read-only), API calls |
| API | `src/app/api/` | billing logic, db repos, auth |
| Domain | `src/lib/billing/` | NOTHING external — pure TS only |
| Data | `src/lib/db/` | Prisma, billing types |
| Config | `src/lib/config.ts` | zod (for validation) |

## Multi-Tenancy

- Tenant isolation via `tenant_id` column on all data tables.
- Every DB query must scope to the current tenant. Repositories enforce this — never bypass.
- Tenant context flows from auth middleware through to repository calls.

## Stripe Integration

- Stripe is the payment processor. Webhook events arrive at `/api/webhooks/stripe`.
- Stripe is treated as an external system — all Stripe-specific code lives in `src/lib/stripe/`.
- The billing domain never imports Stripe types. Adapters in `src/lib/stripe/` translate between Stripe events and domain events.
```

### 7. `.env.example` — Document required env vars

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/billing_app_dev"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 8. `tsconfig.json` — Strict TypeScript (enforcement, not docs)

Ensure your `tsconfig.json` has these strict settings. Next.js scaffold may already have some; add what's missing:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

The key additions beyond Next.js defaults: `noUncheckedIndexedAccess` (prevents undefined-access bugs), `exactOptionalPropertyTypes` (catches `undefined` vs missing key), and `noImplicitReturns`.

### 9. `.eslintrc.json` — Architectural constraints as lint rules

Extend the Next.js ESLint config with import boundary enforcement:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "plugins": ["import"],
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/lib/billing/**",
            "from": "./src/app/**",
            "message": "Billing domain must not import from app layer"
          },
          {
            "target": "./src/lib/billing/**",
            "from": "./src/lib/db/**",
            "message": "Billing domain must not import from database layer"
          },
          {
            "target": "./src/lib/billing/**",
            "from": "./node_modules/@prisma/**",
            "message": "Billing domain must not import Prisma"
          },
          {
            "target": "./src/components/**",
            "from": "./src/lib/db/**",
            "message": "Components must not import from database layer directly"
          }
        ]
      }
    ],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "MemberExpression[object.name='process'][property.name='env']",
        "message": "Use src/lib/config.ts instead of process.env directly. This ensures all env vars are validated at startup."
      }
    ]
  },
  "overrides": [
    {
      "files": ["src/lib/config.ts"],
      "rules": {
        "no-restricted-syntax": "off"
      }
    }
  ]
}
```

This is one of the highest-leverage files. The `import/no-restricted-paths` rules mechanically enforce your layer boundaries. Agents literally cannot violate them without the lint failing. The custom `no-restricted-syntax` rule prevents direct `process.env` access everywhere except the config file, with a remediation message that tells the agent exactly what to do instead.

### 10. `.prettierrc` — Formatting (enforce, don't document)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### 11. `.github/workflows/ci.yml` — CI enforcement

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: billing_app_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type Check
        run: pnpm tsc --noEmit

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run Migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/billing_app_test

      - name: Test
        run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/billing_app_test

      - name: Build
        run: pnpm build
```

### 12. `src/lib/config.ts` — Validated env vars (referenced in rules)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

// Validated at import time — fails fast if env is misconfigured
export const env = envSchema.parse(process.env);
```

This is the only file allowed to read `process.env` (enforced by the ESLint rule above).

---

## File Summary and Priority

| Priority | File | Why |
|----------|------|-----|
| 1 | `CLAUDE.md` | Tier 1 context — Claude Code reads this every session |
| 2 | `AGENTS.md` | Codex reads this; also good for any other agent tooling |
| 3 | `.eslintrc.json` | Mechanically enforces layer boundaries — worth 10x any doc rule |
| 4 | `tsconfig.json` (strict additions) | Type system catches bugs agents would otherwise introduce |
| 5 | `.github/workflows/ci.yml` | CI is the final gate — agents cannot merge broken code |
| 6 | `src/lib/config.ts` | Enables the "no direct process.env" rule |
| 7 | `.env.example` | Agents and humans need to know what env vars are required |
| 8 | `.prettierrc` | Consistent formatting without documenting style rules |
| 9 | `src/lib/billing/CLAUDE.md` | Tier 2 — loads when agents work in billing domain |
| 10 | `src/lib/db/CLAUDE.md` | Tier 2 — loads when agents work on data layer |
| 11 | `src/app/api/CLAUDE.md` | Tier 2 — loads when agents work on API routes |
| 12 | `docs/ARCHITECTURE.md` | Tier 3 — full system design, pulled in on-demand |

## What NOT to Do

- **Don't put everything in one giant CLAUDE.md.** The root file is a map (~1000 tokens). Domain-specific rules go in subdirectory CLAUDE.md files.
- **Don't document things the linter enforces.** Layer boundaries are in `.eslintrc.json`, not prose. If an agent can violate a rule and still pass CI, the rule needs to be promoted from docs to code.
- **Don't write aspirational rules.** Only document current reality. "We plan to add caching" does not belong in agent docs.
- **Don't link to external docs agents can't reach.** If Stripe's API docs matter, vendor the relevant portions into `docs/references/stripe-billing-llms.txt`.

## Next Steps After Creating These Files

1. Run `pnpm add -D eslint-plugin-import` to enable the import boundary rules.
2. Create the directory structure: `src/lib/billing/`, `src/lib/db/repos/`, `src/lib/stripe/`, `docs/`.
3. Set up the Prisma schema with your initial models (tenants, plans, subscriptions, invoices).
4. Add test infrastructure: `pnpm add -D vitest @testing-library/react` and configure in `vitest.config.ts`.
5. Add `package.json` scripts for the commands referenced in CLAUDE.md (`db:migrate`, `db:generate`, `db:seed`, `test:unit`).
6. As the codebase grows past ~10K LOC, consider adding `docs/design-docs/` for ADRs and `docs/exec-plans/` for tracking larger features.

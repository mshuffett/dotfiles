# Setting Up Claude Code & Codex for a Next.js + Prisma SaaS Billing App

Here are the files you should create, with full contents for each.

---

## 1. `CLAUDE.md` (project root)

This is the primary file Claude Code reads for project context. It should contain everything an AI agent needs to understand, build, run, and test the project.

```markdown
# CLAUDE.md

## Project Overview

SaaS billing application built with Next.js (App Router) and Prisma ORM. Handles subscription management, invoicing, payment processing, and usage-based billing.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **ORM**: Prisma with PostgreSQL
- **Auth**: NextAuth.js v5 (Auth.js)
- **Payments**: Stripe (subscriptions, invoices, webhooks)
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)

## Project Structure

```
src/
  app/                  # Next.js App Router pages and layouts
    (auth)/             # Auth route group (login, register)
    (dashboard)/        # Authenticated dashboard routes
    api/                # API routes (webhooks, REST endpoints)
  components/           # React components
    ui/                 # Shared UI primitives
  lib/                  # Shared utilities
    db.ts               # Prisma client singleton
    stripe.ts           # Stripe client + helpers
    auth.ts             # Auth configuration
  actions/              # Server Actions
  types/                # Shared TypeScript types
prisma/
  schema.prisma         # Database schema
  migrations/           # Prisma migrations
  seed.ts               # Database seeder
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Database
pnpm prisma generate          # Regenerate Prisma client after schema changes
pnpm prisma migrate dev       # Create and apply migration
pnpm prisma db seed           # Seed the database
pnpm prisma studio            # Open Prisma Studio GUI

# Type checking and linting
pnpm typecheck                # tsc --noEmit
pnpm lint                     # next lint
pnpm lint:fix                 # next lint --fix

# Testing
pnpm test                     # Run vitest unit tests
pnpm test:e2e                 # Run Playwright e2e tests

# Build
pnpm build                    # Production build (runs prisma generate first)
```

## Environment Variables

Required in `.env` (never commit this file):

```
DATABASE_URL="postgresql://user:pass@localhost:5432/billing_app"
NEXTAUTH_SECRET="<random-32-char>"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Key Conventions

- **Server Components by default**. Only add `"use client"` when the component needs interactivity (event handlers, useState, useEffect).
- **Server Actions** for mutations. Define in `src/actions/` and import into components. Always validate input with Zod.
- **Prisma client**: Always import from `@/lib/db` (singleton pattern to avoid connection exhaustion in dev).
- **Error handling**: Use `notFound()` and `redirect()` from `next/navigation`. For Server Actions, return `{ error: string }` objects rather than throwing.
- **Stripe webhooks**: All webhook event handling is in `src/app/api/webhooks/stripe/route.ts`. Always verify the webhook signature.
- **Auth checks**: Use `auth()` from `@/lib/auth` in Server Components and middleware. Protect routes via `middleware.ts`.
- **Imports**: Use `@/` path alias (mapped to `src/`).
- **Naming**: kebab-case for files, PascalCase for components, camelCase for functions/variables.

## Database Schema Notes

The Prisma schema uses these core models:
- `User` - authenticated user
- `Organization` - billing entity (multi-tenant)
- `Subscription` - links org to a Stripe subscription
- `Invoice` - synced from Stripe
- `UsageRecord` - tracks metered usage for billing

Always run `pnpm prisma generate` after modifying `schema.prisma`.

## Verification Steps

After any change:
1. `pnpm typecheck` must pass
2. `pnpm lint` must pass
3. `pnpm test` must pass (if tests exist for the changed area)
4. `pnpm build` must succeed

## Common Patterns

### Creating a new page
1. Add route at `src/app/(dashboard)/[route]/page.tsx`
2. Export a default async Server Component
3. Fetch data via Prisma in the component body (no API call needed)
4. Protect with auth check: `const session = await auth(); if (!session) redirect("/login");`

### Adding a Server Action
1. Create file in `src/actions/` with `"use server"` directive
2. Define Zod schema for input validation
3. Check auth, validate input, perform DB mutation, revalidate path
4. Return `{ success: true }` or `{ error: "message" }`

### Adding a Stripe webhook handler
1. Add case to the switch in `src/app/api/webhooks/stripe/route.ts`
2. Extract typed event data
3. Update database to match Stripe state
4. Return `NextResponse.json({ received: true })`
```

---

## 2. `codex.md` (project root)

Codex uses this file (similar to CLAUDE.md but Codex-specific). Keep it focused on setup commands and guardrails since Codex runs sandboxed.

```markdown
# codex.md

## Setup

```bash
pnpm install
pnpm prisma generate
```

## Development

```bash
pnpm dev              # Start dev server on port 3000
pnpm typecheck        # Type check (tsc --noEmit)
pnpm lint             # Lint (next lint)
pnpm test             # Unit tests (vitest)
pnpm build            # Production build
```

## Key Rules

- Use `pnpm` (not npm or yarn)
- Import Prisma client from `@/lib/db`, never instantiate directly
- Run `pnpm prisma generate` after any schema.prisma change
- All Server Actions go in `src/actions/` with `"use server"` at the top
- Validate all inputs with Zod before database operations
- Use `@/` import alias (resolves to `src/`)
- Server Components by default; only add `"use client"` when needed
- Never commit `.env` files
```

---

## 3. `.claude/settings.json`

Claude Code project-level settings. Controls permissions so Claude can run dev commands without asking every time.

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm dev)",
      "Bash(pnpm build)",
      "Bash(pnpm test*)",
      "Bash(pnpm lint*)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm prisma generate)",
      "Bash(pnpm prisma migrate dev*)",
      "Bash(pnpm prisma db seed)",
      "Bash(pnpm prisma studio)",
      "Bash(pnpm prisma format)",
      "Bash(npx prisma*)",
      "Bash(pnpm exec tsc*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(*STRIPE_SECRET*)",
      "Bash(*DATABASE_URL*)",
      "Bash(git push --force*)"
    ]
  }
}
```

---

## 4. `.claude/commands/db-reset.md`

A custom slash command for resetting the database during development.

```markdown
Reset the database: drop all tables, re-run migrations, and seed.

Run these commands in sequence:
1. `pnpm prisma migrate reset --force`
2. `pnpm prisma db seed`

Report what happened and whether the seed succeeded.
```

---

## 5. `.claude/commands/add-feature.md`

A custom slash command template for adding new features with a consistent process.

```markdown
Add a new feature: $ARGUMENTS

Follow this process:
1. Understand the feature requirement from the arguments
2. Identify which files need to change (schema, actions, components, pages)
3. If schema changes are needed, update `prisma/schema.prisma` and run `pnpm prisma migrate dev --name <descriptive-name>`
4. Implement server-side logic first (actions, API routes)
5. Implement UI components and pages
6. Run `pnpm typecheck && pnpm lint && pnpm test` to verify
7. Summarize what was created/changed
```

---

## 6. `.env.example`

Checked into git so both humans and AI agents know what environment variables are needed.

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/billing_app"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional: Stripe price IDs for your plans
STRIPE_PRICE_FREE=""
STRIPE_PRICE_PRO_MONTHLY=""
STRIPE_PRICE_PRO_YEARLY=""
```

---

## 7. `src/lib/db.ts`

This is the Prisma client singleton that CLAUDE.md references. Both agents need this to exist so they import from the right place.

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## 8. `package.json` scripts (additions to the scaffold)

Add these scripts to the existing `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 9. `.gitignore` additions

Ensure these are in `.gitignore` so agents never see or commit secrets:

```
# env files
.env
.env.local
.env.*.local

# database
*.db
*.db-journal

# prisma
prisma/*.db

# IDE
.claude/todos.json
```

---

## 10. `prisma/schema.prisma` (starter schema)

Give agents a real schema to work with so they understand the domain model:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts       Account[]
  sessions       Session[]
  memberships    Membership[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Organization {
  id               String   @id @default(cuid())
  name             String
  stripeCustomerId String?  @unique
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  memberships   Membership[]
  subscriptions Subscription[]
  invoices      Invoice[]
  usageRecords  UsageRecord[]
}

model Membership {
  id             String   @id @default(cuid())
  role           Role     @default(MEMBER)
  userId         String
  organizationId String
  createdAt      DateTime @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

model Subscription {
  id                   String             @id @default(cuid())
  organizationId       String
  stripeSubscriptionId String             @unique
  stripePriceId        String
  status               SubscriptionStatus
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  TRIALING
  UNPAID
}

model Invoice {
  id               String        @id @default(cuid())
  organizationId   String
  stripeInvoiceId  String        @unique
  amountDue        Int
  amountPaid       Int
  currency         String        @default("usd")
  status           InvoiceStatus
  invoicePdfUrl    String?
  periodStart      DateTime
  periodEnd        DateTime
  createdAt        DateTime      @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}

model UsageRecord {
  id             String   @id @default(cuid())
  organizationId String
  metric         String
  quantity       Int
  timestamp      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, metric, timestamp])
}
```

---

## Summary: Files to Create

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Primary context for Claude Code -- project overview, commands, conventions, patterns |
| `codex.md` | Codex-specific setup and rules (lighter, focused on sandbox constraints) |
| `.claude/settings.json` | Pre-approve safe commands so Claude doesn't ask permission repeatedly |
| `.claude/commands/db-reset.md` | `/db-reset` slash command |
| `.claude/commands/add-feature.md` | `/add-feature` slash command |
| `.env.example` | Documents required env vars for humans and agents |
| `src/lib/db.ts` | Prisma singleton (prevents connection exhaustion) |
| `prisma/schema.prisma` | Domain schema so agents understand the data model |
| `.gitignore` additions | Prevent secrets and artifacts from being committed |
| `package.json` script additions | Standardized commands that match what CLAUDE.md documents |

The most important file by far is `CLAUDE.md`. The single biggest leverage point is giving agents a clear picture of: (1) how to run things, (2) where things live, and (3) what patterns to follow. Everything else is optimization on top of that foundation.

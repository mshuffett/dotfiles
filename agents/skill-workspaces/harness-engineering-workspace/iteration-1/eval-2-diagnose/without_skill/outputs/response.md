# Why Your 400-Line CLAUDE.md Is Failing (and How to Fix It)

## The Problem: Attention Dilution

You're hitting a well-known failure mode with large instruction files. Here's what's actually happening:

### 1. Signal-to-Noise Ratio Degrades With Length

Claude Code reads your CLAUDE.md on every interaction. When it's 400 lines covering 7+ topics (code style, APIs, databases, testing, deployment, naming, git), each individual rule gets a smaller share of the model's attention. The model doesn't "forget" rules — it deprioritizes them when competing with dozens of other instructions and the immediate task context.

Think of it like a meeting agenda with 40 items: the first few get thorough discussion, the rest get rushed or skipped.

### 2. Contradictions and Ambiguity Multiply

In a 400-line file, rules inevitably conflict or overlap. Example: your git workflow section might say "always squash commits" while your deployment section implies "use merge commits for traceability." The model picks whichever interpretation is closest to the current context window — which looks like inconsistency to you.

### 3. Generic Rules Get Ignored

Rules like "follow best practices" or "write clean code" carry zero information. They compete for attention budget but contribute nothing. Worse, they train the model to treat your instructions as background noise rather than hard constraints.

### 4. Context Window Competition

Your CLAUDE.md competes with the actual code, conversation history, and task instructions for space in the context window. A 400-line instruction file can consume 3,000-5,000 tokens — that's context that could be holding relevant code or prior conversation turns.

## The Fix: Decompose, Scope, and Sharpen

### Principle: Rules should be proximal to the work they govern

Instead of one monolithic file, use CLAUDE.md as a short routing document and push topic-specific rules into scoped files that only load when relevant.

### Step 1: Shrink the Root CLAUDE.md to ~50-80 Lines

Your root CLAUDE.md should contain ONLY:
- Project-wide invariants (the 5-10 rules that apply to literally every task)
- Pointers to topic-specific instruction files

**Before (monolith pattern):**

```markdown
# CLAUDE.md

## Code Style
- Use 2-space indentation
- Prefer const over let
- Use named exports
- Components use PascalCase
- Hooks start with "use"
- ... (40 more lines)

## API Conventions
- All endpoints return { data, error, metadata }
- Use zod for validation
- Rate limit all public endpoints
- ... (30 more lines)

## Database
- Always use transactions for multi-table writes
- Use soft deletes
- Name migrations with timestamps
- ... (25 more lines)

## Testing
- Every PR needs tests
- Use vitest
- Mock external services
- ... (30 more lines)

## Deployment
- Feature flags for new features
- Blue-green deploys
- ... (20 more lines)

## Naming Conventions
- ... (25 more lines)

## Git Workflow
- ... (20 more lines)
```

**After (routing pattern):**

```markdown
# CLAUDE.md

## Hard Rules (always active)
- TypeScript strict mode, no `any` escape hatches
- Every public function has a return type annotation
- All API responses use the `ApiResponse<T>` wrapper type
- Never commit secrets or .env files
- Run `pnpm check` before considering work complete

## Project Structure
- `src/api/` — API routes and handlers (see `src/api/CLAUDE.md`)
- `src/db/` — Database layer (see `src/db/CLAUDE.md`)
- `src/components/` — React components (see `src/components/CLAUDE.md`)
- `tests/` — Test conventions (see `tests/CLAUDE.md`)
```

That's it. ~20 lines. The hard rules are few enough that every one gets full attention on every interaction.

### Step 2: Create Directory-Scoped CLAUDE.md Files

Claude Code automatically picks up `CLAUDE.md` files in subdirectories when working on files in those directories. This is the key mechanism — rules load only when relevant.

**`src/api/CLAUDE.md`** (~30 lines):
```markdown
# API Conventions

## Response Shape
All handlers return `ApiResponse<T>`:
\`\`\`ts
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }
\`\`\`

## Validation
- Parse input with zod schemas before any business logic
- Schema file lives next to the route: `route.ts` + `route.schema.ts`

## Error Handling
- Throw `AppError` subclasses, never raw Error
- The error middleware maps AppError to HTTP status codes

## Auth
- All routes require auth unless in `PUBLIC_ROUTES`
- Use `requireRole('admin')` middleware, never manual role checks
```

**`src/db/CLAUDE.md`** (~25 lines):
```markdown
# Database Conventions

## Queries
- Use the query builder in `src/db/query.ts`, not raw SQL
- All multi-table writes use `db.transaction()`
- Soft delete via `deleted_at` column — never hard delete user data

## Migrations
- File format: `YYYYMMDD_HHMMSS_description.sql`
- Every migration must be reversible (include DOWN section)
- Test migrations against a snapshot of production schema

## Naming
- Tables: plural snake_case (`user_accounts`, not `UserAccount`)
- Columns: snake_case, no abbreviations
- Foreign keys: `<referenced_table_singular>_id`
```

**`tests/CLAUDE.md`** (~20 lines):
```markdown
# Testing Rules

## Framework
- vitest for unit/integration, Playwright for e2e
- Run: `pnpm test` (unit), `pnpm test:e2e` (Playwright)

## Conventions
- Test file lives next to source: `foo.ts` -> `foo.test.ts`
- Use `describe` blocks matching the function/component name
- Mock external services with `src/test/mocks/` factories
- No snapshot tests for logic — only for UI components with explicit review

## Coverage
- New code must have tests. No exceptions.
- Integration tests for any multi-service flow
```

### Step 3: Make Rules Concrete and Testable

Vague rules get ignored. Concrete rules get followed.

**Bad (vague):**
```markdown
- Follow consistent naming conventions
- Write comprehensive tests
- Handle errors properly
```

**Good (concrete):**
```markdown
- Components: PascalCase (`UserProfile.tsx`). Hooks: camelCase with `use` prefix (`useAuth.ts`).
- Every exported function has at least one test. API routes have integration tests that hit the handler.
- Wrap all async route handlers in `asyncHandler()`. Throw `NotFoundError`/`ValidationError`/`AuthError` — never `new Error()`.
```

The difference: a concrete rule can be mechanically checked. If you can't tell whether the rule was followed by looking at a diff, the rule is too vague.

### Step 4: Use Examples Over Descriptions

When a pattern is complex, show the canonical example rather than describing it in prose.

**Less effective:**
```markdown
API routes should validate input, call the service layer, and return a standardized response.
```

**More effective:**
```markdown
## Canonical Route Pattern
\`\`\`ts
// src/api/users/create.ts
export const createUser = asyncHandler(async (req, res) => {
  const input = CreateUserSchema.parse(req.body);   // validate first
  const user = await userService.create(input);       // service layer does the work
  res.json(ok(user));                                 // ok() wraps in ApiResponse
});
\`\`\`
```

The model will pattern-match against the example far more reliably than it will follow a prose description.

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| Root CLAUDE.md | 400 lines, 7 topics | 20-50 lines, hard invariants only |
| Topic rules | All in one file | Directory-scoped CLAUDE.md files |
| Rule style | Vague prose | Concrete, testable, with examples |
| Attention per rule | Diluted across 400 lines | Focused: only relevant rules load |
| Maintenance | One file to update (merge conflicts, drift) | Each team/area owns its section |

## Why This Works

1. **Proximity**: Rules about database code load when editing database code, not when writing React components. The model's attention is focused on relevant constraints.

2. **Brevity**: Each scoped file is 20-40 lines. Every rule gets real attention weight. Nothing is noise.

3. **Concreteness**: Testable rules with examples leave no room for interpretation. The model pattern-matches against examples more reliably than it reasons about abstract prose.

4. **Maintainability**: When your API conventions change, you edit `src/api/CLAUDE.md` — you don't search through a 400-line monolith hoping you found every relevant line.

## Quick Diagnostic Checklist

If Claude Code is ignoring a rule, check these in order:

1. **Is the rule actually in scope?** If you're editing `src/api/users.ts`, only the root CLAUDE.md and `src/api/CLAUDE.md` (and parents) are active.
2. **Is the rule concrete enough?** Can you mechanically verify compliance from a diff? If not, sharpen it.
3. **Does the rule have an example?** Add one. Examples beat descriptions every time.
4. **Is the rule competing with 50+ other rules?** If the file is over 80 lines, it's too long. Split it.
5. **Does the rule contradict another rule?** Search for conflicting guidance. Remove the ambiguity.

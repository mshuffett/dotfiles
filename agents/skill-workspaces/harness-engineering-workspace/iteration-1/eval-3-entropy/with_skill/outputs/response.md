# Fixing Codebase Entropy from Heavy Agent Usage

You're hitting the exact problem OpenAI's team documented: they were also spending every Friday (20% of their engineering week) on manual cleanup, and it didn't scale. The root cause isn't that agents write bad code — it's that your harness doesn't prevent drift or make existing patterns discoverable. The fix is to stop treating entropy as a periodic human cleanup task and start treating it like garbage collection: continuous, automated, and incremental.

Here's a concrete plan, ordered by impact-per-effort.

---

## Phase 1: Stop the Bleeding (1-2 days)

### 1.1 Create a Utility Registry That Agents Actually Find

Agents reimplement utilities because they can't discover them. Fix this structurally:

**Create a `CLAUDE.md` (or `AGENTS.md`) entry that points to shared utilities:**

```markdown
## Shared Utilities — CHECK BEFORE IMPLEMENTING

Before writing any utility function, search these locations:
- `src/utils/` — General-purpose helpers
- `src/lib/` — Domain-agnostic libraries
- `src/shared/` — Cross-module shared code

Run `rg "export function" src/utils/ src/lib/ src/shared/` to see what exists.

DO NOT create new utility functions without first confirming no equivalent exists.
```

**Create a `src/utils/INDEX.md`** (or wherever your shared code lives) that catalogs every utility with a one-line description. This becomes Tier 2 context that agents load when working in that directory. Example:

```markdown
# Utility Index

| Function | File | Purpose |
|----------|------|---------|
| `formatCurrency(amount, locale)` | `format.ts` | Format Decimal to locale currency string |
| `retry(fn, opts)` | `retry.ts` | Exponential backoff wrapper |
| `slugify(text)` | `string.ts` | URL-safe slug from arbitrary text |
```

This index is the single highest-leverage artifact for preventing duplication. Keep it updated (automate this — see Phase 2).

### 1.2 Add a Deduplication Lint Rule

Create a custom lint rule or structural test that flags common patterns of reimplementation:

- **Import boundary checks**: If a module defines a function with the same name or signature as one in `utils/`, flag it.
- **Pattern detection**: Use a simple script that runs `rg` for common hand-rolled patterns (date formatting, retry logic, string manipulation) and alerts when they appear outside the shared directory.
- **Pre-commit hook**: Add a lightweight check that greps for known utility function names being redefined. The error message should say exactly where the existing implementation lives:

```
ERROR: Function `formatCurrency` already exists in src/utils/format.ts:42.
Import it instead of reimplementing: `import { formatCurrency } from '@/utils/format'`
```

This is the "custom lint with remediation message" pattern — the lint error itself teaches the agent how to fix the problem.

### 1.3 Shrink Your Root CLAUDE.md / AGENTS.md

If your root agent doc is over ~1500 tokens, it's too long. Agents perform best when their Tier 1 context is a concise map (project overview, directory structure, key commands, top constraints, pitfalls). Everything else should be extracted:

1. **Module-specific conventions** go in subdirectory `CLAUDE.md` files
2. **Code style rules** become linter/formatter config (delete the prose)
3. **Detailed specs** move to `docs/`
4. **Business rules** move to domain-level docs

Rule of thumb: if a rule can be enforced mechanically, promote it to a lint rule and remove it from documentation. A failing lint check is worth 10x a documented guideline.

---

## Phase 2: Automate Entropy Management (1 week)

Replace "Friday cleanup day" with automated entropy agents that run continuously.

### 2.1 Doc-Gardening Agent (Weekly Cron)

Set up a scheduled agent (via CI cron job, GitHub Action, or a simple script) that:

1. Scans every `CLAUDE.md` / `AGENTS.md` file in the repo
2. Cross-references documented file paths, commands, and module names against the actual codebase
3. Flags stale references (files that no longer exist, commands that fail, modules that were renamed)
4. Opens a PR with fixes or removal suggestions

**Implementation sketch** (GitHub Actions):

```yaml
name: doc-gardening
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
jobs:
  garden:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run doc-gardening agent
        run: |
          claude --print "Scan all CLAUDE.md and AGENTS.md files in this repo.
          For each documented file path, verify it exists.
          For each documented command, verify it works.
          Open a PR fixing any stale references." \
          --allowedTools "Bash(read-only),Read,Write,Bash(git)"
```

Most of these PRs take under a minute to review.

### 2.2 Deduplication Agent (Weekly Cron)

A scheduled agent that:

1. Scans the codebase for functions/classes with similar names or signatures across different modules
2. Identifies candidates for consolidation into shared utilities
3. Opens targeted PRs that extract duplicates into the shared location and update all call sites
4. Updates the utility index (`src/utils/INDEX.md`)

**What to scan for:**
- Functions with identical names in different modules
- Functions with similar signatures (same parameter types, similar return types)
- Copy-pasted code blocks (use `jscpd` or similar clone detection)
- Hand-rolled implementations of things available in your standard libraries

### 2.3 Pattern Enforcement Agent (Per-PR)

Run a lightweight agent as part of your CI pipeline on every PR:

1. Check the PR diff against established patterns documented in your agent docs
2. Flag deviations: "This PR introduces a new error handling pattern. The established pattern is `Result<T, E>` (see `docs/conventions.md`). Please align or update the convention doc if this is intentional."
3. This catches drift at the PR level, not after it's merged.

**Key insight**: This agent doesn't need to be perfect. It just needs to flag potential issues for human review. Even a 70% hit rate saves significant review time.

### 2.4 Quality Grading Agent (Biweekly)

Create a `docs/QUALITY_SCORE.md` that grades each module/domain on consistency, test coverage, documentation freshness, and pattern compliance. Run an agent biweekly to update it:

```markdown
# Quality Score — Last Updated 2026-03-15

| Module | Consistency | Test Coverage | Doc Freshness | Pattern Compliance | Grade |
|--------|------------|---------------|---------------|--------------------|-------|
| src/api/ | A | B+ | A | A | A |
| src/core/ | B | A | C (stale) | B+ | B |
| src/infra/ | C | D | F (missing) | C | D+ |
```

This gives both humans and agents a clear signal about where to focus cleanup effort.

---

## Phase 3: Structural Prevention (1-2 weeks)

### 3.1 Enforce Module Boundaries Mechanically

Don't just document "module X shouldn't import from module Y" — enforce it:

- **TypeScript**: Use `eslint-plugin-import` with custom boundary rules, or `dependency-cruiser`
- **Python**: Use `import-linter` or write structural tests
- **General**: Write a simple structural test that scans imports and fails if boundaries are violated

Example structural test:

```typescript
// tests/architecture/boundaries.test.ts
test('core/ has no imports from api/ or infra/', () => {
  const coreFiles = glob.sync('src/core/**/*.ts');
  for (const file of coreFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).not.toMatch(/from ['"].*\/(api|infra)\//);
  }
});
```

These tests run in CI and prevent agents from violating architecture regardless of what's in their context window.

### 3.2 Create Pattern Templates

For patterns that recur across the codebase (API endpoints, database migrations, new modules), create template files or scaffold scripts:

```bash
# Instead of agents guessing at the pattern:
./scripts/scaffold-endpoint.sh --name create-user --method POST --path /users
```

This generates the boilerplate with the correct pattern, leaving agents to fill in only the business logic. Agents can't deviate from a pattern they didn't write.

### 3.3 Establish a "Golden Principles" Doc

Document 5-10 opinionated, mechanical rules that keep the codebase consistent. These aren't aspirational — they're enforced:

```markdown
# Golden Principles

1. **Prefer shared utilities over hand-rolled helpers.** Check `src/utils/INDEX.md` first.
   Enforced by: deduplication lint rule + weekly dedup agent.

2. **All data validation uses Zod schemas.** No manual `if (!x)` validation.
   Enforced by: eslint rule `no-manual-validation`.

3. **Error handling uses Result<T, E> pattern.** No throwing in service layer.
   Enforced by: eslint rule `no-throw-in-services`.

4. **Database access only through repository pattern.** No raw SQL outside `src/infra/db/`.
   Enforced by: structural test `tests/architecture/db-access.test.ts`.

5. **New endpoints require integration tests.** PRs adding routes without tests are blocked.
   Enforced by: CI coverage check on `src/api/` directory.
```

Each principle has a mechanical enforcement mechanism. If it can't be enforced, it's a guideline, not a principle — and guidelines drift.

---

## Phase 4: Ongoing Operations

### Replace Friday Cleanup with Continuous GC

| Old Process | New Process |
|-------------|-------------|
| Engineer manually reviews codebase on Friday | Automated agents scan daily/weekly, open small PRs |
| Engineer decides what to clean up | Quality score identifies worst areas; agents target them |
| Cleanup takes a full day | Most auto-generated PRs review in under 1 minute |
| Cleanup knowledge stays in engineer's head | Patterns are encoded in lint rules and agent docs |
| New drift appears Monday morning | Pre-commit hooks and CI catch drift at write time |

### The Feedback Loop

When you see a recurring issue in review:

1. **First occurrence**: Fix it, note it
2. **Second occurrence**: Add it to agent docs (CLAUDE.md pitfalls section)
3. **Third occurrence**: Promote it to a lint rule or structural test

This ratchet ensures the same mistake never persists. Human taste is captured once, then enforced continuously.

### Track Entropy Metrics

Monitor these over time to confirm your harness is working:

- **Duplicate utility count**: Should decrease over time
- **Lint violations per PR**: Should be low and stable
- **Doc freshness score**: Percentage of docs updated within last 90 days
- **Pattern compliance**: Percentage of modules following established patterns
- **Cleanup PR volume**: Initially high (backlog), should stabilize to a low steady state

---

## Summary: The Key Mindset Shift

The problem isn't "agents make messes." The problem is that your harness doesn't make correct behavior the path of least resistance. When agents reimplement utilities, it's because they can't find existing ones. When documentation drifts, it's because no one (human or agent) is tasked with keeping it current. When patterns are inconsistent, it's because patterns are documented rather than enforced.

**The fix is not more human cleanup time. It's:**

1. Make existing code discoverable (utility index, better Tier 1 docs)
2. Make wrong things hard (lint rules, structural tests, CI enforcement)
3. Make cleanup continuous and automated (entropy agents on cron)
4. Capture human taste as code, not prose (every repeated review comment becomes a rule)

Start with Phase 1 (1-2 days of work), measure the impact over two weeks, then proceed to Phase 2. You should see a significant reduction in duplicate utility creation and pattern inconsistency within the first sprint.

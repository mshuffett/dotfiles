# Taming Codebase Entropy from AI Coding Agents

The Friday cleanup day is treating symptoms. The root cause is that agents operate without sufficient awareness of existing code, conventions, and boundaries. You need to shift from reactive cleanup to preventive guardrails that work at the point of code generation. Here's a concrete strategy.

---

## 1. Build a Living Architecture Registry

Agents reimplement utilities because they don't know they exist. Fix this structurally.

**Create a machine-readable module index.** Maintain a file (e.g., `ARCHITECTURE.md` or `architecture.yaml`) that maps domains to their canonical modules, key exports, and usage patterns. This file goes in your CLAUDE.md or equivalent agent instructions so every agent session starts with awareness of what exists.

```yaml
# architecture.yaml
utilities:
  http:
    canonical: src/lib/http-client.ts
    exports: [fetchJson, fetchWithRetry, buildUrl]
    note: "Never use raw fetch() — always use http-client"
  date:
    canonical: src/lib/dates.ts
    exports: [formatDate, parseISO, toRelative]
    note: "Uses date-fns internally. Do not add moment or dayjs."
  logging:
    canonical: src/lib/logger.ts
    pattern: "import { logger } from '@/lib/logger'"
```

**Automate the index generation.** Write a script that scans your `lib/`, `utils/`, `shared/` directories and regenerates the index. Run it in CI so it stays current. A simple approach:

```bash
# generate-architecture-index.sh
# Extracts all named exports from utility modules
for f in src/lib/*.ts src/utils/*.ts; do
  echo "## $(basename $f)"
  grep -E '^export (function|const|class|type|interface)' "$f" | sed 's/export /- /'
done
```

**Add agent instructions that reference the index.** In your project's CLAUDE.md or system prompt:

```
Before implementing any utility function, check architecture.yaml for an existing
canonical module. If one exists, import from it. If you believe a new utility is
needed, add it to the canonical location, not inline.
```

---

## 2. Enforce Conventions with Automated Linting, Not Manual Review

Documentation and patterns drift because humans forget. Machines don't.

**Custom lint rules for your specific patterns.** Use ESLint custom rules (or equivalents for your stack) to enforce:

- No raw `fetch()` calls outside the http-client module
- No duplicate utility function signatures (use a custom rule or `no-restricted-imports`)
- Required import paths for shared modules
- Consistent error handling patterns

Example ESLint config for import enforcement:

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["node-fetch", "axios", "got"],
        "message": "Use src/lib/http-client.ts instead."
      }]
    }],
    "no-restricted-globals": ["error", {
      "name": "fetch",
      "message": "Use fetchJson/fetchWithRetry from @/lib/http-client"
    }]
  }
}
```

**Pre-commit hooks that catch drift.** Add checks that run before every commit:

- Lint passes (catches convention violations)
- Architecture index is up to date (regenerate and diff)
- No new files in directories that should be stable (e.g., a second `utils/http.ts` when `lib/http-client.ts` exists)

```bash
# .husky/pre-commit or similar
#!/bin/sh
# Check for duplicate utility patterns
DUPES=$(grep -rn "export function fetch" src/ --include="*.ts" | grep -v "lib/http-client")
if [ -n "$DUPES" ]; then
  echo "ERROR: fetch utility defined outside canonical location:"
  echo "$DUPES"
  echo "Use src/lib/http-client.ts instead."
  exit 1
fi
```

**CI checks for documentation freshness.** Write a test that verifies key documentation sections match the code:

```typescript
// __tests__/docs-freshness.test.ts
test('API docs list all current endpoints', () => {
  const routeFiles = glob.sync('src/routes/**/*.ts');
  const documentedEndpoints = parseEndpointsFromDocs('docs/api.md');
  const actualEndpoints = routeFiles.flatMap(extractRouteDefinitions);

  const undocumented = actualEndpoints.filter(e => !documentedEndpoints.includes(e));
  expect(undocumented).toEqual([]);
});
```

---

## 3. Use Code Ownership Boundaries (CODEOWNERS + Module Boundaries)

Inconsistent patterns happen because there's no authority over module conventions.

**CODEOWNERS file.** Assign specific engineers as owners of shared infrastructure:

```
# .github/CODEOWNERS
src/lib/          @infra-team
src/utils/        @infra-team
src/types/        @infra-team
architecture.yaml @infra-team
```

**TypeScript project references or module boundaries.** Use tools like `@typescript-eslint/no-restricted-imports`, Nx module boundaries, or turborepo package boundaries to enforce dependency direction:

```json
// .eslintrc for enforcing module boundaries
{
  "rules": {
    "@nx/enforce-module-boundaries": ["error", {
      "depConstraints": [
        { "sourceTag": "scope:feature", "onlyDependOnLibsWithTags": ["scope:shared"] },
        { "sourceTag": "scope:shared", "notDependOnLibsWithTags": ["scope:feature"] }
      ]
    }]
  }
}
```

This prevents agents from accidentally creating circular dependencies or importing feature-specific code into shared modules.

---

## 4. Agent-Specific Guardrails

These target the AI agent workflow specifically.

**Post-generation duplicate detection.** Add a CI step or pre-commit hook that runs after agent-generated code:

```bash
# detect-duplicate-functions.sh
# Uses jscpd (copy-paste detector) to find duplicated logic
npx jscpd src/ --min-lines 5 --min-tokens 50 --reporters consoleFull --blame
```

Configure a threshold: if duplication exceeds X%, the CI check fails and points to the canonical implementation.

**Agent session context priming.** Structure your agent instructions to include a "before you code" checklist:

```markdown
## Before Implementing

1. Search the codebase for existing implementations: `rg "function.*<name>" src/`
2. Check architecture.yaml for the canonical module for this domain
3. If adding a new utility, add it to the canonical location and update architecture.yaml
4. Follow the error handling pattern in src/lib/errors.ts
5. Follow the logging pattern: `logger.info()`, never `console.log()`
```

**Periodic codebase health reports.** Instead of a manual "cleanup Friday," run automated analysis weekly:

```bash
# weekly-health-check.sh
echo "=== Duplicate Detection ==="
npx jscpd src/ --min-lines 5 --reporters json | jq '.statistics.total'

echo "=== Dead Code ==="
npx ts-prune src/ | head -20

echo "=== Lint Violations ==="
npx eslint src/ --format json | jq '[.[] | .errorCount] | add'

echo "=== Undocumented Exports ==="
# Compare exported symbols vs architecture.yaml entries
node scripts/check-undocumented-exports.js

echo "=== File Count by Directory ==="
# Spot directories growing unexpectedly
find src/ -name "*.ts" | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20
```

Post this to Slack/Discord weekly. Engineers address the top items, not a full cleanup day.

---

## 5. Consolidation Sprints Instead of Cleanup Days

Replace the weekly cleanup with targeted, time-boxed consolidation work.

**Automated triage.** Use the health report to auto-generate a prioritized list:

1. **Exact duplicates** (highest priority -- mechanical fix, big impact)
2. **Near duplicates** (same logic, slightly different signatures)
3. **Convention violations** (wrong import paths, non-standard patterns)
4. **Documentation gaps** (new modules not in architecture.yaml)

**Agent-assisted consolidation.** Use the agents themselves to fix entropy. Create a dedicated "consolidation" prompt/command:

```markdown
# consolidate command
Review the following duplicate detection report and:
1. Identify the canonical implementation for each group
2. Replace all duplicates with imports from the canonical module
3. Update architecture.yaml with any new canonical modules
4. Run the full test suite to verify no regressions
```

This is more effective than manual cleanup because agents can do mechanical refactoring across many files quickly.

---

## 6. Concrete Implementation Roadmap

**Week 1: Foundation**
- Create `architecture.yaml` with your top 10-15 shared modules
- Add the "before you code" checklist to your agent instructions (CLAUDE.md or equivalent)
- Set up `jscpd` and run it once to establish a duplication baseline

**Week 2: Guardrails**
- Add `no-restricted-imports` ESLint rules for your 5 most-duplicated utilities
- Add a pre-commit hook that runs the linter
- Add a CI step that checks architecture.yaml is up-to-date

**Week 3: Automation**
- Build the weekly health report script
- Set up CODEOWNERS for shared infrastructure directories
- Create the "consolidate" agent command/prompt

**Week 4: Feedback Loop**
- Review the first weekly health report
- Address the top 5 issues (use agents for mechanical refactoring)
- Refine lint rules based on what the report caught
- Update agent instructions based on the most common mistakes

**Ongoing:**
- Health report runs weekly, team addresses top items
- Architecture.yaml is maintained as part of normal development (enforced by CI)
- Lint rules expand as new patterns emerge
- Agent instructions evolve based on what keeps slipping through

---

## Summary

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| Reimplemented utilities | Agents don't know what exists | Architecture registry + agent instructions |
| Documentation drift | Docs aren't verified by CI | Freshness tests + auto-generated indexes |
| Inconsistent patterns | No enforcement mechanism | Custom lint rules + pre-commit hooks |
| Cleanup doesn't scale | Reactive, manual, unfocused | Automated health reports + targeted consolidation |

The key insight: **make the right thing the easy thing and the wrong thing the loud thing.** Agents will follow conventions if those conventions are in their context. They'll avoid duplicating utilities if they know the utilities exist. And automated checks will catch what slips through -- continuously, not just on Fridays.

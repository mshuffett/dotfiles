# TypeScript Reference

## Framework Detection Matrix

Check these files/patterns to determine what the project uses:

### Package Manager
| Signal | Manager | Install | Run |
|--------|---------|---------|-----|
| `pnpm-lock.yaml` | pnpm | `pnpm install` | `pnpm` |
| `yarn.lock` | yarn | `yarn install` | `yarn` |
| `package-lock.json` | npm | `npm install` | `npx` |
| `bun.lockb` | bun | `bun install` | `bunx` |

### Test Frameworks
| Signal | Framework | Run Tests | Coverage |
|--------|-----------|-----------|----------|
| `vitest` in deps, `vitest.config.*` | Vitest | `vitest run` | `vitest run --coverage` |
| `jest` in deps, `jest.config.*` | Jest | `jest` | `jest --coverage` |
| `@testing-library/*` in deps | Testing Library | (used with Vitest/Jest) | (via parent runner) |
| `mocha` in deps | Mocha | `mocha` | `nyc mocha` |

### E2E Frameworks
| Signal | Framework | Run | Screenshots |
|--------|-----------|-----|-------------|
| `@playwright/test` in deps, `playwright.config.*` | Playwright | `npx playwright test` | `page.screenshot()` |
| `cypress` in deps, `cypress.config.*`, `cypress/` | Cypress | `npx cypress run` | `cy.screenshot()` |
| `puppeteer` in deps | Puppeteer | (custom runner) | `page.screenshot()` |

### Linters & Type Checkers
| Signal | Tool | Run |
|--------|------|-----|
| `tsconfig.json` | TypeScript | `npx tsc --noEmit` |
| `.eslintrc.*`, `eslint.config.*` | ESLint | `npx eslint .` |
| `biome.json` | Biome | `npx biome check .` |
| `.prettierrc*` | Prettier | `npx prettier --check .` |

### App Frameworks
| Signal | Framework | Dev Server |
|--------|-----------|------------|
| `next.config.*` | Next.js | `npm run dev` or `next dev` |
| `vite.config.*` | Vite | `npm run dev` or `vite` |
| `angular.json` | Angular | `ng serve` |
| `svelte.config.*` | SvelteKit | `npm run dev` |
| `remix.config.*`, `@remix-run/*` | Remix | `npm run dev` |

## Running Tests with Coverage

### Vitest
```bash
# Run with coverage (needs @vitest/coverage-v8 or @vitest/coverage-istanbul)
pnpm vitest run --coverage --coverage.reporter=json --coverage.reporter=text

# Coverage output: coverage/coverage-final.json
# Parse: jq '.["src/file.ts"].s' coverage/coverage-final.json
```

If coverage package not installed:
```bash
pnpm add -D @vitest/coverage-v8
```

### Jest
```bash
# Run with coverage
pnpm jest --coverage --coverageReporters=json --coverageReporters=text

# Coverage output: coverage/coverage-final.json
```

### Reading Coverage JSON

The `coverage-final.json` format (Istanbul):
```json
{
  "src/utils.ts": {
    "s": { "0": 5, "1": 0, "2": 3 },    // statement counts (0 = uncovered)
    "b": { "0": [3, 0] },                 // branch counts
    "f": { "0": 5, "1": 0 },              // function counts
    "statementMap": { "0": { "start": {"line": 1}, "end": {"line": 1} } }
  }
}
```

To find uncovered lines for a file:
1. Read `statementMap` for line ranges
2. Check `s` for counts — 0 means uncovered
3. Cross-reference with the diff to find uncovered changed lines

## Bootstrapping Playwright

When no e2e framework exists:

```bash
pnpm add -D @playwright/test
npx playwright install --with-deps chromium
```

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',      // adjust to project's dev command
    port: 3000,                   // adjust to project's port
    reuseExistingServer: true,
  },
});
```

Create `e2e/` directory for test files.

## Bootstrapping Cypress

If Cypress is already the project's convention:

```bash
pnpm add -D cypress
npx cypress install
```

## Screenshot Patterns

### Playwright
```typescript
// Full page
await page.screenshot({ path: 'screenshots/name.png', fullPage: true });

// Specific element
await page.locator('.component').screenshot({ path: 'screenshots/component.png' });

// After waiting for content
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/loaded.png' });
```

### Cypress
```javascript
// Full page
cy.screenshot('name');

// Specific element
cy.get('.component').screenshot('component');
```

## Common TypeScript Patterns to Watch For

When reviewing TypeScript PRs, pay special attention to:

- `any` types hiding real type errors
- Missing `null`/`undefined` checks (especially with optional chaining `?.`)
- Async functions without proper error handling (`try/catch` or `.catch()`)
- React hooks dependency arrays — missing deps cause stale closures
- `useEffect` cleanup functions missing for subscriptions/timers
- Incorrect generic type constraints
- `as` type assertions that could mask runtime errors

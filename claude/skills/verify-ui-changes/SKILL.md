---
description: Read this whenever making UI changes. After implementation, verify the change end-to-end with agent-browser (headless), then write and run a Playwright test. Create tasks for both verification steps upfront before starting work.
---

# Verify UI Changes

Any task that modifies UI must include verification. Plan for it upfront — create tasks for browser verification and Playwright test creation before you start writing code.

## Task Planning

When a task involves UI changes, always create these tasks at the start:

1. **Implement the UI change** (the actual work)
2. **Verify with agent-browser** — walk through the full user flow in headless mode
3. **Write Playwright test** — codify the verification into a repeatable test
4. **Run Playwright test** — confirm it passes

Do not mark the work as complete until all four tasks are done.

## Step 1: Verify with agent-browser

After implementation, use `agent-browser` in headless mode to walk the full user flow affected by your change.

```bash
agent-browser open http://localhost:3000/<page>
agent-browser snapshot -i
# Interact: fill forms, click buttons, trigger the behavior you changed
agent-browser fill @e1 "test input"
agent-browser click @e2
agent-browser snapshot -i
# Verify the result — check text, DOM state, navigation
agent-browser get text @e3
agent-browser eval "document.activeElement?.id"
agent-browser get url
```

**What to verify:**
- The changed behavior works as expected
- No regressions in the surrounding flow (login still works, navigation intact)
- Edge cases: empty states, error states, rapid interaction
- DOM state where relevant: focus, disabled, checked, values

**If something is broken**, fix it before moving on. Do not write a test for broken behavior.

## Step 2: Write a Playwright Test

Once agent-browser confirms the behavior is correct, write a Playwright test in `apps/web/tests/`.

**Test location:** `apps/web/tests/<feature>.test.ts`

**Test structure:**

```typescript
import { expect, test } from "@playwright/test";

test.describe("feature name", () => {
  test("describes the specific behavior", async ({ page }) => {
    await page.goto("/todo");

    // Setup: get to the right state
    await page.getByPlaceholder("Add a task").fill("Buy groceries");
    await page.getByPlaceholder("Add a task").press("Enter");

    // Assert: verify the behavior
    await expect(page.getByPlaceholder("Add a task")).toBeFocused();
    await expect(page.getByText("Buy groceries")).toBeVisible();
  });
});
```

**Conventions (from existing tests):**
- Use `@playwright/test` — not Vitest, not Jest
- Tests run against local dev server (auto-started by Playwright config)
- Authenticated tests use `storageState` from the `setup` project — no manual login needed
- Use `getByTestId`, `getByRole`, `getByPlaceholder`, `getByText` — avoid CSS selectors
- Tests live in `apps/web/tests/`
- Global setup creates a test user automatically (`tests/global.setup.ts`)

## Step 3: Run the Test

```bash
cd apps/web
pnpm exec playwright test tests/<feature>.test.ts
```

If the test fails, fix the test or the implementation — do not skip.

To run with visible browser (only if user needs to see it):

```bash
pnpm exec playwright test tests/<feature>.test.ts --headed
```

To debug a failing test:

```bash
pnpm exec playwright test tests/<feature>.test.ts --debug
```

## Acceptance Checks

- [ ] Verified the full user flow with agent-browser after implementation
- [ ] No regressions found in surrounding flows
- [ ] Playwright test written and committed in `apps/web/tests/`
- [ ] Playwright test passes on run

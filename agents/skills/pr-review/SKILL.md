---
name: pr-review
description: Thorough automated PR review — finds bugs, checks test coverage (unit/integration/e2e/UI), writes missing tests, takes screenshots of UI changes, fixes all issues, and generates a markdown report. Use when a PR is checked out and needs comprehensive review, when the user says "review this PR", "check this PR", "PR review", "review the changes", or when running as part of CI/CD. Works for Python and TypeScript repos. Also use when the user wants to verify test coverage, check for missing e2e tests, or validate that UI changes have proper visual testing.
---

# PR Review

Automated, comprehensive PR review that finds issues, checks test coverage, writes missing tests, runs e2e/UI tests with screenshots, fixes everything it can, and produces a structured report.

Designed for async/CI-like execution — fix everything possible, minimize human intervention.

## Non-Negotiable: Tests Must Actually Run

Writing test files is not verification. **You must install dependencies, start servers, and execute every test you write.** If a test file exists but was never run, it proves nothing. If a screenshot path appears in test code but no `.png` file exists on disk, the review is incomplete.

The sequence is: write tests → install deps → start server → run tests → verify screenshots exist → embed in report.

If something blocks execution (missing env vars, broken build), you must try to fix it. Only if you genuinely cannot run tests after multiple attempts should you document the blocker in the report — and that counts as a partial failure of the review.

## Prerequisites

- PR branch checked out in current directory
- `gh` CLI available (for base branch detection)
- Git repo with remote configured

## Workflow Overview

```
1. Detect Environment   →  language, frameworks, base branch, changed files
2. Static Analysis      →  lint, typecheck, code review for bugs/security
3. Test Coverage Scan   →  run existing tests with coverage, map to changed lines
4. Gap Identification   →  what changed lines lack tests? what user flows are affected?
5. Write Missing Tests  →  unit, integration, e2e — fill the gaps
6. E2E / UI Verification  →  run e2e tests, screenshot affected flows
7. Fix All Issues       →  auto-fix lint, type errors, bugs, security issues
8. Generate Report      →  structured markdown at ./pr-review-report.md
9. Commit               →  auto-commit all fixes and new tests
```

## Step 1: Detect Environment

### Base Branch Detection

Detect the base branch automatically — never ask the user.

```bash
# Try GitHub CLI first (works if PR exists)
BASE=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null)

# Fallback: detect default branch from remote
if [ -z "$BASE" ]; then
  BASE=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}')
fi

# Last resort
if [ -z "$BASE" ]; then
  BASE=$(git branch -r | grep -E 'origin/(main|master)' | head -1 | sed 's|origin/||;s/^[[:space:]]*//')
fi

MERGE_BASE=$(git merge-base "$BASE" HEAD)
```

### Changed Files

```bash
git diff --name-only "$MERGE_BASE"...HEAD
git diff --stat "$MERGE_BASE"...HEAD
```

### Language & Framework Detection

Read the relevant reference file based on what you find:

| Signal | Language | Reference |
|--------|----------|-----------|
| `package.json`, `tsconfig.json`, `.ts`/`.tsx` files | TypeScript | `references/typescript.md` |
| `pyproject.toml`, `setup.py`, `requirements.txt`, `.py` files | Python | `references/python.md` |

If both are present (monorepo), read both and handle each part separately.

Detect test frameworks, linters, and e2e tools from config files — the reference files have the full detection matrix.

## Step 2: Static Analysis

Run all applicable checks. Don't stop at the first failure — collect everything.

### Linting & Type Checking

Run the project's configured linter and type checker. See the language reference for specifics.

### Code Review

Read every changed file carefully. Look for:

- **Bugs**: logic errors, off-by-one, null/undefined access, race conditions, incorrect error handling
- **Security**: injection (SQL, XSS, command), auth bypass, secrets in code, unsafe deserialization, path traversal
- **API misuse**: wrong method signatures, deprecated APIs, incorrect async/await patterns
- **Edge cases**: empty arrays, null inputs, boundary values, concurrent access
- **Breaking changes**: changed function signatures, removed exports, altered return types

For each issue found, record:
- File and line number
- Severity (critical / high / medium / low)
- Description of the issue
- Whether you can auto-fix it

## Step 3: Test Coverage Scan

Run existing tests with coverage enabled. The goal is to understand what the PR's changed lines are covered by.

### Run Tests with Coverage

Use the project's test runner with coverage flags. See language references for exact commands.

### Map Coverage to Changed Lines

For each file changed in the PR:
1. Get the lines that changed (from the diff)
2. Check coverage data for those specific lines
3. Classify each changed line as: covered by unit test, covered by integration test, covered by e2e test, or uncovered

### Coverage Summary

Produce a per-file breakdown:

```
src/components/LoginForm.tsx
  Changed lines: 45    Covered: 32 (71%)
  Unit: 28  Integration: 4  E2E: 0
  Uncovered lines: 12-15, 28-30, 42-50 (form validation logic)
```

## Step 4: Gap Identification

This is the critical thinking step. For each uncovered area:

1. **What kind of test is missing?** A utility function needs a unit test. An API endpoint needs an integration test. A form submission needs an e2e test.
2. **What user flows are affected?** If a React component changed, what does the user see/do? If an API endpoint changed, what client behavior depends on it?
3. **Are there UI changes?** Any changes to components, templates, views, or styles mean UI testing is needed. Detect by looking for changes in:
   - `.tsx`, `.jsx`, `.vue`, `.svelte` files (component changes)
   - `.css`, `.scss`, `.module.css`, `.styled.ts` files (style changes)
   - Template files (`.html`, `.jinja2`, `.ejs`)
   - Any file that renders UI (check for render/return JSX, HTML generation)

### User Flow Mapping

For each UI change, identify the user flow it belongs to:

```
Changed: src/components/CheckoutForm.tsx (lines 45-80, payment validation)
User Flow: Checkout → Enter payment → Validate card → Submit order
E2E Test Needed: Navigate to checkout, fill form, submit with valid/invalid card, verify result
```

## Step 5: Write Missing Tests

Write tests to fill every gap identified in Step 4. Follow project conventions — match existing test file naming, patterns, and assertion styles.

### Unit Tests

For pure functions, utilities, and isolated logic. Place next to the source file or in the project's test directory (match existing convention).

### Integration Tests

For API endpoints, database operations, service interactions. Test the real integration points, not mocks (unless the project convention is to mock).

### E2E / UI Tests

For user-facing flows affected by the PR. This is where screenshots happen.

#### Framework Detection & Bootstrap

Check for existing e2e setup:
- **Playwright**: `playwright.config.ts`, `playwright.config.js`, `@playwright/test` in package.json, `pytest-playwright` in requirements
- **Cypress**: `cypress.config.ts`, `cypress/` directory
- **Selenium**: `selenium` in requirements, `webdriver` imports

**If no e2e framework exists**, bootstrap Playwright:
- TypeScript: `pnpm add -D @playwright/test && npx playwright install --with-deps chromium`
- Python: `pip install playwright pytest-playwright && playwright install --with-deps chromium`
- Create a minimal config file

#### Writing E2E Tests

Each e2e test should:
1. Navigate to the relevant page/view
2. Perform the user action that the PR changed
3. Assert the expected outcome
4. **Take a screenshot** at each key step (before action, after action, error states)

Screenshot naming convention:
```
screenshots/
  {test-name}-{step}-{timestamp}.png
```

After capturing screenshots, reference them in the report using relative paths:

```markdown
![Checkout initial state](screenshots/checkout-initial.png)
![Checkout after submit](screenshots/checkout-submitted.png)
```

Ensure the `screenshots/` directory is committed alongside the report so images render when viewing the markdown.

**Critical**: Every `page.screenshot({ path: "screenshots/X.png" })` in your e2e tests must have a matching `![X](screenshots/X.png)` in the report's UI verification section. The report is the deliverable — if a screenshot path exists in test code but not in the report, the reviewer can't see it.

Example Playwright (TypeScript):
```typescript
test('checkout form validates payment', async ({ page }) => {
  await page.goto('/checkout');
  await page.screenshot({ path: 'screenshots/checkout-initial.png', fullPage: true });

  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="expiry"]', '12/25');
  await page.click('button[type="submit"]');

  await page.screenshot({ path: 'screenshots/checkout-submitted.png', fullPage: true });
  await expect(page.locator('.success-message')).toBeVisible();
});
```

#### Running E2E Tests — This Is Not Optional

You must actually execute the e2e tests and produce real screenshot files. Writing a test file without running it is like writing a prescription without filling it.

**Step-by-step execution chain:**

1. **Install dependencies** — This is the step most commonly skipped. Do it.
   - TypeScript: `pnpm install` (or npm/yarn based on lockfile)
   - Python: `pip install -e ".[dev]"` or `pip install -r requirements.txt`
   - Install the e2e framework: `npx playwright install --with-deps chromium` or `playwright install --with-deps chromium`

2. **Start the dev server** in the background
   - Detect from `package.json` scripts (`dev`, `start`), or framework config
   - `nohup pnpm dev > /dev/null 2>&1 &` or equivalent
   - Wait for it: `until curl -s http://localhost:3000 > /dev/null; do sleep 1; done`

3. **Run the e2e tests**
   - `npx playwright test` or `pytest e2e/ --browser chromium`
   - If tests fail, read the output, fix the test or the code, and re-run

4. **Verify screenshots exist on disk**
   - `ls screenshots/*.png` — if this returns nothing, the review is incomplete
   - Each `.png` file should be non-empty

5. **Stop the dev server**
   - Kill the background process

6. **Wire screenshots into the report** — see Step 7

If the dev server won't start (missing env vars, database, etc.):
- Try to fix it (mock the DB, add env vars, stub external services)
- If truly blocked, document exactly what failed and what you tried in the report's Remaining Risks section
- Still commit the test files so they can be run later

## Step 6: Fix All Issues

Fix everything you found. This is an aggressive, CI-mode skill — fix, don't flag.

### What to fix:
- Lint errors and warnings
- Type errors
- Obvious bugs (null checks, off-by-one, incorrect logic)
- Missing error handling
- Security vulnerabilities (injection, auth issues, exposed secrets)
- Missing input validation
- Incorrect API usage
- Broken imports / dead code introduced by the PR

### What to flag only (in the report):
- Architectural concerns that would require redesign
- Performance issues that need profiling to confirm
- Decisions that are ambiguous without business context

After fixing, re-run the full test suite to ensure fixes don't introduce regressions.

## Pre-Report Checklist

Before generating the report, verify:

- [ ] `pnpm install` / `pip install` was run (dependencies installed)
- [ ] Unit tests were executed (not just written) — paste the test runner output
- [ ] If UI changes exist: dev server was started, e2e tests were run, `ls screenshots/*.png` shows files
- [ ] If no UI changes: confirmed no UI files in the diff, skip e2e
- [ ] All bugs found were fixed in the source code
- [ ] Fixed code was re-tested to confirm fixes work

If any checkbox is unchecked, go back and do it before proceeding.

## Step 6.5: Record UI Interaction GIF (if UI changes exist)

If the PR includes UI changes, record a GIF showing the key interaction with a realistic animated cursor. This becomes the hero image at the top of the PR comment — reviewers immediately see what the change looks and feels like. Skip this step if there are no UI changes.

### How it works

Use Playwright's video recording with an injected macOS-style cursor overlay. The real browser cursor is invisible in Playwright recordings, so we inject a fake one via `addInitScript` that tracks mouse events and has a click-press animation.

### Step-by-step

**1. Identify the key interaction.** What's the single most important thing this PR changes visually? A toggle, a form submission, a modal, a new page. Pick the one thing that tells the story.

**2. Find the CSS selector** for the interactive element. Check the component source for `aria-label`, `data-testid`, or structure (`button:has(svg)`, `[role="switch"]`, etc.).

**3. Write the recording script.** Create a file like `record-demo.ts` in the project:

```typescript
import { chromium } from "playwright";

// Helper: smooth arc cursor movement with ease-out
async function smoothMove(page, fromX, fromY, toX, toY, steps = 50, arc = -40) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = 1 - Math.pow(1 - t, 3);
    await page.mouse.move(
      fromX + (toX - fromX) * ease,
      fromY + (toY - fromY) * ease + Math.sin(t * Math.PI) * arc
    );
    await page.waitForTimeout(16);
  }
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: "./recordings", size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  // Inject visible macOS cursor (36px, white arrow with black stroke, drop shadow)
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "fake-cursor";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "36");
      svg.setAttribute("height", "36");
      svg.setAttribute("viewBox", "0 0 24 24");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z");
      path.setAttribute("fill", "white");
      path.setAttribute("stroke", "black");
      path.setAttribute("stroke-width", "1.2");
      svg.appendChild(path);
      cursor.appendChild(svg);
      cursor.style.cssText = "position:fixed;top:0;left:0;z-index:999999;pointer-events:none;transform-origin:top left;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));transition:left 0.08s ease-out,top 0.08s ease-out";
      document.body.appendChild(cursor);
      let curX = 0, curY = 0;
      document.addEventListener("mousemove", (e) => { curX = e.clientX; curY = e.clientY; cursor.style.left = curX + "px"; cursor.style.top = curY + "px"; });
      document.addEventListener("mousedown", () => {
        cursor.style.transform = "scale(0.8)";
        // Red circle ripple — uses rAF loop so Playwright's video recorder captures every frame
        const ring = document.createElement("div");
        ring.style.cssText = "position:fixed;pointer-events:none;z-index:999998;border-radius:50%;box-sizing:border-box;";
        ring.style.left = curX + "px";
        ring.style.top = curY + "px";
        document.body.appendChild(ring);
        const start = performance.now(), dur = 500, max = 50, bw = 3;
        (function anim() {
          const p = Math.min((performance.now() - start) / dur, 1);
          const e = 1 - Math.pow(1 - p, 2), s = max * e, o = 1 - p;
          ring.style.width = s + "px"; ring.style.height = s + "px";
          ring.style.marginLeft = -(s/2) + "px"; ring.style.marginTop = -(s/2) + "px";
          ring.style.border = bw + "px solid rgba(255,59,48," + (o*0.9) + ")";
          ring.style.background = "rgba(255,59,48," + (o*0.2) + ")";
          p < 1 ? requestAnimationFrame(anim) : ring.remove();
        })();
      });
      document.addEventListener("mouseup", () => { cursor.style.transform = "scale(1)"; });
    });
  });

  await page.goto("http://localhost:5199");
  await page.waitForLoadState("networkidle");
  await page.mouse.move(100, 400);
  await page.waitForTimeout(1000);

  // --- CUSTOMIZE THIS SECTION FOR EACH PR ---
  const target = page.locator('YOUR_SELECTOR_HERE').first();
  const box = await target.boundingBox();
  if (!box) { console.error("Target not found"); await context.close(); await browser.close(); return; }
  const tx = box.x + box.width / 2, ty = box.y + box.height / 2;

  // Move to target, click, pause, click again (for toggles) or adjust for your interaction
  await smoothMove(page, 100, 400, tx, ty);
  await page.waitForTimeout(400);
  await page.mouse.click(tx, ty);
  await page.waitForTimeout(2000);

  // For toggles: drift away, come back, click again
  await smoothMove(page, tx, ty, tx + 80, ty + 60, 15, -10);
  await page.waitForTimeout(800);
  await smoothMove(page, tx + 80, ty + 60, tx, ty, 20, -20);
  await page.waitForTimeout(400);
  await page.mouse.click(tx, ty);
  await page.waitForTimeout(1500);
  // --- END CUSTOMIZATION ---

  // Exit cursor
  await smoothMove(page, tx, ty, 200, 500, 20, -15);
  await page.waitForTimeout(500);
  await context.close();
  await browser.close();
})();
```

Adapt the `CUSTOMIZE` section for the PR's interaction:
- **Toggle/switch**: click, pause in new state, click back (as shown above)
- **Form**: fill fields with `page.fill()`, then click submit, show result
- **Modal/dialog**: click trigger, show modal, close it
- **Navigation**: click link, show new page, go back

**4. Run it:**

```bash
# Start dev server on a unique port
nohup pnpm dev --port 5199 > /dev/null 2>&1 &
until curl -s http://localhost:5199 > /dev/null; do sleep 1; done

# Record
mkdir -p recordings
bun record-demo.ts

# Convert to GIF (800px wide, 15fps, optimized palette)
ffmpeg -i recordings/*.webm \
  -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 screenshots/ui-demo.gif

# Clean up
rm -rf recordings record-demo.ts
kill $(lsof -ti:5199) 2>/dev/null
```

**5. Verify:** `ls -lh screenshots/ui-demo.gif` — should be 3-8MB for a ~10 second recording at 800px wide.

### Key details

- **Cursor size**: 36px (SVG viewBox 0 0 24 scaled up). Visible but not cartoonish.
- **Cursor smoothing**: CSS `transition: left 0.08s ease-out, top 0.08s ease-out` on the cursor div interpolates between mouse positions, eliminating jitter in the recording.
- **Cursor movement**: 50 steps at 16ms intervals with ease-out cubic and a slight arc (`Math.sin(t * Math.PI) * arc`). Feels natural, not robotic.
- **Click animation**: scale(0.8) on mousedown, scale(1) on mouseup. Plus a red circle ripple (50px, 3px red border + 0.2 opacity fill) animated via `requestAnimationFrame` loop — CSS transitions don't reliably render in Playwright's video capture, but rAF loops do.
- **Drop shadow**: `drop-shadow(0 2px 4px rgba(0,0,0,0.4))` on the cursor so it's visible on both light and dark backgrounds.
- **GIF conversion**: two-pass palette generation via ffmpeg (`palettegen` + `paletteuse`) produces much better colors than single-pass.
- **Port 5199**: use a non-standard port to avoid conflicts with running dev servers.

## Step 7: Generate Report and Post to PR

Two outputs: a committed markdown file and a GitHub PR comment.

### 7a. Commit `./pr-review-report.md`

Write the report using the template in `references/report-template.md`. Use relative screenshot paths (`![](screenshots/name.png)`).

### 7b. Post as GitHub PR comment

Convert screenshot paths to raw GitHub URLs and post with `gh pr comment`:

```bash
# Get repo info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
BRANCH=$(git branch --show-current)
SHA=$(git rev-parse HEAD)

# Convert paths and post
sed "s|screenshots/|https://raw.githubusercontent.com/$REPO/$BRANCH/screenshots/|g" pr-review-report.md > /tmp/pr-comment.md
gh pr comment --body-file /tmp/pr-comment.md
```

### Report structure

The report uses collapsible sections so critical findings are visible immediately and details are one click away. See `references/report-template.md` for the full template. Key principles:

- **Above the fold**: shields.io badges (issues/coverage/tests/screenshots), `[!CAUTION]` block with critical security findings and diff blocks, `[!WARNING]` for merge blockers
- **Collapsed**: remaining issues table, test details, screenshots grouped by user flow
- **Every issue links to the code**: `https://github.com/{owner}/{repo}/blob/{SHA}/{path}#L{line}`
- **Every screenshot in e2e test code appears in the report**: extract paths from `page.screenshot()` calls, group by flow, use `<img width>` for sizing and `<table>` for side-by-side

## Step 8: Commit

Commit all changes (fixes + new tests + report + screenshots) in a single commit:

```bash
git add -A
git commit -m "chore(pr-review): auto-fix issues, add missing tests, and generate review report

- Fixed N issues (X critical, Y high, Z medium)
- Added N unit tests, N integration tests, N e2e tests
- Coverage for changed lines: XX% → YY%
- Screenshots captured for N user flows
- Full report: pr-review-report.md"
```

## Error Handling

Things will go wrong. Fix them — don't skip.

- **Dependencies not installed**: Install them. This is step 1, not an error. Run `pnpm install`, `pip install`, etc. If the install fails, read the error and fix it (missing system deps, Python version, Node version).
- **Tests won't run**: Read the error. Missing import? Fix the test. Wrong config? Fix the config. Missing env var? Set a sensible default or mock it. Try at least 3 different approaches before giving up.
- **Dev server won't start**: Check the port, check for missing env vars, check for database requirements. Try `PORT=3001` if 3000 is busy. Stub external services if needed. Create a `.env` with sensible defaults.
- **Coverage tool not configured**: Install and configure it. See language references for defaults.
- **No test directory exists**: Create one following the project's directory structure conventions.
- **Playwright not installed**: Install it. `npx playwright install --with-deps chromium` takes 30 seconds.

The pattern when something fails is: **read error → diagnose → fix → retry**. Not: read error → give up → write "couldn't run tests" in report.

Never silently skip a step. If something fails after genuine effort, document what failed, what you tried, and why it's blocked in the report.

## Important Principles

- **Completeness over speed**: This runs async. Take the time to be thorough.
- **Evidence over assertions**: Every claim in the report should be backed by a test result, screenshot, or specific line reference.
- **Fix, don't flag**: The default is to fix. Only flag when fixing requires human judgment.
- **Screenshots are proof**: For every UI change, screenshots are the evidence that it was verified. No screenshots = not verified.
- **Respect project conventions**: Match existing code style, test patterns, and directory structure. Don't impose patterns the project doesn't use.

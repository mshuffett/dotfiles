# Memory / Skills Regression Tests (Real Integration Testing)

Goal: turn memory/skill improvements into verifiable, repeatable wins.

## Why This Exists

Memory changes are easy to "feel" correct and hard to verify. This protocol forces:

- a reproducible failing case (before),
- a concrete fix (change),
- and proof the behavior improved (after),
while guarding against regressions.

## Red -> Green Protocol (No Fake Testing)

When a memory improvement is meant to fix something specific:

1. **Red**: add a test that reproduces the failure mode.
   - It must fail before the change.
   - The assertion must be stable and meaningful (regex on key safety/verification language).
2. **Green**: implement the smallest memory/skill change that addresses the failure.
3. **Verify**:
   - Run the suite (`./script/agent-regress ...`) and ensure:
     - the new test passes,
     - existing tests still pass,
     - timing is not dramatically worse (if relevant).
4. **Capture**:
   - In the commit message, include:
     - what failed before,
     - what changed,
     - what was run as proof (suite command),
     - any new tradeoffs/risks discovered.

## What To Test

Prefer testing high-leverage guardrails and behaviors that are expensive when missed:

- Safety constraints (ports, git stash/worktrees, secrets)
- Verification discipline ("evidence not vibes")
- Repo hygiene (no stray artifacts)
- Delegation tradeoffs (subagent handoff completeness)
- Context management (explicit acceptance criteria, ambiguity resolution)

## Running The Suite

```bash
./script/agent-regress --suite agents/evals/suites/memory-smoke.json
```

Notes:

- This runs **real** `claude`/`codex` CLI calls, which may cost money and take time.
- Keep the smoke suite small; create additional suites for larger coverage.

## Deep Link Tests (Prove The Hop)

When you want to verify the agent actually traverses entrypoint skills into deeper notes (and doesn't just answer generically), use a suite that requires cryptographic evidence.

This repo supports an additional assertion field:

- `expect_file_sha256`: list of repo-relative file paths
  - the runner computes each file's SHA256 and asserts the agent output includes the digest

Run the deep suite:

```bash
./script/agent-regress --suite agents/evals/suites/memory-deep.json
```

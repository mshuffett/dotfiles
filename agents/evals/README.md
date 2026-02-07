# Agent Evals (Skills / Memory Regression)

This folder defines a lightweight, real integration-test style harness for validating that skills/memory configuration changes improve behavior without regressions.

Key properties:

- Real: runs actual `claude` and `codex` CLIs (no mock testing).
- Sandboxed: runs with an isolated `HOME` that symlinks in the repo's memory config.
- Measurable: records pass/fail, timing, and matched/missed assertions.

## Run

```bash
./script/agent-regress --suite agents/evals/suites/memory-smoke.json
```

## Add A Test (Red -> Green)

When a memory/skill change is intended to fix a specific failure mode:

1. Add a test that reproduces the failure (it should fail first).
2. Implement the memory/skill improvement.
3. Re-run the suite and ensure the new test now passes and no existing tests regress.

Protocol details:

- `agents/knowledge/protocols/memory-regression-tests.md`


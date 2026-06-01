---
name: prompt-engineering
description: Use when developing, aligning, calibrating, or improving ANY prompt, read-trigger description, agent instruction, or output style. Two modes — (1) alignment: fit a prompt to example input→output pairs and test generalization; (2) self-improvement: turn user corrections into a growing test suite and iterate via isolated subagents. Trigger on "align this prompt", "the prompt gave wrong output", "improve/calibrate this prompt", "make this prompt self-improving", "tune the trigger description", or running a prompt improvement cycle. NOT for general copywriting or prose editing — use the writing skill for that.
---

# Prompt Engineering

Two complementary workflows for making prompts reliable. Pick the mode that fits the situation:

| Mode | Use when | Reference |
|------|----------|-----------|
| **Alignment** | Building or tuning a prompt from scratch; you have (or can write) example X→Y pairs and want it to fit them and generalize to unseen cases | [references/alignment.md](references/alignment.md) |
| **Self-improvement** | A deployed prompt produces occasionally-wrong output; you want each correction to become a permanent test case | [references/self-improvement.md](references/self-improvement.md) |

They compose: use **alignment** for initial development, then **self-improvement** for ongoing calibration after deployment.

## Shared principles

These hold in both modes — read the why, not just the rule:

- **Test steering power in isolation.** Run the prompt where the tester cannot see the expected answer (the orchestrator/subagent pattern in self-improvement). If the agent can see the right answer, it produces it regardless of whether the prompt actually steers there — so isolation is what makes the test meaningful.
- **Smallest effective change.** Propose the minimal edit that fixes the widest set of failures, then re-test for regressions before accepting. Good improvements often make the prompt *shorter*, not longer.
- **Approve before writing.** Present the diff + rationale + test results; don't write prompt files until explicitly approved.

## Live testing (Claude CLI)

```bash
time claude -p --print --output-format text \
  --system-prompt "$(cat .claude/debug/sample-prompt.md)" \
  "ping"
```

Codex alternative, the fit-to-generalize rubric, and read-trigger-description patterns: see [references/alignment.md](references/alignment.md). Full session structure, subagent execution, and the improvement-log template: see [references/protocol.md](references/protocol.md).

## Related

- **eval-triage** (productivity plugin) — an automated LLM-as-judge implementation of the self-improvement loop for Todoist classification.
- **mistake-tracking** — for tracking Claude's own operational mistakes; this skill tracks *prompt output* quality.

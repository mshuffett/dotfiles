---
description: Evaluate and calibrate the Todoist triage classifier. Use when testing prompt improvements, reviewing classification accuracy, or processing corrections.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Eval Triage Command

Evaluate the Todoist triage classifier against a test dataset and process corrections.

## Overview

This command helps calibrate the triage classifier by:
1. Fetching real Todoist tasks
2. Classifying them with Sonnet
3. Judging classifications with Opus (LLM-as-a-judge)
4. Reviewing results and adding corrections with criteria
5. Feeding corrections back to improve the dataset

The live skill surface is the consolidated `todoist` skill:

- `~/.dotfiles/agents/skills/todoist/SKILL.md`
- `~/.dotfiles/agents/skills/todoist/references/triage-policy.md`
- `~/.dotfiles/agents/skills/todoist/references/context-recovery.md`
- `~/.dotfiles/agents/skills/todoist/references/preference-memory.md`
- `~/.dotfiles/agents/skills/todoist/references/evals.md`

## Quick Start

```bash
cd ~/.dotfiles/claude-plugins/productivity/scripts/todoist-eval

# Install deps (first time only)
pnpm install

# 1. Fetch fresh tasks
pnpm fetch --filter "today|overdue"

# 2. Classify and generate review doc
pnpm classify

# 3. Open /tmp/triage-review.md, review classifications
# 4. Add corrections in YAML format (see template at bottom)

# 5. Apply corrections to dataset
pnpm apply --review /tmp/triage-review.md

# 6. Run full eval to check accuracy
pnpm eval --dataset-only
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `pnpm fetch` | Fetch tasks from Todoist |
| `pnpm classify` | Classify tasks with Sonnet |
| `pnpm judge` | Judge classifications with Opus |
| `pnpm apply` | Apply corrections from review doc |
| `pnpm eval` | Run full evaluation pipeline |
| `pnpm info` | Show dataset info |

## Adding Corrections

In the review document, add corrections using this YAML format:

```yaml
corrections:
  - taskId: "8564373812"
    expected:
      bucket: "clear_action"
      confidence: 92
      recommendedNextStep: "Review the linked SOP and approve or reject it."
    criteria: "APPROVE prefix means a bounded decision gate, so this should be handled as a direct clear action rather than an ambiguous tracked item."
```

The `criteria` field is critical - it tells the judge WHY this classification is correct, which helps calibrate future evaluations.

## Models Used

- **Classifier**: claude-sonnet-4-5-20250929 (fast, good for batch classification)
- **Judge**: claude-opus-4-5-20251101 (independent, catches blind spots)

## Dataset Location

Legacy golden dataset with criteria is managed by the TypeScript module:
```
~/.dotfiles/claude-plugins/productivity/scripts/todoist-eval/src/data/dataset.ts
```

Legacy dataset file:
```
~/.dotfiles/agents/skills/todoist/fixtures/eval-dataset.json
```

Richer copilot/calibration eval cases:
```
~/.dotfiles/agents/skills/todoist/fixtures/triage-evals.v2.json
```

## Workflow Loop

```
Fetch → Classify → Review → Correct → Apply → Eval → Repeat
                     ↑                           ↓
                     └───────────────────────────┘
```

Each iteration improves:
1. The golden dataset (more examples with criteria)
2. Your understanding of edge cases
3. Eventually, the classifier prompt itself

## Integration with /triage-todoist

Once the classifier is calibrated, the learnings can be applied to:
- `~/.dotfiles/agents/skills/todoist/SKILL.md` - Update routing and guardrails
- `~/.dotfiles/agents/skills/todoist/references/triage-policy.md` - Update decision policy
- `~/.dotfiles/agents/skills/todoist/references/context-recovery.md` - Update retrieval behavior
- `~/.dotfiles/agents/skills/todoist/references/preference-memory.md` - Promote durable rules

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
      quadrant: "Q3"
      action: "Quick"
    criteria: "APPROVE prefix means quick decision (<5 min), not a tracked action item"
```

The `criteria` field is critical - it tells the judge WHY this classification is correct, which helps calibrate future evaluations.

## Models Used

- **Classifier**: claude-sonnet-4-5-20250929 (fast, good for batch classification)
- **Judge**: claude-opus-4-5-20251101 (independent, catches blind spots)

## Dataset Location

Golden dataset with criteria lives at:
```
~/.dotfiles/claude-plugins/productivity/skills/todoist-triage/fixtures/eval-dataset.json
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
- `skills/todoist-triage/SKILL.md` - Update classification rules
- `agents/todoist-triage-classifier.md` - Update agent prompt
- `commands/triage-todoist.md` - Update workflow

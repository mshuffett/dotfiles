---
description: Check the status of the current or specified plan
argument-hint: [plan-name]
---

# Plan Status

Check the status of a plan in `./plans/`.

## Arguments

$ARGUMENTS

If no plan name provided, look for an active plan (status: draft or review in `./plans/*/index.md`).

## Process

1. **Find the plan**
   - If plan name given: `./plans/<plan-name>/index.md`
   - If no name: scan `./plans/*/index.md` for active plans

2. **Read plan files**
   - Read `index.md` for overall status and sub-plan manifest
   - Read other docs to check section statuses

3. **Parse statuses**
   - Document status from YAML frontmatter
   - Section status from `<!-- status: X -->` markers

4. **Display summary**

## Output Format

```
Plan: <plan-name>
Status: <overall status>
Created: YYYY-MM-DD
Updated: YYYY-MM-DD

Documents:
  index.md           approved
  requirements.md    review (2 sections pending)
  technical.md       draft

Sub-Plans:
  auth-flow.md       approved
  api-design.md      draft (blocked by: auth-flow)

Critical Path:
  Next: Review "Scope" section in requirements.md
```

## Status Indicators

Use these indicators:
- `approved` - Ready/complete
- `review` - Needs user review
- `draft` - Work in progress
- `blocked` - Waiting on dependency

If sections within a document have mixed status, show the document status with a note:
- `review (2 sections pending)` - Document in review but some sections still draft

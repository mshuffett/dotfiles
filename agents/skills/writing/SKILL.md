---
name: writing
description: Use for improving and reviewing prose — cover letters, essays, reports, grant applications, speeches, emails, or any writing. Two modes — (1) iterate: refine a draft through parallel dual-reviewer passes until it stabilizes ("improve this", "make this better", "polish this writing", "keep refining until it's ready"); (2) diff-review: compare two versions and generate an interactive HTML diff with editorial commentary ("show me what changed", "create a diff", "compare versions"). NOT for code review (use git diff / code-review) or prompt/agent-instruction tuning (use prompt-engineering).
---

# Writing

Two modes for working on prose documents. Pick based on what the user needs:

| Mode | Use when | Reference |
|------|----------|-----------|
| **Iterate** | Refining a draft toward "good" — systematic tightening via parallel reviewers until convergence | [references/iteration-loop.md](references/iteration-loop.md) |
| **Diff-review** | Showing what changed between two versions — an interactive HTML diff with per-change rationale | [references/diff-review.md](references/diff-review.md) |

They chain naturally: **iterate** a draft to a final version, then **diff-review** v1→final to show the user (and explain) every change.

## Quick orientation

- **Iterate** runs two independent reviewer subagents per pass — a Strunk-style copy editor and a domain quality evaluator — applying changes until both say READY (or ~8 passes, whichever comes first). The highest-leverage input is source documents (job descriptions, RFPs, brochures) that define what "good" means for this context. The reference has the subagent dispatch pattern and per-domain quality checklists (cover letters, essays, grants).
- **Diff-review** produces a sentence-level diff, then adapts the bundled HTML template ([references/diff-review-template.html](references/diff-review-template.html)) into an annotated, exportable review page (inline + side-by-side views, sidebar commentary, localStorage annotations). The reference has the markup patterns and the optional change-report format.

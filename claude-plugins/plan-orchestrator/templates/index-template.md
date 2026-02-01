# Index Template

Use this template when creating a new plan's index.md:

```markdown
---
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
# Plan: <Plan Name>

## Goal <!-- status: draft -->

<What we're trying to accomplish - be specific about the problem being solved and what success looks like>

## Method <!-- status: draft -->

<How we're going to plan this - the approach agreed upon before diving into details>

Examples:
- MVP-first: Tightly scope an MVP, architect it, defer everything else
- Phased rollout: Break into sequential phases with clear milestones
- Spike-then-spec: Quick prototype to learn, then detailed specification
- Requirements-driven: Detailed requirements first, then technical design

## Critical Path

*This section is updated as planning progresses to show what needs approval*

**Status:**
- [ ] Goal - draft
- [ ] Method - draft
- [ ] Requirements - not started
- [ ] Technical Approach - not started

## Sub-Plans

| Plan | Status | Blocked By |
|------|--------|------------|
| | | |

*Sub-plans are added as the plan grows in complexity*

## Decisions Log

*Key decisions made during planning - append only*

| Date | Decision | Rationale |
|------|----------|-----------|
| | | |
```

## Notes

- Update the `updated` date whenever the document is modified
- Keep the Goal and Method sections concise - details go in linked docs
- Critical Path should always reflect the current blocking item
- Decisions Log is append-only - never edit past entries

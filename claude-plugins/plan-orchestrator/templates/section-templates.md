# Section Templates

Reference templates for common plan sections.

---

## Requirements Document (requirements.md)

```markdown
---
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
# Requirements: <Plan Name>

## User Requirements <!-- status: draft -->

### Problem Statement
<What problem are we solving and for whom?>

### User Stories
- As a [user type], I want [goal] so that [benefit]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Scope <!-- status: draft -->

### In Scope
- Item 1
- Item 2

### Out of Scope
- Deferred item 1 (reason: ...)
- Deferred item 2 (reason: ...)

### MVP Definition
<If using MVP-first method, what's the minimal version?>

## Success Criteria <!-- status: draft -->

### Functional
- Criterion 1
- Criterion 2

### Non-Functional
- Performance: ...
- Reliability: ...

## Open Questions

- [ ] Question 1
- [ ] Question 2
```

---

## Technical Document (technical.md)

```markdown
---
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
blocked-by: ["requirements"]
---
# Technical Approach: <Plan Name>

## Overview <!-- status: draft -->

<High-level technical approach in 2-3 sentences>

## Architecture <!-- status: draft -->

### Components
<Key components and their responsibilities>

### Data Flow
<How data moves through the system>

### Integration Points
<How this connects to existing systems>

## Key Decisions <!-- status: draft -->

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| | | | |

## Implementation Guidance <!-- status: draft -->

### Phase 1: <Name>
- Task 1
- Task 2

### Phase 2: <Name>
- Task 1
- Task 2

## Risks & Mitigations <!-- status: draft -->

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| | | | |

## Open Technical Questions

- [ ] Question 1
- [ ] Question 2
```

---

## Sub-Plan Template

```markdown
---
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
blocked-by: []
---
# Sub-Plan: <Component Name>

## Overview <!-- status: draft -->

<What this sub-plan covers - 1-2 sentences>

**Parent Plan:** [<Parent Name>](./index.md)

## Dependencies

- **Blocked by:** <what must complete first>
- **Blocks:** <what depends on this>

## Goals <!-- status: draft -->

<Specific goals for this component>

## Requirements <!-- status: draft -->

<Component-specific requirements - reference parent requirements as needed>

## Approach <!-- status: draft -->

<How this component will be built>

## Open Questions

- [ ] Question 1

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
```

---

## Decisions Document (decisions.md)

For plans with many decisions, a dedicated decisions log:

```markdown
---
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
# Decisions: <Plan Name>

This document records key decisions made during planning. Entries are append-only.

## Decisions

### YYYY-MM-DD: <Decision Title>

**Context:** <Why this decision was needed>

**Decision:** <What was decided>

**Rationale:** <Why this choice was made>

**Alternatives Considered:**
- Option A: <why not chosen>
- Option B: <why not chosen>

**Consequences:**
- Positive: ...
- Negative: ...

---

### YYYY-MM-DD: <Next Decision>
...
```

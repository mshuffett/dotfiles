---
name: learn-first-parallelize
description: This skill should be used when performing batch operations on many similar items (files, migrations, refactors). Do 2-3 items manually first to discover patterns, then write a comprehensive subagent prompt for parallel execution.
---

# Learn-First Parallelize Pattern

A meta-workflow for efficiently handling batch operations by learning patterns first before parallelizing.

## When to Use

- Migrating many files (skills, configs, components)
- Batch refactoring (renaming, restructuring, cleanup)
- Processing multiple similar items where patterns aren't immediately obvious
- Any task where you'd benefit from discovering edge cases before scaling

## The Pattern

### Phase 1: Manual Discovery (2-3 items)

Process 2-3 representative items manually to discover:

1. **Naming patterns** - What conventions should apply?
2. **Content patterns** - What cleanup/improvements are common?
3. **Edge cases** - What special handling is needed?
4. **Quality criteria** - What defines "done well"?

### Phase 2: Document Learnings

Write a comprehensive subagent prompt that captures:

1. **Explicit instructions** - Step-by-step process
2. **Transformation examples** - Before/after showing the pattern
3. **Quality checklist** - Concrete checks for completion
4. **Skip conditions** - What items to leave alone

### Phase 3: Parallel Execution

Launch subagents with the documented prompt to process remaining items in parallel.

## Subagent Prompt Template

```markdown
# [Task Name] Subagent Prompt

## Task
[One-sentence description of what to do]

## Source
**File path**: `{SOURCE_PATH}`

## Instructions

1. **Read the source** completely

2. **[Transformation step]**:
   - [Specific guidance]
   - [Specific guidance]

3. **[Another step]**:
   - [Specific guidance]

4. **Create the output**:
   ```bash
   [commands]
   ```

5. **Report back** with:
   - [What to report]

## Skip Conditions
- [When to skip this item]

## Example Transformation

**Before** (`path/to/original`):
```
[original content snippet]
```

**After** (`path/to/new`):
```
[transformed content snippet]
```

## Quality Checklist
- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]
```

## Benefits

- **Avoids costly mistakes** - Patterns discovered before scale
- **Consistent quality** - All items follow learned patterns
- **Efficient parallelization** - Subagents have complete context
- **Documented process** - Prompt can be reused or refined

## Example: Skill Migration

**Phase 1**: Manually migrate 3 skills to learn:
- Naming should be descriptive, not tool names (`context7` → `library-docs`)
- Descriptions should start with "Use when..."
- Verbose examples should be condensed

**Phase 2**: Write prompt capturing transformations and checks

**Phase 3**: Launch 5-10 subagents in parallel to process remaining skills

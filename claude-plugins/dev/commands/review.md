---
description: Run comprehensive code review using multiple reviewers in parallel. Use when reviewing code changes, PRs, or before merging.
---

# Code Review

Runs both the internal code-reviewer subagent AND Codex (GPT-5) in parallel for comprehensive code analysis.

## When to Use (Triggers)
- Before merging significant changes
- When user asks to review code
- After implementing fixes to verify issues are resolved
- Before creating a PR with complex changes

## Acceptance Checks
- [ ] Both reviewers completed
- [ ] No critical or high-priority issues remain
- [ ] Any medium issues have been acknowledged

## Review Process

1. **Launch both reviewers in parallel** using the Task tool:

   **Code Reviewer Agent** (feature-dev:code-reviewer):
   - Fast, pattern-based analysis
   - Focuses on bugs, security, code quality
   - Uses confidence-based filtering

   **Codex Deep Review** (claude-meta:codex):
   - Extended reasoning analysis
   - Focuses on architectural issues, race conditions, state machines
   - Provides prioritized findings with file:line references

2. **Synthesize findings**:
   - Combine unique issues from both reviewers
   - Deduplicate overlapping findings
   - Prioritize by severity: Critical > High > Medium > Low

3. **Report to user**:
   - List all Critical and High issues with locations
   - Summarize Medium issues
   - Note any disagreements between reviewers

## Example Prompts

For the code-reviewer agent:
```
Review [files/directory] for:
1. Security issues (auth, input validation, injection)
2. Bugs or logic errors
3. Error handling gaps
4. Race conditions

Report only high-confidence issues. Mark each as Critical, High, Medium, or Low.
```

For Codex:
```
Review [files/directory]. Focus on:
1. Security issues (API key handling, auth, input validation)
2. Bugs or logic errors in async flows
3. Error handling gaps
4. Race conditions

Provide prioritized findings with file:line references.
```

## Output Format

```
## Code Review Summary

### Critical Issues
- None found (or list with file:line)

### High Priority
- [Issue description] - file.ts:123

### Medium Priority
- [Issue description] - file.ts:456

### Low Priority (summary)
- N issues related to [category]

### Reviewer Agreement
- Both reviewers flagged: [issues]
- Only code-reviewer: [issues]
- Only Codex: [issues]
```

## Re-review Loop

If Critical or High issues are found:
1. Fix the issues
2. Re-run both reviewers
3. Repeat until no Critical/High issues remain
4. Commit and proceed

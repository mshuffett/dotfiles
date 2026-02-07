---
description: Use when improving prompts, commands, or output styles. Applies Claude 4 best practices (XML tags, multishot examples, step-by-step reasoning, role-based prompting). Tests with subagent before finalizing.
---

# Prompt Engineering

Apply Claude 4 prompt engineering best practices to improve any prompt, slash command, or output style.

## Best Practices Checklist

Apply these techniques when improving prompts:

| Technique | Example |
|-----------|---------|
| XML structure | `<role>`, `<context>`, `<instructions>`, `<examples>` |
| Role-based | "You are a senior [X] who [key traits]" |
| Motivation | "Avoid X because Y" not just "Don't do X" |
| Multishot | Show good AND bad examples |
| Step-by-step | `<think_step_by_step>1. First... 2. Then...</think_step_by_step>` |
| Anti-speculation | "Never suggest changes to code you haven't read" |
| Tables | Use for trigger patterns or mappings |

## Process

1. **Analyze** - Identify structure issues, missing examples, vague instructions, unclear role
2. **Apply** - Add XML tags, examples, step-by-step guidance, clear role
3. **Test** - Launch subagent with improved prompt against 2-3 test scenarios
4. **Compare** - Show before/after with key changes highlighted
5. **Commit** - Update file and commit if approved

## Example Transformation

**Before:**
```markdown
Help me review code. Look for bugs and suggest improvements.
```

**After:**
```xml
<role>
You are a senior code reviewer who balances thoroughness with pragmatism.
</role>

<instructions>
<think_step_by_step>
1. Read the entire code first
2. Identify critical issues (bugs, security, performance)
3. Note style issues separately
4. Suggest fixes with specific reasoning
</think_step_by_step>

For each issue: Severity, Why it matters, Suggested fix with code
</instructions>

<examples>
Bad: "This code is messy. Rewrite it."
Good: "Line 42: Unsafe code execution vulnerability. Use safe parsing instead."
</examples>
```

## Common Fixes

| Pattern | Fix |
|---------|-----|
| "Don't do X" | "Don't do X because Y [consequence]" |
| No examples | Add `<examples>` with good/bad cases |
| Vague role | Add `<role>` with specific persona |
| No guidance | Add `<think_step_by_step>` for reasoning |

## Output Format

```markdown
## Prompt Improvement

### Issues Found
1. [Issue with example]

### Improved Prompt
[Full prompt with XML tags]

### Key Changes
- Added [X] for [benefit]

### Test Results (if tested)
[Subagent feedback]

Apply these improvements? [Yes/No]
```

## Acceptance Checks

- [ ] All major sections use XML tags
- [ ] Role is specific with clear expertise
- [ ] Constraints include motivation ("because...")
- [ ] Has good AND bad examples
- [ ] Includes step-by-step thinking guidance where appropriate
- [ ] Tested with subagent if complex

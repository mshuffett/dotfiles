---
name: test-debugging
description: Use when tests fail or flake; provides root-cause debugging workflow with universal steps and meta-learning integration.
---

# Test Debugging Principle

CRITICAL: When tests fail, INVESTIGATE the root cause — don't just report the failure.

## Acceptance Checks

- [ ] Guide consulted (this file)
- [ ] Failure analyzed (what/where/why)
- [ ] Minimal reproduction attempted
- [ ] Root cause fixed
- [ ] Simplest test passes; full suite passes (or documented)

## Universal Debugging Approach

1. **Identify WHAT failed** — Read the error carefully
   - Which assertion failed?
   - Which element/resource was missing?
   - What was the actual vs expected value?

2. **Create minimal reproduction** — Simplify to isolate the issue
   - Remove complexity
   - Test one thing at a time
   - Verify assumptions

3. **Find WHERE the issue originates**
   - Search codebase for related code
   - Check if component/function exists
   - Verify it's imported and used correctly

4. **Determine WHY it's failing**
   - Code changed but tests didn't?
   - Test expectations outdated?
   - Environment/cache issue?
   - Missing dependency?

5. **Fix and verify**
   - Fix root cause
   - Run simplest test first
   - Add to project docs if project-specific

## Meta-Learning Integration

After fixing ANY test failure:
- Document project-specific patterns in the project's CLAUDE.md or docs
- Update root memory only if the pattern is universal
- Commit learnings immediately

## Related Notes (Deep Dives)

- `agents/skills/agent-browser/SKILL.md`
- `agents/knowledge/atoms/claude-skill-archive/verify-ui-changes/SKILL.md`

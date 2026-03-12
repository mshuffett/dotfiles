# User Notes: Memory Placement Eval (Indentation Convention)

## Uncertainty
- The skill's decision tree identifies two equally valid destinations: `./CLAUDE.md` and `./.claude/rules/` with path filtering. Without seeing the actual project's CLAUDE.md structure and existing rules, I cannot definitively say which is "better" for this specific codebase.
- The tiebreaker (recommend CLAUDE.md for simplicity) is pragmatic but not explicitly mandated by the skill.

## Needs Human Review
- Verify whether the Puffin monorepo already has a "Coding Style" section in its CLAUDE.md. If it does, the indentation guidance should be added there. If not, a new section should be created.
- Check if there are already path-filtered rules in `./.claude/rules/`. If so, consider whether indentation should join them for consistency.
- Confirm that 2-space TS / 4-space Python is the actual convention (this eval assumes the user statement is accurate).

## Workarounds
None. The skill's guidance was clear and required no workarounds.

## Suggestions
- The skill could benefit from a tiebreaker heuristic for cases where both CLAUDE.md and path-filtered rules fit equally well. It could say something like: "If the rule is likely to be 1-3 sentences, prefer CLAUDE.md. If it's likely to grow into multi-sentence guidance with examples, consider rules for organization."
- The skill could include an example showing the transformation of a simple CLAUDE.md note into a rules file as style guidance grows. This would help understand when/how to refactor.

## Summary
Execution completed successfully with a clear, defensible recommendation. The skill's decision tree resolved to CLAUDE.md as the primary destination, with path-filtered rules as a valid secondary option. All reasoning is transparent and traceable.

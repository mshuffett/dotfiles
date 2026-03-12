# User Notes

## Uncertainty

- The CLAUDE.md Preferences section entry `"pnpm, Ultracite linter"` already implies pnpm preference, but it is ambiguous — it could mean "we use pnpm" rather than "always prefer pnpm over npm". The recommended edit makes this explicit, but a grader should verify whether the existing entry is considered sufficient or insufficient for the acceptance check.

## Needs Human Review

- Whether to edit the existing `pnpm, Ultracite linter` line in-place vs. adding a new explicit line is a style choice. The current Preferences section uses a dash-list with short entries. Both approaches are valid; the user may prefer one over the other.

## Workarounds

None. The skill worked as designed. The decision tree produced a clear, unambiguous answer.

## Suggestions

- The skill could add an explicit step: "Before recommending a write, check whether the information already exists in the target location and whether it needs strengthening vs. a fresh addition." This would make the idempotency check part of the formal process rather than implicit executor judgment.
- The decision tree stops at "CLAUDE.md" without distinguishing between adding a new entry vs. strengthening an existing one. A small clarifying note would help.

# User Notes

## Uncertainty

- The decision between project CLAUDE.md vs a project-local skill is a judgment call. The skill's escalation ladder says "first occurrence → create/improve skill," which could be read as "create a skill" rather than "add to CLAUDE.md." I chose CLAUDE.md as primary because of the high miss-risk (silent auth failures), but a human reviewer may prefer the skill path.
- Without knowing how frequently auth work happens in this specific project, the right tier (L0 vs L1) is hard to determine definitively. If auth is rarely touched, L1 skill is more appropriate. If auth is central to daily work, L0 (CLAUDE.md) is justified.

## Needs Human Review

- Should the 30-minute expiry be cross-referenced with the project's MEMORY.md? The MEMORY.md file is used for cross-session recall in this project, and this fact would be useful there too.
- If the project already has an auth-related section in CLAUDE.md or an existing skill, the recommendation should be to add to that rather than create a new one — but no codebase inspection was performed.

## Workarounds

None. The skill's decision tree handled this case cleanly.

## Suggestions

- The skill could benefit from an explicit example for "debugging discovery" scenarios (facts found during debugging that weren't in any docs). The current examples lean toward operational procedures.
- Adding a note about when to also record in MEMORY.md (for cross-session project facts) would help disambiguate the CLAUDE.md vs MEMORY.md boundary.

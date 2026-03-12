# User Notes — Eval 4

## Uncertainty

- The skill's decision tree does not have an explicit branch for "local credential that must not be committed." The `.env` recommendation comes from general best practice, not from a direct skill rule. This is a gap in the skill.
- It's unclear whether the local machine memory file (`~/.claude/projects/.../memory/MEMORY.md`) is actually gitignored or just lives outside the repo. Assumed it's safe because it's outside the repo directory, but this should be confirmed.

## Needs Human Review

- Verify that the project's `.gitignore` includes `.env` before recommending it as a safe location. If not, `.env` could accidentally be committed.
- The skill could benefit from an explicit branch for "sensitive/credential data" that routes to gitignored local storage rather than assuming the decision tree branches are all safe.

## Workarounds

- The standard decision tree doesn't explicitly handle the "don't commit" constraint. Had to reason about which locations are git-committed vs local-only rather than following a direct branch in the tree.

## Suggestions

- Add a "Is this sensitive / must not be committed?" check early in the decision tree, routing to local-only storage (`.env`, local memory) before reaching the normal branches.
- Add an explicit example in the skill for credential/secret handling.
- Document clearly that project CLAUDE.md and `.claude/commands/` ARE committed to git, so they are not safe for secrets (this is implied but not stated in the skill).

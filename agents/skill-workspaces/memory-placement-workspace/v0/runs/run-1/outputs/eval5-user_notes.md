# User Notes - Eval5

## Uncertainty

- The eval assumes the repository supports `./.claude/skills/` auto-loading. If the current repo environment doesn't support project-local skills, the recommendation to use an alternative location (project CLAUDE.md) should be considered.

## Needs Human Review

- **Trigger description quality**: The recommended skill description "Use when implementing API endpoints in src/api/ or discussing API input validation" should be reviewed to ensure it correctly captures the contexts where this rule should auto-load in practice.
- **Scope of "all API endpoints"**: The recommendation assumes `src/api/` is truly the scope. If there are other API locations or if this rule should apply beyond `src/api/`, the skill description should be adjusted.

## Workarounds

None. The skill's decision tree was clear and comprehensive; no workarounds were needed.

## Suggestions

- **Enhance decision tree example**: The skill could benefit from a concrete example case like this one, showing how to classify a project-specific technical rule (validates the "repo-specific → skill" path).
- **Auto-load trigger guidance**: The skill could include more explicit guidance on what makes a good trigger condition for a skill's description (e.g., "Use when [file path] is being edited" vs "Use when [action] is being performed").
- **Skill versioning for projects**: Consider documenting whether project-local skills should be versioned in the project repo or symlinked to a dotfiles source.

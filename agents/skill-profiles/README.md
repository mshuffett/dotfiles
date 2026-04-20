# Skill Profiles

These files define named skill sets for `bin/skill-profile`.

- Canonical skills remain in `agents/skills/`.
- Profiles only control which skills are activated in the runtime-specific active dirs behind `~/.claude/skills` and `~/.codex/skills`.
- Local profile overrides can live in `~/.config/skill-profile/profiles/*.json`.
- Shell-launched Claude also gets a per-profile overlay home under `~/.local/share/skill-profile/claude-homes/<profile>`.
- Shell-launched Codex also gets a per-profile overlay home under `~/.local/share/skill-profile/codex-homes/<profile>`.

Common commands:

```bash
skill-profile list
skill-profile resolve recommended
skill-profile apply recommended --runtime claude
skill-profile apply barebones --runtime codex
skill-profile status
skill-profile restore --runtime codex

# Adaptive loop (human-in-the-loop skill self-improvement):
skill-profile stats                 # firing counts, pending proposals
skill-profile replay <skill>        # test against mistake corpus
skill-profile reflect <skill>       # generate evidence-backed edit proposal
skill-profile review                # read pending proposals

claude --skill-profile recommended -p "What skills are available?"
codex --skill-profile full exec "What skills are available?"
```

Profile format:

```json
{
  "description": "Human-readable summary",
  "extends": ["daily"],
  "skillSources": ["canonical"],
  "include": ["coach", "todoist", "web-*"],
  "exclude": ["imagegen", "slides"],
  "includeArchived": false,
  "enabledPlugins": {
    "agentops@agentops-marketplace": false,
    "ralph-loop@claude-plugins-official": false
  }
}
```

Rules:

- `extends` composes other profiles first.
- `skillSources` defaults to `["canonical"]`. Use `["omx"]` to load upstream `oh-my-codex` skills instead of `agents/skills/`.
- `include` and `exclude` accept exact skill names or `*` wildcards.
- `includeArchived` defaults to `false`. Skills whose `SKILL.md` resolves outside `agents/skills/` (archive symlinks) are hidden unless a profile in the chain explicitly sets `true`.
- `enabledPlugins` (Claude only) rewrites matching keys in `~/.claude/settings.json`. The tool snapshots the original map on first apply, applies new profiles as `baseline + overrides`, and restores the snapshot on `restore`. Codex ignores this field.
- `full` is intended to track the complete canonical set.
- Use `--runtime codex`, `--runtime claude`, or `--runtime both` to choose which runtime changes.
- Use `--skill-profile <name>` on the shell `claude` or `codex` command for a one-off profile without changing the saved default.

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
skill-profile resolve barebones
skill-profile apply barebones --runtime codex
skill-profile apply full --runtime claude
skill-profile status
skill-profile restore --runtime codex
claude --skill-profile barebones -p "What skills are available?"
codex --skill-profile full exec "What skills are available?"
```

Profile format:

```json
{
  "description": "Human-readable summary",
  "extends": ["daily"],
  "include": ["coach", "todoist", "web-*"],
  "exclude": ["imagegen", "slides"]
}
```

Rules:

- `extends` composes other profiles first.
- `include` and `exclude` accept exact skill names or `*` wildcards.
- `full` is intended to track the complete canonical set.
- Use `--runtime codex`, `--runtime claude`, or `--runtime both` to choose which runtime changes.
- Use `--skill-profile <name>` on the shell `claude` or `codex` command for a one-off profile without changing the saved default.

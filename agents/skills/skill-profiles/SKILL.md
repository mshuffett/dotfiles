---
name: skill-profiles
description: Manage runtime-specific skill profiles without deleting the canonical skill inventory. Use when the user wants to slim down Codex or Claude, switch one runtime while leaving the other unchanged, create or edit named profiles under `agents/skill-profiles`, inspect what a profile enables, or restore the original skill links after experimentation.
---

# Skill Profiles

Keep `agents/skills/` as the canonical inventory. Treat profiles as reversible activation views, not deletion.

## Quick Start

Inspect the available profiles:

```bash
bin/skill-profile list
bin/skill-profile show barebones
bin/skill-profile resolve barebones
```

Switch only Codex to a smaller profile while leaving Claude untouched:

```bash
bin/skill-profile apply barebones --runtime codex
```

Set Claude's saved default profile:

```bash
bin/skill-profile apply full --runtime claude
```

Check the current runtime wiring:

```bash
bin/skill-profile status
```

Restore a runtime to its previous symlink target:

```bash
bin/skill-profile restore --runtime codex
```

Trigger a one-off profile without changing the saved default:

```bash
claude --skill-profile barebones -p "What skills are available?"
codex --skill-profile full exec "What skills are available?"
```

## Runtime Model

- Canonical definitions live in `agents/skill-profiles/*.json`.
- Local personal overrides can live in `~/.config/skill-profile/profiles/*.json`.
- Runtime links stay separate:
  - Claude uses `~/.claude/skills`
  - Codex uses `~/.codex/skills`
- Active generated directories live under `~/.local/share/skill-profile/active-<runtime>`.
- Shell-launched Claude runs through `bin/claude-profile-launch`, which builds a Claude-only home overlay per profile under `~/.local/share/skill-profile/claude-homes/`.
- Shell-launched Codex runs through `bin/codex-profile-launch`, which builds a Codex-only home overlay per profile under `~/.local/share/skill-profile/codex-homes/`.
- Those per-profile overlay homes are stateful. Do not wipe them wholesale during launch, or you will erase runtime-local installs such as Codex plugin caches, profile-local `.agents/skills`, and install metadata.

Use `--runtime codex`, `--runtime claude`, or `--runtime both` whenever applying, syncing, or restoring. Use `--skill-profile <name>` on the shell `claude` or `codex` command when you want a one-off profile without mutating the saved default.

## Editing Profiles

When the user wants a new curated set:

1. Edit or add JSON in `agents/skill-profiles/`.
2. Keep profiles small and intentional; prefer exact names over wide wildcards unless the grouping is obvious.
3. Use `extends` only when it reduces duplication cleanly.
4. Verify with:

```bash
bin/skill-profile list
bin/skill-profile show <profile>
```

If the user wants a one-runtime experiment, apply the profile only to that runtime first instead of changing both.

## Safety Rules

- Do not delete skills from `agents/skills/` just to simplify a runtime surface.
- Do not overwrite a real directory at `~/.claude/skills` or `~/.codex/skills`; the command expects symlinks and should fail loudly otherwise.
- Preserve the previous target for each runtime so `restore` remains available.
- When verifying installs for Codex or Claude, test through the actual launcher command (`codex ...` or `claude ...`), not just by inspecting files inside a profile home. A launcher rebuild can invalidate an install that looked correct on disk.
- `script/sync-codex-skills.sh` is a Codex-only compatibility wrapper; do not use it as a Claude sync path.

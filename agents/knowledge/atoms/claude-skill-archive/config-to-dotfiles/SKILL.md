---
description: Use when you discover a stray config file; move into dotfiles, symlink back, and commit.
---

# Config File Management

Stray config files should be symlinked from `~/.dotfiles` for version control and tracking.

## Pattern

```bash
# Move, symlink, and commit
mv ~/.some-app/config.json ~/.dotfiles/some-app/config.json
ln -s ~/.dotfiles/some-app/config.json ~/.some-app/config.json
cd ~/.dotfiles && git add some-app/ && git commit -m "Add some-app config" && git push
```

## Existing Managed Configs

- `~/.claude/CLAUDE.md` -> `~/.dotfiles/claude/CLAUDE.md`
- `~/.claude/settings.json` -> `~/.dotfiles/claude/settings.json`
- `~/.claude/commands/` -> `~/.dotfiles/claude/commands/`
- `~/.claude/scripts/` -> `~/.dotfiles/claude/scripts/`
- `~/bin/` scripts -> `~/.dotfiles/bin/`

## Acceptance Checks

- [ ] File moved into `~/.dotfiles/<app>/`
- [ ] Symlink created back to original path
- [ ] Change committed in dotfiles repo

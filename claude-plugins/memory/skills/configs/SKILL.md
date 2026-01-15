---
description: Use when you discover a stray config; move into dotfiles, symlink back, and commit.
---

# Config File Management

Important: Stray config files should be symlinked from `~/.dotfiles` for version control and tracking.

Pattern for new config files:
```bash
# Move config file
mv ~/.some-app/config.json ~/.dotfiles/some-app/config.json

# Create symlink
ln -s ~/.dotfiles/some-app/config.json ~/.some-app/config.json

# Commit and push
cd ~/.dotfiles && git add some-app/ && git commit -m "Add some-app config" && git push
```

Existing managed configs:
- `~/.claude/CLAUDE.md` → `~/.dotfiles/claude/CLAUDE.md`
- `~/.claude/settings.json` → `~/.dotfiles/claude/settings.json`
- `~/.claude/commands/` → `~/.dotfiles/claude/commands/`
- `~/.claude/scripts/` → `~/.dotfiles/claude/scripts/`
- `~/bin/` scripts → `~/.dotfiles/bin/`

## When to Use (Triggers)
- You encounter a stray config file that should be tracked

## Acceptance Checks
- [ ] File moved into `~/.dotfiles/<app>/`
- [ ] Symlink created back to original path
- [ ] Change committed in dotfiles repo

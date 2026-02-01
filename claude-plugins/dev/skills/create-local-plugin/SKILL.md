---
name: create-local-plugin
description: Use when creating a new local Claude Code plugin, scaffolding a plugin in dotfiles, or when "plugin not found in marketplace" errors occur. Covers the full registration checklist including marketplace.json, symlinks, and settings.
---

# Create Local Plugin

Create a new local plugin in the dotfiles with proper marketplace registration.

## Checklist

When creating a new local plugin, ALL of these steps are required:

### 1. Create Plugin Directory

```bash
mkdir -p ~/.dotfiles/claude-plugins/<plugin-name>/{.claude-plugin,commands,agents}
```

### 2. Create plugin.json

Create `~/.dotfiles/claude-plugins/<plugin-name>/.claude-plugin/plugin.json`:

```json
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "description": "Brief description of the plugin",
  "author": {
    "name": "Michael"
  }
}
```

### 3. Create Symlink in Marketplace

```bash
ln -s ~/.dotfiles/claude-plugins/<plugin-name> ~/.claude/plugins/marketplaces/local-plugins/plugins/<plugin-name>
```

### 4. Add to marketplace.json

Edit `~/.dotfiles/claude-plugins/.claude-plugin/marketplace.json` and add entry to the `plugins` array:

```json
{
  "name": "<plugin-name>",
  "description": "Brief description",
  "version": "1.0.0",
  "author": {
    "name": "Michael Shuffett",
    "email": "michael@compose.ai"
  },
  "source": "./plugins/<plugin-name>",
  "category": "development"
}
```

### 5. Add to installed_plugins.json

Edit `~/.claude/plugins/installed_plugins.json` and add:

```json
"<plugin-name>@local-plugins": [
  {
    "scope": "user",
    "installPath": "/Users/michael/.dotfiles/claude-plugins/<plugin-name>",
    "version": "1.0.0",
    "installedAt": "<ISO-timestamp>",
    "lastUpdated": "<ISO-timestamp>"
  }
]
```

### 6. Enable in settings.json

Edit `~/.claude/settings.json` and add to `enabledPlugins`:

```json
"<plugin-name>@local-plugins": true
```

### 7. Restart Claude Code

Start a new session to load the plugin.

---

## Quick Reference

| File | Purpose |
|------|---------|
| `~/.dotfiles/claude-plugins/<name>/` | Plugin source code |
| `~/.dotfiles/claude-plugins/.claude-plugin/marketplace.json` | Marketplace registry (symlinked) |
| `~/.claude/plugins/marketplaces/local-plugins/plugins/<name>` | Symlink to source |
| `~/.claude/plugins/installed_plugins.json` | Install registry |
| `~/.claude/settings.json` | Enable/disable plugins |

## Common Errors

**"Plugin not found in marketplace"**
- Missing entry in `marketplace.json`
- Missing symlink in `plugins/` directory

**"Plugin failed to load"**
- Invalid `plugin.json` syntax
- Missing required frontmatter in commands/agents
- Wrong directory structure

## Plugin Structure

```
<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # Required
├── commands/                 # Slash commands
│   └── <command>.md
├── agents/                   # Subagents
│   └── <agent>.md
├── templates/                # Reference files (optional)
└── hooks/                    # Event hooks (optional)
    └── hooks.json
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal dotfiles repository based on holman's dotfiles structure, using zsh4humans (z4h) for shell configuration. The repository manages shell configuration, terminal setup (tmux, Ghostty), editor configuration (nvim with NvChad), and various development tools.

**Important**: This repository contains sensitive configuration and paths and should remain private.

## Architecture

### Topical Organization

Everything is organized by topic area in directories (git, tmux, nvim, zsh, etc.). Each topic directory can contain:

- `*.zsh` - Auto-loaded into shell environment
- `path.zsh` - Loaded first to setup PATH
- `completion.zsh` - Loaded last for autocomplete
- `*.symlink` - Symlinked to `$HOME` (without .symlink extension)
- `bin/` - Scripts added to PATH

### Key Directories

- **`bin/`** - Utility scripts accessible system-wide (push notifications, image generation, TTS, git helpers)
- **`claude/`** - Claude Code configuration including commands and hooks
- **`tmux/`** - Tmux configuration with vim integration, tmux2k theme, resurrection support
- **`nvim/`** - NvChad-based neovim config with AI assistants (codecompanion, avante)
- **`zsh/`** - Shell aliases and configuration
- **`script/`** - Installation and bootstrap scripts
- **`ghostty/`** - Ghostty terminal emulator configuration

### Shell Configuration

The main shell config is `~/.zshrc` (symlinked from `zsh/zshrc.symlink`), which uses:

- **zsh4humans (z4h)** for core functionality
- **direnv** for project-specific environment loading
- **fnm** for Node.js version management
- **zoxide** for smart directory jumping
- **OH-MY-ZSH** plugins loaded via z4h

Key features:
- Auto-starts tmux in "main" session unless already in tmux or Cursor
- Loads secrets from `~/.env.zsh`
- Extensive history configuration with deduplication
- Custom functions for tmux session management (tn, ts, tl, tk)

### Tmux Configuration

Located at `tmux/tmux.conf.symlink`:

- **Prefix**: `Ctrl-a` (not default Ctrl-b)
- **Theme**: tmux2k with Palenight colors
- **Navigation**: Vim-style hjkl with vim-tmux-navigator plugin
- **Key plugins**: resurrect (session save/restore), continuum (auto-save), fzf integration
- **Pane splitting**: `|` horizontal, `-` vertical
- **Cheatsheet**: `Ctrl-a /` shows custom cheatsheet

Important: The tmux configuration integrates deeply with vim/nvim for seamless pane navigation.

### Neovim Configuration

Located at `nvim/nvim/` (symlinked to `~/.config/nvim`):

- Based on **NvChad starter** (forked 2025-10-16)
- AI assistants: codecompanion.nvim and avante.nvim using Claude Code subscription
- Tmux integration via vim-tmux-navigator
- Enhanced markdown support with render-markdown and bullets.vim
- Requires `CLAUDE_CODE_OAUTH_TOKEN` environment variable

See `nvim/nvim/README.md` for plugin details.

## Common Development Commands

### Installation and Updates

```bash
# Initial installation (from scratch)
curl -sL https://github.com/mshuffett/dotfiles/raw/master/script/install_from_scratch | bash

# Bootstrap dotfiles (symlink all *.symlink files)
script/bootstrap

# Update dependencies (homebrew + installed packages)
bin/dot
```

### Secrets Management

Secrets are managed via 1Password CLI (currently commented out in .zshrc):

```bash
# Refresh secrets from 1Password (when enabled)
refresh_secrets
```

Currently secrets should be stored in `~/.env.zsh` which is sourced automatically and gitignored.

Required 1Password paths (when enabled):
- `op://Private/OpenAI API Key/api_key`
- `op://Private/Anthropic API Key/api_key`
- `op://Private/Mapbox Access Token/access_token`

### Shell Aliases

Key aliases from `zsh/aliases.zsh`:

```bash
s, sz          # Reload shell (exec zsh)
ea             # Edit aliases file
ez             # Edit .zshrc
et             # Edit .tmux.conf

vim, vi        # Aliased to nvim
ls, ll, lc     # Aliased to eza with icons
cat            # Aliased to bat
lg             # lazygit

claude, c      # Claude Code with --dangerously-skip-permissions
p              # pnpm
```

### Git Configuration

Located at `git/gitconfig.symlink`:

- User: Michael Shuffett <mshuffett@gmail.com>
- Credential helper: osxkeychain
- Custom git scripts in `bin/` (git-promote, git-wtf, git-nuke, etc.)
- Rebase autosquash enabled

### Tmux Session Management

```bash
tn <name>      # Create or attach to named session
ts [name]      # Switch sessions (interactive with fzf if no name)
tl             # List sessions
tk <name>      # Kill session
thelp          # Show tmux/nvim cheatsheet
```

### Utility Scripts

Located in `bin/`:

```bash
push "message" [priority]           # Send Pushover notification (0=normal, 1=high, 2=emergency)
generate-image "prompt" [options]   # Generate images with Gemini or OpenAI
inworld-tts "text" [voice]          # Text-to-speech via Inworld (#1 on TTS Arena)
hume-tts "text" [voice]             # Text-to-speech via Hume Octave (#2 on TTS Arena)
gemini-tts "text"                   # Text-to-speech via Google Gemini 2.5
idea <text>                         # Quick idea capture using Claude Code /idea command
```

## Development Workflow

### Making Changes to Dotfiles

1. Edit files in `~/.dotfiles/`
2. For new configs: create in topic directory, add `.symlink` extension if it should be in `$HOME`
3. Commit and push to keep configurations synced
4. Run `script/bootstrap` if adding new symlinks
5. Run `sz` or `s` to reload shell after changes

### Adding New Aliases

```bash
aa <name> <command>    # Adds alias to zsh/aliases.zsh
                       # Example: aa gst 'git status'
```

### Claude Code Integration

Claude Code configuration is in `claude/`:
- `CLAUDE.md` - Project instructions (this file)
- `settings.json` - Claude Code settings
- `commands/` - Custom slash commands
- `scripts/` - Hook scripts

Session history stored at: `~/.claude/projects/[project-path]/[session-uuid].jsonl`

### Testing and Debugging

```bash
# Check if a command/tool exists
command -v <tool>

# Debug zsh loading (timing)
zsh -i -c 'exit'

# View tmux server info
tmux info

# Check which config file provides a setting
which <command>        # Shows all instances in PATH
type <command>         # Shows if alias, function, or binary
```

## Environment Variables

Key environment variables set in .zshrc:

```bash
EDITOR=zed                          # Default editor
ZSH=$HOME/.dotfiles                 # Dotfiles location
PNPM_HOME, DENO_INSTALL, GOPATH     # Language tool paths
HOMEBREW_NO_AUTO_UPDATE=1           # Disable brew auto-update
TZ=America/Los_Angeles              # Timezone
LSCOLORS, LS_COLORS                 # Palenight color scheme for ls
```

## Special Integrations

### Warp Terminal Compatibility

The .zshrc now includes automatic Warp detection and compatibility. When running in Warp:

- z4h initialization is skipped (Warp provides its own prompt and shell integration)
- Custom keybindings are disabled (Warp has its own keybinding system)
- Basic completions are enabled via `compinit`
- All shared configuration (PATH, exports, aliases, functions, tools) works normally

Detection is automatic via the `WARP_IS_LOCAL_SHELL_SESSION` environment variable. The configuration works seamlessly in both Warp and traditional terminals (Ghostty, iTerm, etc.) without manual switching.

### Cursor IDE Integration

- Detects Cursor via `$CURSOR_TRACE_ID` to prevent tmux auto-start
- Sets `GIT_PAGER=cat` in Cursor for non-interactive diffs
- Detects Cursor agent via `$CURSOR_AGENT`

### Ghostty Terminal

- True color support configured in tmux
- Chafa image rendering uses kitty format
- Tmux passthrough enabled for image display

## Troubleshooting

### Symlinks not working

Run `script/bootstrap` to recreate all symlinks from `*.symlink` files.

### Shell loading slowly

Check z4h update status. The auto-update is disabled (`zstyle ':z4h:' auto-update 'no'`).

### Tmux plugins not installed

Run `Ctrl-a I` (capital I) inside tmux to install plugins via TPM.

### Secrets not loading

Ensure `~/.env.zsh` exists with required API keys. The 1Password CLI integration is currently commented out.

### Git commands failing

Check that git is configured with user name/email. Run `script/bootstrap` to setup gitconfig if missing.

## Architecture Notes

The dotfiles use a "topic-centric" approach where each tool/domain has its own directory. This makes it easy to:
- Find all files related to a specific tool
- Add new tools without touching existing configuration
- Share specific topics with others

The bootstrap script automatically discovers and symlinks `*.symlink` files, so adding new dotfiles is as simple as creating a file with the `.symlink` extension in the appropriate topic directory.

The shell configuration loads files in this order:
1. `*/path.zsh` - PATH setup
2. `*.zsh` - General configuration
3. `*/completion.zsh` - Completion setup

This ensures PATH is set before other configs run, and completions load last after all commands are available.

# Modern CLI Tools - Installation & Recommendations

**Date**: 2025-11-06
**Session**: Fresh Mac Magic

This document summarizes the modern CLI tools installed, configuration changes made, and recommendations for further productivity improvements.

---

## ✅ Tools Installed

### Core Replacements

| Old Tool | New Tool | Why |
|----------|----------|-----|
| `grep` | `ripgrep` (rg) | 5-10x faster, respects `.gitignore`, better regex |
| `find` | `fd` | Faster, simpler syntax, parallelized |
| `cat` | `bat` | Syntax highlighting, line numbers, git integration |
| `ls` | `eza` | Better formatting, git status, icons |
| `curl` | `xh` | Friendlier syntax, JSON handling, colors |
| - | `yq` | jq for YAML/JSON/XML processing |

### Productivity Tools

| Tool | Purpose | Key Feature |
|------|---------|-------------|
| `atuin` | Shell history | SQLite-backed, fuzzy search, stats, optional sync |
| `btop` | System monitor | Beautiful TUI with graphs for CPU/memory/network |
| `lazydocker` | Docker TUI | Interactive logs, stats, container management |
| `gh-dash` | GitHub dashboard | TUI for PRs/issues (gh extension) |
| `tldr` | Man pages | Quick, practical command examples |
| `hyperfine` | Benchmarking | Statistical command performance analysis |
| `watchexec` | File watching | Better than `watch`, flexible glob patterns |
| `zoxide` | Smart cd | Already installed - frecency-based directory jumping |

---

## 📝 Configuration Changes Made

### 1. Brewfile Updated
Added all new tools to `/Users/michael/.dotfiles/Brewfile` with descriptions.

### 2. CLAUDE.md Updated
Added "Modern CLI Tools" section documenting preference for modern alternatives when using shell commands.

### 3. zshrc Updated
Added atuin initialization:
```bash
# Atuin - magical shell history
if command -v atuin >/dev/null 2>&1; then
  eval "$(atuin init zsh)"
fi
```

### 4. Existing Aliases
These aliases already existed and integrate with new tools:
```bash
alias cat='bat'
alias ls='eza --icons --group-directories-first'
alias ll='eza -lh --icons --git --group-directories-first'
alias lc='eza --tree --icons'
```

---

## 🚀 How to Use New Tools

### Atuin (Shell History)

**Local storage**: `~/.local/share/atuin/history.db`

**Usage**:
- `Ctrl+R` - Fuzzy search all history
- `Ctrl+↑` - Search history for current directory
- `atuin stats` - See most-used commands, success rates
- `atuin search <query>` - Search from command line

**First time setup**:
```bash
# Restart shell to activate
exec zsh

# Import existing history
atuin import auto

# Try it
atuin stats
```

**Sync options**:
- **Local-only** (recommended): No setup needed, works great
- **Cloud sync**: Free tier available, encrypted before sync
  ```bash
  atuin register -u <username> -e <email>
  atuin login -u <username>
  atuin sync
  ```
- **Self-hosted**: Run your own atuin server (overkill for single machine)

### btop (System Monitor)

```bash
# Launch
btop

# Quit: q
# Help: h
# Vim keybindings work (j/k to navigate)
```

### lazydocker (Docker TUI)

```bash
# Launch
lazydocker

# Navigate: arrows or vim keys (j/k/h/l)
# View logs: select container, press 'l'
# Exec into container: press 'e'
# Quit: q or Ctrl+C
```

### gh-dash (GitHub Dashboard)

```bash
# Launch
gh dash

# Shows PRs and issues across all repos
# Navigate with arrow keys, enter to open in browser
```

### Other Tools

```bash
# tldr - quick examples
tldr tar
tldr git-rebase

# hyperfine - benchmark commands
hyperfine 'fd pattern' 'find . -name pattern'

# watchexec - run on file changes
watchexec -e ts,tsx pnpm test

# xh - HTTP requests
xh GET api.github.com/users/anthropics
xh POST httpbin.org/post name=michael
```

---

## 🤔 Recommendations for Further Improvement

### High Priority

#### 1. `mise` - Universal Version & Environment Manager ⭐⭐⭐

**Why**: Replaces fnm + direnv with one faster, simpler tool.

**Current state** (from your zshrc):
- fnm for Node version management (~10 lines of config)
- direnv for environment variables
- Manual JAVA_HOME checks
- PATH manipulation for every tool

**With mise**:
```bash
# One activation line
eval "$(mise activate zsh)"
```

**Benefits**:
- Manages all languages: Node, Python, Go, Ruby, etc.
- Handles environment variables (replaces direnv)
- Faster than fnm (~50ms vs ~200ms for version switching)
- Per-directory `.mise.toml` for versions + env vars
- Built-in task runner (like `just`)

**Setup**:
```bash
brew install mise

# Import current versions
mise use --global node@$(node -v | cut -d'v' -f2)

# Replace in zshrc:
# OLD: eval "$(fnm env)" + eval "$(direnv hook zsh)"
# NEW: eval "$(mise activate zsh)"
```

**Per-project usage**:
```bash
cd ~/ws/my-project
mise use node@20.11.0
# Creates .mise.toml automatically

# Add env vars (replaces .env files)
mise set DATABASE_URL=postgres://localhost/myapp
```

---

#### 2. `just` - Command Runner / Task Manager ⭐⭐

**Why**: Unifies your ~/bin scripts with discoverability and dependencies.

**Problem**: You have ~28 custom scripts in `~/bin/` that are easy to forget about.

**Solution**: Create a `justfile` in your dotfiles:
```just
# justfile

# List all available commands
default:
  @just --list

# Git operations
git-wtf:
  ~/.dotfiles/bin/git-wtf

git-promote:
  ~/.dotfiles/bin/git-promote

# Send notification
notify message:
  ~/.dotfiles/bin/push "{{message}}"

# TTS with any provider
tts provider text:
  ~/.dotfiles/bin/{{provider}}-tts "{{text}}"

# Generate image
image prompt:
  ~/.dotfiles/bin/generate-image "{{prompt}}"

# Create tmux session for project
session name:
  tmux new -A -s {{name}} -c ~/ws/{{name}}

# Full project setup with dependencies
setup project: (session project)
  cd ~/ws/{{project}} && pnpm install
  direnv allow

# Deploy to environment
deploy env:
  fly deploy --app myapp-{{env}}
  gh pr create --base {{env}}
```

**Usage**:
```bash
just --list           # See all commands
just git-wtf          # Run git-wtf
just tts inworld "Hello world"
just session sphere
just deploy staging
```

**Benefits**:
- Tab completion
- Built-in help
- Variables and templates
- Recipe dependencies (run multiple tasks in order)
- Per-directory justfiles

**Setup**:
```bash
brew install just

# Add to ~/.dotfiles/justfile
# Then from anywhere: just <command>
```

---

#### 3. `navi` - Interactive Cheatsheets ⭐

**Why**: Interactive command templates with variable prompts.

**Use case**: You have complex commands you run occasionally but forget the syntax.

**Example** (`~/.local/share/navi/cheats/custom.cheat`):
```
% git, rebase

# Interactive rebase last N commits
git rebase -i HEAD~<count>

$ count: echo "5 10 20 50" | tr ' ' '\n'

% tmux, layout

# Create dev layout for project
tmux new-session -s <project> -c ~/ws/<project> \; \
  split-window -h -c ~/ws/<project> \; \
  split-window -v -c ~/ws/<project> \; \
  select-pane -t 0

$ project: ls ~/ws | grep -v node_modules

% docker, cleanup

# Remove containers for specific image
docker rm $(docker ps -a -q --filter ancestor=<image>)

$ image: docker images --format '{{.Repository}}:{{.Tag}}'
```

**Usage**:
- `Ctrl+G` - Opens fuzzy search
- Select command
- Fill in prompted variables
- Executes or copies to clipboard

**Setup**:
```bash
brew install navi
mkdir -p ~/.local/share/navi/cheats
# Add custom cheats
```

**Note**: Less critical if you use Claude Code heavily, but useful for repetitive templated commands.

---

### Lower Priority

These are good but have higher switching costs or lower immediate value:

- **`zellij`**: Modern tmux alternative (but you have extensive tmux config)
- **`helix`**: Modern vim alternative (but you have neovim configured)
- **`starship`**: Cross-shell prompt (but you have p10k working)

---

## 📊 Tool Comparison Quick Reference

### Speed Benchmarks

| Task | Old | New | Speedup |
|------|-----|-----|---------|
| Search files | `find` | `fd` | 5-10x |
| Search content | `grep` | `rg` | 5-10x |
| Node version switch | `fnm` ~200ms | `mise` ~50ms | 4x |

### When to Use What

**For searching**:
- File by name: `fd pattern`
- Content in files: `rg pattern`
- Both: Claude Code's built-in tools (preferred)

**For HTTP requests**:
- Quick GET: `xh api.example.com/users`
- With auth: `xh GET api.example.com/users Authorization:"Bearer $TOKEN"`

**For monitoring**:
- System resources: `btop`
- Docker containers: `lazydocker`
- Processes on port: `lsof -i :3000` (unchanged)

**For history**:
- Recent commands: `Ctrl+R` (now uses atuin)
- Command stats: `atuin stats`
- Most used: `atuin stats | head -20`

---

## 🔐 Security Note

**Atuin sync**: All history is encrypted client-side before syncing. The Atuin server cannot read your commands even if they wanted to.

**Recommendation**: Start with local-only. Enable sync later if you get a second machine.

---

## 📚 Additional Resources

- **Atuin docs**: https://docs.atuin.sh
- **mise docs**: https://mise.jdx.dev
- **just docs**: https://just.systems
- **navi docs**: https://github.com/denisidoro/navi

---

## 🎯 Next Steps (Recommended Order)

1. **Restart shell** to activate atuin: `exec zsh`
2. **Import history**: `atuin import auto`
3. **Try new tools**: `btop`, `lazydocker`, `atuin stats`
4. **Consider mise** if you want simpler version + env management
5. **Consider just** if you want better script organization
6. **Consider navi** if you have complex commands you forget

---

## 📦 Installation Commands for Reference

```bash
# What was installed
brew install atuin btop lazydocker yq tldr hyperfine watchexec xh
gh extension install dlvhdr/gh-dash

# Future considerations
brew install mise      # Universal version manager
brew install just      # Command runner
brew install navi      # Interactive cheatsheets
```

---

**Remember**: Prefer Claude Code's built-in tools (Read, Grep, Glob) when available. These shell tools are for when you're working directly in the terminal.

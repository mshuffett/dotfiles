# Installation Scripts

Two simple scripts for setting up your Mac with these dotfiles.

## 📜 `script/bootstrap`

**The interactive setup wizard.**

**When to use:**
- Setting up a fresh Mac (if dotfiles already cloned)
- Reconfiguring an existing setup
- Want a guided, interactive experience

**What it does:**
1. Self-bootstraps (installs Homebrew and gum if needed)
2. Checks prerequisites (macOS, Xcode CLT)
3. Prompts for git configuration (name, email)
4. Shows backup strategy and creates safe backups
5. Creates symlinks for all `.symlink` files
6. Lets you choose which package categories to install:
   - 🟢 Essential (git, shell, terminal, CLI tools)
   - 🟡 Development (fnm, cloud tools)
   - 🟠 Utilities (text processing, navigation)
   - 🔵 Optional (Nerd Fonts)
7. Optionally sets up Node.js, tmux plugins, Neovim
8. Beautiful UI with progress indicators

**Run it:**
```bash
~/.dotfiles/script/bootstrap
```

**Features:**
- ✨ Beautiful interactive UI using gum
- 🔒 Safe, timestamped backups (~/.dotfiles_backup_TIMESTAMP)
- ♻️ Idempotent (safe to run multiple times)
- 🎯 Choose exactly what you want to install
- 🚀 Self-bootstrapping (installs own dependencies)

---

## 🚀 `script/install_from_scratch`

**One-line installer for brand new Mac.**

**When to use:**
- Brand new Mac with nothing installed
- Want one command to do everything
- Starting completely from scratch

**What it does:**
1. Checks for macOS
2. Installs Xcode Command Line Tools (if needed)
3. Installs Homebrew (if needed, with Apple Silicon support)
4. Clones dotfiles repo to `~/.dotfiles`
5. Checks out `fresh-mac-magic` branch
6. Runs `script/bootstrap` (the interactive wizard)

**Run it:**
```bash
curl -fsSL https://raw.githubusercontent.com/mshuffett/dotfiles/fresh-mac-magic/script/install_from_scratch | bash
```

**Use cases:**
- New Mac unboxing
- Clean macOS reinstall
- Setting up a work laptop

---

## Comparison

| Feature | `bootstrap` | `install_from_scratch` |
|---------|-------------|----------------------|
| **Use case** | Setup wizard | One-line fresh install |
| **Prerequisite** | Dotfiles cloned | Nothing (bare Mac) |
| **Interactive** | ✅ Yes | ✅ Yes (launches bootstrap) |
| **Safe backups** | ✅ Timestamped | ✅ Timestamped |
| **Choose packages** | ✅ Yes | ✅ Yes (via bootstrap) |
| **Clones repo** | ❌ No | ✅ Yes |
| **Run it from** | Local | GitHub (curl) |

---

## How .symlink Files Work

Both scripts create symlinks for all `*.symlink` files:

```
zsh/zshrc.symlink → ~/.zshrc
tmux/tmux.conf.symlink → ~/.tmux.conf
git/gitconfig.symlink → ~/.gitconfig
vim/vimrc.symlink → ~/.vimrc
```

Before creating symlinks:
1. Existing files are backed up to `~/.dotfiles_backup_YYYYMMDD_HHMMSS/`
2. Never overwrites existing backups (creates .backup.1, .backup.2, etc. if needed)
3. Completely non-destructive

---

## Package Management

Packages are defined in `Brewfile` with categories:

### 🟢 Essential (26 packages)
Git, shell tools, terminal, modern CLI replacements, Neovim, essential utilities

### 🟡 Development (4 packages)
Node.js version manager (fnm), cloud deployment tools, git-delta

### 🟠 Utilities (8 packages)
Text processing (gnu-sed, grep, moreutils), file navigation (broot, chafa)

### 🔵 Optional (6 packages)
Nerd Fonts for terminal icons

The wizard lets you choose which categories to install.

---

## VSCode Extensions

VSCode extensions are managed separately in `vscode/`:

```bash
# Install all extensions
cat ~/.dotfiles/vscode/extensions.txt | xargs -L 1 code --install-extension

# Update extension list
code --list-extensions > ~/.dotfiles/vscode/extensions.txt
```

See `vscode/README.md` for details.

---

## Topic-Specific Setup

The only topic install script that remains is:
- `tmux/install.sh` - Installs TPM (Tmux Plugin Manager)

The bootstrap wizard handles this optionally with a prompt.

---

## Summary

**Fresh Mac:** Use `install_from_scratch` (one curl command)

**Existing setup:** Use `bootstrap` (local script)

Both are safe, interactive, and guide you through the setup process.

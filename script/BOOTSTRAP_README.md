# Bootstrap Wizard

Interactive setup script for configuring a new Mac with these dotfiles.

## Quick Start

### One-Line Install (Fresh Mac)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/mshuffett/dotfiles/fresh-mac-magic/script/install_and_run_wizard)"
```

### If You Already Have Dotfiles Cloned

```bash
~/.dotfiles/script/bootstrap_wizard
```

## What It Does

The wizard will guide you through:

1. **Pre-flight checks**
   - Verify macOS
   - Install Xcode Command Line Tools (if needed)
   - Install Homebrew (if needed)
   - Install gum for pretty UI

2. **Git configuration**
   - Prompt for your name and email
   - Create gitconfig from template
   - Configure Delta for beautiful diffs

3. **Symlink dotfiles**
   - Backup existing configs to `~/.dotfiles_backup_TIMESTAMP`
   - Create symlinks for .zshrc, .tmux.conf, .vimrc, etc.

4. **Package installation**
   - Interactive selection of package categories:
     - 🟢 **Essential** - git, shell, terminal, modern CLI tools
     - 🟡 **Development** - fnm, cloud tools
     - 🟠 **Utilities** - text processing, file navigation
     - 🔵 **Optional** - Nerd Fonts
   - Install selected packages via Homebrew

5. **Additional setup**
   - Install Node.js LTS via fnm (optional)
   - Install Tmux Plugin Manager (optional)
   - Configure Neovim plugins (optional)

## Features

- ✨ **Beautiful UI** using [gum](https://github.com/charmbracelet/gum)
- 🔒 **Safe** - backs up existing configs before overwriting
- ♻️ **Idempotent** - safe to run multiple times
- 🎯 **Interactive** - choose only what you need
- 📦 **Minimal** - 43 packages (vs 250+ in old Brewfile)

## Package Categories

### 🟢 Essential (25 packages)
Core tools you definitely want:
- **Version Control**: git, gh, git-lfs, lazygit, tig
- **Shell & Terminal**: tmux, fzf, direnv, zoxide
- **Modern CLI**: bat, eza, fd, ripgrep
- **Editors**: neovim
- **Utilities**: entr, watch, wget, gum, glow
- **Security**: gnupg, 1password-cli

### 🟡 Development (3 packages)
- fnm (Node.js version manager)
- flyctl, supabase (deployment tools)
- git-delta (beautiful diffs)

### 🟠 Utilities (8 packages)
- Text processing: gnu-sed, grep, moreutils
- File navigation: broot, chafa
- System tools: duti, rclone

### 🔵 Optional (6 packages)
- Nerd Fonts for terminal icons
- Font options: Commit Mono, Fira Code, Hack, JetBrains Mono, Meslo LG, Monaspice

## Post-Install Steps

After the wizard completes:

1. **Restart your shell**
   ```bash
   exec zsh
   ```

2. **Install tmux plugins**
   - Open tmux: `tmux`
   - Press `Ctrl+a I` (capital i) to install plugins

3. **Install Neovim plugins**
   - Launch neovim: `nvim`
   - Plugins will install automatically (NvChad)

4. **Install Node.js** (if you selected fnm)
   ```bash
   fnm install --lts
   fnm default lts-latest
   ```

5. **Review configuration**
   - Check `~/.zshrc` for z4h (zsh for humans) setup
   - Check `~/.tmux.conf` for tmux configuration
   - Check `~/.gitconfig` for git settings

## VSCode Extensions

VSCode extensions are managed separately in `~/.dotfiles/vscode/`:

```bash
# Install all extensions
cat ~/.dotfiles/vscode/extensions.txt | xargs -L 1 code --install-extension

# Update extension list
code --list-extensions > ~/.dotfiles/vscode/extensions.txt
```

## Troubleshooting

**Script won't run:**
```bash
chmod +x ~/.dotfiles/script/bootstrap_wizard
```

**Homebrew not in PATH (Apple Silicon):**
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**Git config not created:**
Run the wizard again - it will prompt for git config if missing.

**Symlinks not working:**
Check if files exist: `ls -la ~/ | grep "^\l"`

## Manual Installation

If you prefer to install components manually:

1. **Just packages:**
   ```bash
   cd ~/.dotfiles
   brew bundle install
   ```

2. **Just symlinks:**
   ```bash
   cd ~/.dotfiles
   script/bootstrap
   ```

3. **Just one category:**
   Edit Brewfile and comment out unwanted sections, then:
   ```bash
   brew bundle install
   ```

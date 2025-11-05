## mshuffett does dotfiles

Personal dotfiles for macOS, originally forked from [holman's dotfiles](https://github.com/holman/dotfiles) with major modifications.

**Stack:** [zsh for humans](https://github.com/romkatv/zsh4humans), tmux, Neovim (NvChad), Ghostty terminal, modern CLI tools (bat, eza, fd, ripgrep, fzf)

**Note:** This repository should be kept private as it contains sensitive configuration and paths.

## 🚀 Quick Install

### Fresh Mac (Nothing Installed)

One command installs everything:

```sh
curl -fsSL https://raw.githubusercontent.com/mshuffett/dotfiles/fresh-mac-magic/script/install_from_scratch | bash
```

This clones the repo and launches the interactive setup wizard.

### Dotfiles Already Cloned

Run the interactive setup wizard:

```sh
~/.dotfiles/script/bootstrap
```

**What the wizard does:**
- ✨ Beautiful interactive UI with gum
- 🔧 Configure git (name, email)
- 🔗 Create symlinks (with safe backups)
- 📦 Choose which packages to install
- ⚙️ Optional setup (Node.js, tmux plugins, Neovim)

See [Bootstrap README](script/BOOTSTRAP_README.md) for full details.

## Secrets Management

This dotfiles repo uses 1Password CLI for secure secrets management. Here's how it works:

### Setup

1. Install 1Password CLI:

```sh
brew install --cask 1password-cli
```

2. First-time setup will prompt you to login to 1Password CLI when you open a new shell

3. Secrets are then cached locally in `~/.zsh_secrets_cache` (gitignored)

### Usage

- Secrets are automatically loaded in new shell sessions
- To refresh secrets from 1Password: run `refresh_secrets`
- Secrets are stored in 1Password under the "Private" vault

### Required 1Password Setup

Store your secrets in 1Password with these paths:

- `op://Private/GitHub/token`
- `op://Private/OpenAI/api_key`
- `op://Private/Anthropic/api_key`
- `op://Private/Mapbox/access_token`

## 📦 What's Included

**43 carefully curated packages** (reduced from 250+ bloated auto-generated list):

### 🟢 Essential (25 packages)
- **Version Control:** git, gh, git-lfs, lazygit, tig, git-delta
- **Shell & Terminal:** tmux, fzf, direnv, zoxide
- **Modern CLI:** bat, eza, fd, ripgrep, gum, glow
- **Editors:** neovim
- **Utilities:** entr, watch, wget
- **Security:** gnupg, 1password-cli

### 🟡 Development (3 packages)
- fnm (Node.js version manager)
- flyctl, supabase (deployment tools)

### 🟠 Utilities (8 packages)
- gnu-sed, grep, moreutils (text processing)
- broot, chafa (file navigation)
- duti, rclone (system tools)

### 🔵 Optional (6 packages)
- Nerd Fonts for terminal icons

**VSCode extensions** are managed separately in [`vscode/extensions.txt`](vscode/README.md)

## 🛠️ Configuration Highlights

- **Shell:** [zsh for humans](https://github.com/romkatv/zsh4humans) (z4h) with Oh My Zsh integration
- **Prompt:** Powerlevel10k
- **Terminal:** Ghostty with Palenight theme
- **Multiplexer:** tmux with TPM, vim navigation, tmux2k theme
- **Editor:** Neovim with NvChad
- **Git:** Delta for beautiful diffs, comprehensive aliases
- **Claude Code:** Custom commands and hooks in `claude/`

## for me

Feel free to fork these dotfiles, but I am primarily focusing on them for personal use, so YMMV.

## topical

Everything's built around topic areas. If you're adding a new area to your
forked dotfiles — say, "Java" — you can simply add a `java` directory and put
files in there. Anything with an extension of `.zsh` will get automatically
included into your shell. Anything with an extension of `.symlink` will get
symlinked without extension into `$HOME` when you run `script/bootstrap`.

## components

There's a few special files in the hierarchy.

- **bin/**: Anything in `bin/` will get added to your `$PATH` and be made
  available everywhere.
- **topic/\*.zsh**: Any files ending in `.zsh` get loaded into your
  environment.
- **topic/path.zsh**: Any file named `path.zsh` is loaded first and is
  expected to setup `$PATH` or similar.
- **topic/completion.zsh**: Any file named `completion.zsh` is loaded
  last and is expected to setup autocomplete.
- **topic/\*.symlink**: Any files ending in `*.symlink` get symlinked into
  your `$HOME`. This is so you can keep all of those versioned in your dotfiles
  but still keep those autoloaded files in your home directory. These get
  symlinked in when you run `script/bootstrap`.

## prompt

Checkout out [this link](for more info on the current prompt)

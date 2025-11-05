# Dotfiles Scripts Explained

There are multiple installation scripts in this repository. Here's when to use each one:

## 🎯 Recommended: Bootstrap Wizard (NEW)

**File:** `script/bootstrap_wizard`

**When to use:**
- ✅ Fresh Mac setup
- ✅ Interactive installation with choices
- ✅ You want a pleasant UI
- ✅ You want safe backups and clear explanations

**What it does:**
1. Checks prerequisites (macOS, Xcode CLT)
2. Installs Homebrew and gum automatically
3. Prompts for git configuration
4. Shows backup strategy before creating symlinks
5. Lets you choose which package categories to install
6. Optionally sets up Node.js, tmux plugins, Neovim
7. Beautiful progress indicators and summaries

**Run it:**
```bash
~/.dotfiles/script/bootstrap_wizard
```

**Or one-line install from scratch:**
```bash
curl -fsSL https://raw.githubusercontent.com/mshuffett/dotfiles/fresh-mac-magic/script/install_and_run_wizard | bash
```

---

## 📜 Classic: Bootstrap Script (OLD)

**File:** `script/bootstrap`

**When to use:**
- ✅ Non-interactive/automated setups
- ✅ You prefer the original workflow
- ✅ Scripting/CI environments

**What it does:**
1. Prompts for git name/email
2. Creates symlinks with interactive backup choices per file
3. Runs `bin/dot` to install all dependencies
4. Runs all topic `install.sh` scripts

**Run it:**
```bash
~/.dotfiles/script/bootstrap
```

**Differences from wizard:**
- No pretty UI (uses basic terminal colors)
- Asks about each file individually (skip/overwrite/backup)
- Installs ALL packages from Brewfile (no selection)
- Uses `.backup` suffix instead of timestamped directory

---

## 📦 Install Script

**File:** `script/install`

**When to use:**
- ✅ Just want to install packages
- ✅ Already have symlinks set up
- ✅ Updating dependencies

**What it does:**
1. Runs `brew bundle` (installs everything from Brewfile)
2. Runs all topic-specific `install.sh` scripts

**Run it:**
```bash
~/.dotfiles/script/install
```

---

## 🔄 Update Script (dot)

**File:** `bin/dot`

**When to use:**
- ✅ Regular maintenance/updates
- ✅ Pull latest changes and update packages

**What it does:**
1. Updates Homebrew
2. Runs `brew update`
3. Runs `script/install`

**Run it:**
```bash
dot
```

Or directly:
```bash
~/.dotfiles/bin/dot
```

---

## One-Line Installer

**File:** `script/install_and_run_wizard`

**When to use:**
- ✅ Brand new Mac, nothing installed
- ✅ Want to run everything from one command

**What it does:**
1. Checks for macOS
2. Installs Xcode Command Line Tools (if needed)
3. Installs Homebrew (if needed)
4. Clones dotfiles repo to `~/.dotfiles`
5. Checks out `fresh-mac-magic` branch
6. Runs the bootstrap wizard

**Run it:**
```bash
curl -fsSL https://raw.githubusercontent.com/mshuffett/dotfiles/fresh-mac-magic/script/install_and_run_wizard | bash
```

---

## Comparison Table

| Feature | Bootstrap Wizard | Classic Bootstrap | Install | Dot |
|---------|-----------------|-------------------|---------|-----|
| Interactive UI | ✅ Gum | Basic prompts | ❌ | ❌ |
| Self-bootstrapping | ✅ | ❌ | ❌ | ❌ |
| Git config | ✅ | ✅ | ❌ | ❌ |
| Symlinks | ✅ | ✅ | ❌ | ❌ |
| Package selection | ✅ | ❌ (all) | ❌ (all) | ❌ (all) |
| Backup strategy | Timestamped dir | .backup suffix | N/A | N/A |
| Safe for multiple runs | ✅ | ⚠️ | ✅ | ✅ |
| Recommended for | Fresh Mac | CI/scripts | Updates | Maintenance |

---

## Backup Strategies Compared

### Bootstrap Wizard
- Creates `~/.dotfiles_backup_YYYYMMDD_HHMMSS/`
- All existing configs copied to this directory
- Never overwrites existing backups
- Easy to find and restore all files at once

**Example:**
```
~/.dotfiles_backup_20250104_143022/
├── zshrc
├── tmux.conf
├── vimrc
└── gitconfig
```

### Classic Bootstrap
- Prompts for each file: skip, overwrite, or backup
- Creates `.backup` suffix: `~/.zshrc.backup`
- If `.backup` exists, prompts again
- More granular control, but more interactive

**Example:**
```
~/.zshrc.backup
~/.tmux.conf.backup
~/.vimrc.backup
```

---

## Which Should You Use?

**For a fresh Mac:**
→ Use **Bootstrap Wizard** (`script/bootstrap_wizard`)

**For automation/scripting:**
→ Use **Classic Bootstrap** (`script/bootstrap`)

**To just update packages:**
→ Use **Install** (`script/install`)

**For regular maintenance:**
→ Use **Dot** (`bin/dot`)

**Starting from absolute zero:**
→ Use **One-Line Installer** (curl command above)

---

## Topic-Specific Install Scripts

Many topics have their own `install.sh` scripts that run automatically:

- `homebrew/install.sh` - Installs Homebrew
- `tmux/install.sh` - Installs TPM (Tmux Plugin Manager)
- `vim/install.sh` - Installs vim plugins
- `fonts/install.sh` - Installs fonts
- And more...

These are called by:
- `script/bootstrap` (classic)
- `script/install`
- `bin/dot`

The **Bootstrap Wizard** handles these manually with prompts, giving you more control.

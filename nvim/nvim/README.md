# NvChad Configuration

This NvChad configuration was originally based on [NvChad/starter](https://github.com/NvChad/starter).

## Origin

- **Upstream Repository**: https://github.com/NvChad/starter  
- **Initial Commit**: 45a1b2c (NvChad starter initial commit)
- **Date Forked**: 2025-10-16

The main nvchad repo (NvChad/NvChad) is used as a plugin by this config.

## Customizations

This configuration includes custom plugins and settings:

### AI Assistants
- **codecompanion.nvim** - Chat-based AI coding with Claude Code
- **avante.nvim** - Cursor-like sidebar AI assistant  
- Both configured to use Claude Code subscription via ACP (no API billing)

### Tmux Integration
- **vim-tmux-navigator** - Seamless navigation between vim and tmux panes with Ctrl+h/j/k/l

### Undo History
- **telescope-undo** - Fuzzy search through undo history (`<leader>u`)
- **undotree** - Visual tree representation of undo history (`<leader>ut`)

### Markdown Support
- **bullets.vim** - Smart bullet and checkbox handling
- **render-markdown.nvim** - Beautiful markdown rendering  
- **outline.nvim** - Document structure sidebar

### UI Enhancements
- **which-key.nvim** - Keybinding discovery
- **dressing.nvim** - Better UI for vim.select with Telescope
- **legendary.nvim** - Enhanced command palette

## Installation

This is part of the dotfiles repo at `~/.dotfiles/nvim/nvim`.

The configuration is symlinked to `~/.config/nvim` via the dotfiles installation script.

## Environment Variables

Requires `CLAUDE_CODE_OAUTH_TOKEN` to be set for AI assistants (configured in `~/.zshrc`).

## Original NvChad Docs

- Read the NvChad docs: https://nvchad.com/docs/quickstart/install
- All lazy.nvim & nvchad options are in `options.lua`
- Chadrc is for UI & nvim config file related configs  
- Checkout the Lazy.nvim docs for various customizations

## Credits

- LazyVim starter https://github.com/LazyVim/starter - NvChad's starter was inspired by this

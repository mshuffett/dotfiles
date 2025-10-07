---
description: Switch between color themes (palenight, night-owl, etc.) for terminal, tmux, prompt, and Ghostty. Automatically updates all config files and commits changes to dotfiles. Use when user wants to change their terminal theme or try a different color scheme.
---

# Theme Switcher Command

This command switches between different terminal themes by updating:
- Ghostty terminal colors
- Tmux status bar and pane colors
- Powerlevel10k prompt colors
- LS/Eza directory listing colors

## Available Themes

### palenight
Material Palenight theme with purple/blue/teal accents
- Background: #292d3e
- Foreground: #bfc7d5
- Primary colors: Blue (#82aaff), Green (#c3e88d), Purple (#c792ea), Cyan (#89ddff)

### night-owl
Sarah Drasner's Night Owl theme with teal/blue/coral accents
- Background: #011627
- Foreground: #d6deeb
- Primary colors: Teal (#43), Light Blue (#111), Yellow-Green (#149), Coral (#210), Lavender (#147)

## Color Mappings

Each theme defines these semantic colors:

### Ghostty (`~/.dotfiles/ghostty/config`)
- `background` - Main background color
- `foreground` - Main text color
- `cursor-color` - Cursor color
- `selection-background` - Selection background
- `palette` - 16 ANSI colors (0-15)

### Tmux (`~/.dotfiles/tmux/tmux.conf.symlink`)
- Status bar background/foreground
- Window status (active/inactive)
- Pane borders (active/inactive)
- Message colors

### Powerlevel10k (`~/.dotfiles/p10k/p10k.zsh`)
- `POWERLEVEL9K_PROMPT_CHAR_OK_*_FOREGROUND` - Success prompt
- `POWERLEVEL9K_PROMPT_CHAR_ERROR_*_FOREGROUND` - Error prompt
- `POWERLEVEL9K_DIR_FOREGROUND` - Current directory
- `POWERLEVEL9K_DIR_ANCHOR_FOREGROUND` - Anchor directories
- `POWERLEVEL9K_VCS_CLEAN_FOREGROUND` - Git clean status
- `POWERLEVEL9K_VCS_MODIFIED_FOREGROUND` - Git modified status
- `POWERLEVEL9K_VCS_UNTRACKED_FOREGROUND` - Git untracked status
- `POWERLEVEL9K_STATUS_OK_FOREGROUND` - Command success
- `POWERLEVEL9K_STATUS_ERROR_FOREGROUND` - Command error
- `POWERLEVEL9K_BACKGROUND_JOBS_FOREGROUND` - Background jobs
- `POWERLEVEL9K_DIRENV_FOREGROUND` - Direnv indicator
- `POWERLEVEL9K_ASDF_FOREGROUND` - ASDF version manager

### LS Colors (`~/.zshrc`)
- `LSCOLORS` - BSD ls colors (macOS format)
- `LS_COLORS` - GNU ls colors (used by eza)
  - `di` - Directories
  - `ln` - Symlinks
  - `ex` - Executables
  - `so`, `pi` - Special files
  - `bd`, `cd` - Block/character devices

## Usage

Invoke this command when the user asks to change themes:
- "Switch to palenight theme"
- "Change my theme to night-owl"
- "Use the palenight colors"

## Implementation Steps

1. **Confirm the theme change** with the user
2. **Update Ghostty config** with theme colors and palette
3. **Update tmux config** with theme-specific status bar, window, and pane colors
4. **Update p10k config** with semantic color mappings for all prompt elements
5. **Update LS_COLORS** in .zshrc with directory/file type colors
6. **Commit all changes** to dotfiles repo with descriptive message
7. **Inform user** to restart/reload:
   - Ghostty: Restart terminal or reload config
   - Tmux: Run `tmux source ~/.tmux.conf` or `st` alias
   - Zsh/p10k: Run `exec zsh` or `s` alias
   - Eza: Automatic on next command

## Example Response

```
I'll switch your terminal theme to palenight.

Updating:
- Ghostty config with palenight colors
- Tmux status bar and panes
- Powerlevel10k prompt colors
- LS/Eza directory colors

[Updates files...]

✓ Theme changed to palenight

To apply changes:
- Restart Ghostty or reload config
- Run `st` to reload tmux config
- Run `s` to reload zsh and apply prompt colors
```

## Notes

- Always commit changes to dotfiles after updating
- Preserve any custom settings not related to colors
- Use exact color codes from theme definitions
- Update both old tmux syntax (colour123) and new syntax (#hex)
- For p10k, update both icon colors and foreground colors

# Tmux Status Bar Enhancement Options

## Current Setup
Shows: Current session | All sessions | Hints | Pane count | Time

## Additional Ideas (if you want more):

### 1. Show Git Branch (if in git repo)
```bash
set -g status-right "#[fg=colour60]#{?#{==:#{pane_current_path},~},~,#(cd #{pane_current_path} && git branch --show-current 2>/dev/null || echo '')} │ tn/ts • C-a / help │ #{window_panes} panes │ %d %b %R"
```

### 2. Show CPU/Memory Usage
```bash
# Requires `tmux-cpu` plugin
set -g @plugin 'tmux-plugins/tmux-cpu'
set -g status-right "CPU:#{cpu_percentage} MEM:#{ram_percentage} │ #{window_panes} panes │ %R"
```

### 3. Show Battery (for MacBook)
```bash
set -g status-right "#[fg=colour114]🔋#{battery_percentage} │ #{window_panes} panes │ %R"
```

### 4. Show Prefix Indicator
```bash
# Shows when you've pressed Ctrl+a (prefix)
set -g status-left "#{?client_prefix,#[fg=colour204]PREFIX ,}#[fg=colour114,bold]#S #[fg=colour60]│ #(~/.dotfiles/tmux/scripts/tmux-sessions.sh)"
```

### 5. Show Zoom Indicator
```bash
set -g status-right "#{?window_zoomed_flag,#[fg=colour204]🔍 ZOOMED ,}tn/ts • C-a / help │ #{window_panes} panes │ %R"
```

### 6. Session Count + Total Panes
```bash
set -g status-right "#{session_windows}w #{session_panes}p │ tn/ts • C-a / help │ %R"
```

## Recommended for Ultrawide (Maximum Info)
```bash
# Left: Session info + all sessions + prefix indicator
set -g status-left "#{?client_prefix,#[fg=colour204]● ,}#[fg=colour114,bold]#S #[fg=colour60]│ #(~/.dotfiles/tmux/scripts/tmux-sessions.sh)"

# Right: Git branch + zoom indicator + hints + stats + time
set -g status-right "#{?window_zoomed_flag,#[fg=colour204]🔍 ,}#[fg=colour141]#(cd #{pane_current_path} && git branch --show-current 2>/dev/null) #[fg=colour60]│ tn/ts • C-a / │ #{session_windows}w #{window_panes}p │ %d %b %R"
```

## Color Reference (Palenight)
- colour114 = #c3e88d (green)
- colour111 = #82aaff (blue)
- colour141 = #c792ea (purple)
- colour60  = #697098 (gray)
- colour204 = #ff5370 (red/alert)

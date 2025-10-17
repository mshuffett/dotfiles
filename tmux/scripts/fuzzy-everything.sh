#!/usr/bin/env bash
# Unified fuzzy finder - search everything in one list

# Build the list with prefixes
items=$(
  # Sessions
  tmux list-sessions -F '[SESSION] #{session_name} (#{session_windows} windows)' 2>/dev/null

  # Windows
  tmux list-windows -a -F '[WINDOW] #{session_name}:#{window_index} #{window_name} (#{window_panes} panes)' 2>/dev/null

  # Panes
  tmux list-panes -a -F '[PANE] #{session_name}:#{window_index}.#{pane_index} #{window_name} → #{pane_current_command} (#{pane_width}x#{pane_height})' 2>/dev/null

  # Commands
  tmux list-commands | awk '{print "[COMMAND] " $1 " - " substr($0, index($0,$2))}'

  # Keybindings
  tmux list-keys | awk '{print "[KEYBIND] " $0}'

  # Clipboard/Buffers
  tmux list-buffers 2>/dev/null | awk '{print "[BUFFER] " $0}'
)

# Show in fzf with preview
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
selected=$(echo "$items" | fzf \
  --height=80% \
  --layout=reverse \
  --border \
  --prompt='🔍 Find: ' \
  --preview="$SCRIPT_DIR/fuzzy-everything-preview.sh {}" \
  --preview-window=right:60%:wrap
)

# Exit if nothing selected
[[ -z "$selected" ]] && exit 0

# Handle selection based on type
if [[ "$selected" == *"[SESSION]"* ]]; then
  target=$(echo "$selected" | awk '{print $2}')
  tmux switch-client -t "$target"
elif [[ "$selected" == *"[WINDOW]"* ]]; then
  target=$(echo "$selected" | awk '{print $2}')
  tmux select-window -t "$target"
elif [[ "$selected" == *"[PANE]"* ]]; then
  target=$(echo "$selected" | awk '{print $2}')
  tmux select-pane -t "$target"
elif [[ "$selected" == *"[COMMAND]"* ]]; then
  cmd=$(echo "$selected" | sed 's/\[COMMAND\] //' | awk '{print $1}')
  tmux command-prompt -I "$cmd"
elif [[ "$selected" == *"[KEYBIND]"* ]]; then
  # Show keybinding info (already visible in selection)
  echo "$selected" | sed 's/\[KEYBIND\] //'
elif [[ "$selected" == *"[BUFFER]"* ]]; then
  buffer=$(echo "$selected" | awk '{print $2}' | sed 's/buffer//')
  tmux paste-buffer -b "$buffer"
fi

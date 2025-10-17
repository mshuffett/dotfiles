#!/usr/bin/env bash
# Preview script for fuzzy-everything

line="$1"
target=$(echo "$line" | awk '{print $2}')

if [[ "$line" == *"[SESSION]"* ]]; then
  tmux list-windows -t "$target" -F "  #{window_index}: #{window_name} (#{window_panes} panes)" 2>/dev/null
elif [[ "$line" == *"[WINDOW]"* ]]; then
  tmux list-panes -t "$target" -F "  #{pane_index}: #{pane_current_command} #{pane_width}x#{pane_height}" 2>/dev/null
elif [[ "$line" == *"[PANE]"* ]]; then
  tmux capture-pane -t "$target" -p 2>/dev/null || echo "Cannot preview pane"
elif [[ "$line" == *"[COMMAND]"* ]]; then
  cmd=$(echo "$line" | sed 's/\[COMMAND\] //' | awk '{print $1}')
  tmux list-commands | grep "^$cmd " || echo "Tmux command: $cmd"
elif [[ "$line" == *"[KEYBIND]"* ]]; then
  echo "Keybinding details:"
  echo "$line" | sed 's/\[KEYBIND\] //'
elif [[ "$line" == *"[BUFFER]"* ]]; then
  buffer=$(echo "$line" | awk '{print $2}' | sed 's/buffer//')
  echo "Buffer $buffer contents:"
  tmux show-buffer -b "$buffer" 2>/dev/null | head -20
fi

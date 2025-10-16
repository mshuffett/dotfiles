#!/bin/bash
# Shows all tmux sessions with indicator for current session

current_session=$(tmux display-message -p '#S')
all_sessions=$(tmux list-sessions -F '#{session_name}' 2>/dev/null | tr '\n' ' ')

# Color codes for Palenight theme
green="#c3e88d"
blue="#82aaff"
purple="#c792ea"
gray="#697098"

output=""
for session in $all_sessions; do
  if [ "$session" = "$current_session" ]; then
    # Current session - highlighted
    output+="#[fg=$blue,bold][$session]#[fg=$gray,nobold] "
  else
    # Other sessions - dimmed
    output+="#[fg=$gray]$session#[fg=$gray] "
  fi
done

echo "$output"

#!/bin/bash
# Claude Code status line
# Renders: [HH:MM] model @ dir branch  ██░░░ 28%  session_id  [style]

input=$(cat)

# Core fields
model=$(echo "$input" | jq -r '.model.display_name')
current_dir=$(echo "$input" | jq -r '.workspace.current_dir')
style=$(echo "$input" | jq -r '.output_style.name')
session_name=$(echo "$input" | jq -r '.session_name // empty')
session_id=$(echo "$input" | jq -r '.session_id // empty')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

# Directory display
dir_display=$(basename "$current_dir")

# Git info
git_info=""
if [ -d "$current_dir/.git" ] || git -C "$current_dir" rev-parse --git-dir > /dev/null 2>&1; then
  branch=$(git -C "$current_dir" branch --show-current 2>/dev/null || echo "detached")
  if [ -n "$branch" ]; then
    if ! git -C "$current_dir" diff --quiet 2>/dev/null || ! git -C "$current_dir" diff --cached --quiet 2>/dev/null; then
      git_info=$'\e[33m⚡'"$branch"$'\e[0m'
    else
      git_info=$'\e[32m⎇ '"$branch"$'\e[0m'
    fi
  fi
fi

# Context bar (5 chars, color-coded)
ctx_display=""
if [ -n "$used_pct" ]; then
  # Calculate filled blocks (out of 5)
  filled=$(echo "$used_pct" | awk '{printf "%d", ($1 / 20) + 0.5}')
  [ "$filled" -gt 5 ] && filled=5
  [ "$filled" -lt 0 ] && filled=0
  empty=$((5 - filled))

  # Color based on usage
  if [ "${used_pct%.*}" -ge 80 ] 2>/dev/null || [ "$used_pct" = "100" ]; then
    color=$'\e[31m'  # red
  elif [ "${used_pct%.*}" -ge 50 ] 2>/dev/null; then
    color=$'\e[33m'  # yellow
  else
    color=$'\e[32m'  # green
  fi

  bar="${color}"
  for ((i=0; i<filled; i++)); do bar+="█"; done
  bar+=$'\e[2m'
  for ((i=0; i<empty; i++)); do bar+="░"; done
  bar+=$'\e[0m'

  # Round percentage for display
  pct_display=$(printf "%.0f" "$used_pct" 2>/dev/null || echo "$used_pct")
  ctx_display=" ${bar} ${color}${pct_display}%"$'\e[0m'
fi

# Session: show name if renamed, otherwise full ID in dim
session_display=""
if [ -n "$session_name" ]; then
  session_display=$'\e[36m'"$session_name"$'\e[0m'
elif [ -n "$session_id" ]; then
  session_display=$'\e[2m'"$session_id"$'\e[0m'
fi

# Timestamp
timestamp=$(date +"%H:%M")

# Assemble
printf $'\e[2m[%s]\e[0m \e[36m%s\e[0m \e[2m@\e[0m \e[34m%s\e[0m %s%s  %s  \e[2m[%s]\e[0m' \
  "$timestamp" "$model" "$dir_display" "$git_info" "$ctx_display" "$session_display" "$style"

#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Ghostty (No Tmux)
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 👻
# @raycast.packageName Ghostty

# Opens a new Ghostty window without tmux auto-starting
# Sets CURSOR_TRACE_ID env var to bypass tmux auto-start
env CURSOR_TRACE_ID=bypass /Applications/Ghostty.app/Contents/MacOS/ghostty

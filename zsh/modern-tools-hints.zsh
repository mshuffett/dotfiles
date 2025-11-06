# Modern CLI Tools - Helpful Hints
# Subtle reminders about better alternatives without being annoying

# ============================================================================
# STARTUP HINTS - Show occasionally (10% of the time)
# ============================================================================

_show_startup_hint() {
  # Only show 10% of the time (random)
  if (( RANDOM % 10 == 0 )); then
    local hints=(
      "💡 Tip: Use 'atuin stats' to see your most-used commands"
      "💡 Tip: Try 'btop' for a beautiful system monitor"
      "💡 Tip: 'lazydocker' gives you a TUI for Docker management"
      "💡 Tip: Press Ctrl+R for fuzzy history search with atuin"
      "💡 Tip: 'gh dash' shows your GitHub PRs and issues"
      "💡 Tip: 'tldr <command>' gives quick examples instead of long man pages"
      "💡 Tip: 'hyperfine <cmd1> <cmd2>' benchmarks command performance"
      "💡 Tip: 'watchexec -e ts,tsx <command>' runs commands when files change"
    )

    # Pick a random hint
    local hint=${hints[$RANDOM % ${#hints[@]} + 1]}
    echo "$hint"
  fi
}

# Show hint on startup (non-blocking, doesn't slow down shell)
_show_startup_hint

# ============================================================================
# COMMAND WRAPPERS - Suggest better alternatives
# ============================================================================

# Wrapper for man -> suggest tldr
man() {
  # Show hint occasionally (20% of the time)
  if (( RANDOM % 5 == 0 )); then
    echo "💡 Quick tip: Try 'tldr $1' for practical examples"
  fi
  command man "$@"
}

# Wrapper for find -> suggest fd
find() {
  # Only hint if it looks like a simple file search
  if [[ "$*" == *"-name"* ]] && (( RANDOM % 5 == 0 )); then
    echo "💡 Faster alternative: fd <pattern>"
  fi
  command find "$@"
}

# Wrapper for grep -> suggest rg
# Note: Only hint for recursive searches since you have rg aliased
grep() {
  if [[ "$*" == *"-r"* ]] || [[ "$*" == *"-R"* ]] && (( RANDOM % 5 == 0 )); then
    echo "💡 Faster alternative: rg <pattern>"
  fi
  command grep "$@"
}

# Wrapper for curl -> suggest xh (only for simple GET requests)
curl() {
  # Hint for simple GET requests
  if [[ "$1" =~ ^https?:// ]] && (( RANDOM % 5 == 0 )); then
    echo "💡 Friendlier alternative: xh $1"
  fi
  command curl "$@"
}

# Wrapper for top -> suggest btop
top() {
  if (( RANDOM % 3 == 0 )); then
    echo "💡 Better alternative: btop (press 'q' to quit)"
    sleep 1
  fi
  command top "$@"
}

# Wrapper for htop -> suggest btop (if htop exists)
if command -v htop &>/dev/null; then
  htop() {
    if (( RANDOM % 3 == 0 )); then
      echo "💡 Even better: btop (more features, prettier graphs)"
      sleep 1
    fi
    command htop "$@"
  }
fi

# ============================================================================
# HELPFUL ALIASES FOR DISCOVERY
# ============================================================================

# Quick command to show all modern tool tips
alias modern-tools='cat <<EOF
🚀 Modern CLI Tools Available:

REPLACEMENTS:
  rg <pattern>              → Fast search (better than grep -r)
  fd <pattern>              → Fast find (better than find)
  bat <file>                → Cat with syntax highlighting
  xh <url>                  → Friendly HTTP client (better than curl)
  yq <query> file.yml       → Process YAML/JSON/XML

PRODUCTIVITY:
  atuin stats               → Show command usage statistics
  btop                      → Beautiful system monitor
  lazydocker                → Docker container TUI
  gh dash                   → GitHub PRs/issues dashboard
  tldr <command>            → Quick command examples
  hyperfine <cmd1> <cmd2>   → Benchmark commands
  watchexec -e ts <cmd>     → Run command when files change

EXISTING (already configured):
  z <dir>                   → Jump to directory (zoxide)
  lg                        → Lazygit TUI

Press Ctrl+R for fuzzy history search!

To disable these hints: Set DISABLE_TOOL_HINTS=1 in your ~/.zshrc
EOF'

# Alias for quick reference
alias hints='modern-tools'

# ============================================================================
# DISABLE MECHANISM
# ============================================================================
# Add this to your ~/.zshrc to disable all hints:
# export DISABLE_TOOL_HINTS=1

if [[ -n "$DISABLE_TOOL_HINTS" ]]; then
  # Unset all wrapper functions
  unfunction man find grep curl top htop 2>/dev/null
fi

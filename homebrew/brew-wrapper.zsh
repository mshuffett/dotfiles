# Automatic Brewfile updates
# Wraps brew command to auto-update Brewfile after install/uninstall
# Only define the wrapper if brew is installed

if command -v brew &>/dev/null; then
  brew() {
    command brew "$@"
    local exit_code=$?

    # Update Brewfile in background after install/uninstall commands
    if [[ "$1" == "install" || "$1" == "uninstall" || "$1" == "remove" ]]; then
      if [[ $exit_code -eq 0 ]]; then
        (
          local lockfile="/tmp/brewfile-update.lock"
          if command -v flock &>/dev/null; then
            (
              # Wait up to 30 seconds for lock, then dump current state
              flock -w 30 200 || exit 0
              command brew bundle dump --force --describe --file=~/.dotfiles/Brewfile 2>/dev/null
              # Remove VSCode extensions from Brewfile (managed separately)
              # Use portable sed syntax
              if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' '/^vscode /d' ~/.dotfiles/Brewfile
              else
                sed -i '/^vscode /d' ~/.dotfiles/Brewfile
              fi
            ) 200>"$lockfile"
          else
            # No flock available, just run without locking
            command brew bundle dump --force --describe --file=~/.dotfiles/Brewfile 2>/dev/null
            if [[ "$OSTYPE" == "darwin"* ]]; then
              sed -i '' '/^vscode /d' ~/.dotfiles/Brewfile
            else
              sed -i '/^vscode /d' ~/.dotfiles/Brewfile
            fi
          fi
        ) &
      fi
    fi

    return $exit_code
  }
fi

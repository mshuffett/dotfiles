# Automatic Brewfile updates
# Wraps brew command to auto-update Brewfile after install/uninstall

brew() {
  command brew "$@"
  local exit_code=$?

  # Update Brewfile in background after install/uninstall commands
  if [[ "$1" == "install" || "$1" == "uninstall" || "$1" == "remove" ]]; then
    if [[ $exit_code -eq 0 ]]; then
      (
        local lockfile="/tmp/brewfile-update.lock"
        (
          # Wait up to 30 seconds for lock, then dump current state
          flock -w 30 200 || exit 0
          command brew bundle dump --force --describe --file=~/.dotfiles/Brewfile 2>/dev/null
        ) 200>"$lockfile"
      ) &
    fi
  fi

  return $exit_code
}

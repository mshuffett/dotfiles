# Homebrew setup - works on both macOS and Linux

# Linux (Linuxbrew)
if [[ -d /home/linuxbrew/.linuxbrew ]]; then
  eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
elif [[ -d ~/.linuxbrew ]]; then
  eval "$(~/.linuxbrew/bin/brew shellenv)"
fi

# macOS (Apple Silicon or Intel)
if [[ -d /opt/homebrew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -d /usr/local/Homebrew ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

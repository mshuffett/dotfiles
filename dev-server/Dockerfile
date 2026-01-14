FROM ubuntu:24.04

# Install system packages
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    git curl wget zsh tmux mosh \
    build-essential jq fd-find ripgrep bat neovim direnv fzf \
    openssh-server ca-certificates gnupg sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm and Claude Code
RUN npm install -g pnpm @anthropic-ai/claude-code

# Create user with sudo access
RUN useradd -m -s /bin/zsh -G sudo michael \
    && echo "michael ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set up directories (volumes will be mounted at /data)
RUN mkdir -p /data/ws /data/dotfiles \
    && ln -sf /data/ws /home/michael/ws \
    && ln -sf /data/dotfiles /home/michael/.dotfiles \
    && chown -R michael:michael /data /home/michael

USER michael
WORKDIR /home/michael

# Keep container running
CMD ["tail", "-f", "/dev/null"]

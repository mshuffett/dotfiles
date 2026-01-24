# Unified Development Container
# Works on EC2, GCP, or local Docker
#
# Build: docker build -t dev-server -f dev-server/Dockerfile .
# Run:   docker run -it --rm -v $(pwd):/workspace dev-server
# Daemon: docker run -d --name dev -v /data/ws:/workspace dev-server tail -f /dev/null

FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# =============================================================================
# 1. System packages + locale
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    file \
    git \
    gnupg \
    jq \
    locales \
    mosh \
    neovim \
    openssh-server \
    procps \
    sudo \
    tmux \
    unzip \
    wget \
    xclip \
    zsh \
    && rm -rf /var/lib/apt/lists/* \
    && locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
ENV LANGUAGE=en_US:en

# =============================================================================
# 2. Create michael user with sudo
# =============================================================================
RUN useradd -m -s /usr/bin/zsh -G sudo michael \
    && echo "michael ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/michael \
    && chmod 0440 /etc/sudoers.d/michael \
    && mkdir -p /workspace \
    && chown michael:michael /workspace

# Switch to non-root user for remaining setup
USER michael
WORKDIR /home/michael

# =============================================================================
# 3. Install Linuxbrew
# =============================================================================
RUN NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Set up Linuxbrew in PATH for subsequent RUN commands
ENV PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:${PATH}"
ENV HOMEBREW_NO_AUTO_UPDATE=1

# =============================================================================
# 4. Install CLI tools via brew
# =============================================================================
RUN brew install \
    atuin \
    bat \
    direnv \
    eza \
    fd \
    fnm \
    fzf \
    git-delta \
    gum \
    lazygit \
    ripgrep \
    xh \
    zoxide

# =============================================================================
# 5. Install Node.js 22 + pnpm + Claude Code
# =============================================================================
RUN eval "$(fnm env)" \
    && fnm install 22 \
    && fnm default 22 \
    && fnm exec --using=22 npm install -g pnpm @anthropic-ai/claude-code

# Set up fnm for shell (will also be in .zshrc)
ENV PATH="/home/michael/.local/share/fnm/aliases/default/bin:${PATH}"

# =============================================================================
# 6. Clone dotfiles and symlink configs
# =============================================================================
RUN git clone https://github.com/mshuffett/dotfiles.git /home/michael/.dotfiles \
    && ln -sf /home/michael/.dotfiles/zsh/zshenv.symlink /home/michael/.zshenv \
    && ln -sf /home/michael/.dotfiles/zsh/zshrc.symlink /home/michael/.zshrc \
    && ln -sf /home/michael/.dotfiles/zsh/p10k.zsh.symlink /home/michael/.p10k.zsh \
    && ln -sf /home/michael/.dotfiles/tmux/tmux.conf.symlink /home/michael/.tmux.conf \
    && ln -sf /home/michael/.dotfiles/git/gitconfig.symlink /home/michael/.gitconfig

# =============================================================================
# 7. Cache z4h for faster shell startup
# =============================================================================
RUN mkdir -p /home/michael/.cache/zsh4humans/v5 \
    && curl -fsSL "https://raw.githubusercontent.com/romkatv/zsh4humans/v5/z4h.zsh" \
       > /home/michael/.cache/zsh4humans/v5/z4h.zsh

# Create .claude directory for credentials
RUN mkdir -p /home/michael/.claude && chmod 700 /home/michael/.claude

# =============================================================================
# 8. Set up workspace directory
# =============================================================================
WORKDIR /workspace
VOLUME /workspace

# Terminal configuration
ENV TERM=xterm-256color

# Default to interactive zsh
CMD ["zsh", "-l"]

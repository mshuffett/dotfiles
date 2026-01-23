# Development container with full dotfiles environment
# Build: docker build -t dotfiles-dev .
# Run:   docker run -it --rm -v $(pwd):/workspace dotfiles-dev

FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and set up locale
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    file \
    git \
    locales \
    procps \
    sudo \
    unzip \
    wget \
    zsh \
    fontconfig \
    xclip \
    && rm -rf /var/lib/apt/lists/* \
    && locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
ENV LANGUAGE=en_US:en

# Create non-root user with zsh as default shell
ARG USERNAME=dev
ARG USER_UID=1001
ARG USER_GID=1001

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m -s /usr/bin/zsh $USERNAME \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    && mkdir -p /workspace \
    && chown $USERNAME:$USERNAME /workspace

# Switch to non-root user
USER $USERNAME
WORKDIR /home/$USERNAME

# Install Linuxbrew
RUN NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Set up Linuxbrew in PATH
ENV PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:${PATH}"
ENV HOMEBREW_NO_AUTO_UPDATE=1

# Install essential CLI tools via Linuxbrew
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

# Clone dotfiles and set up shell configuration
RUN git clone https://github.com/mshuffett/dotfiles.git /home/$USERNAME/.dotfiles \
    && ln -sf /home/$USERNAME/.dotfiles/zsh/zshenv.symlink /home/$USERNAME/.zshenv \
    && ln -sf /home/$USERNAME/.dotfiles/zsh/zshrc.symlink /home/$USERNAME/.zshrc \
    && ln -sf /home/$USERNAME/.dotfiles/zsh/p10k.zsh.symlink /home/$USERNAME/.p10k.zsh \
    && ln -sf /home/$USERNAME/.dotfiles/tmux/tmux.conf.symlink /home/$USERNAME/.tmux.conf \
    && ln -sf /home/$USERNAME/.dotfiles/git/gitconfig.symlink /home/$USERNAME/.gitconfig \
    && mkdir -p /home/$USERNAME/.cache/zsh4humans/v5 \
    && curl -fsSL "https://raw.githubusercontent.com/romkatv/zsh4humans/v5/z4h.zsh" \
       > /home/$USERNAME/.cache/zsh4humans/v5/z4h.zsh

WORKDIR /workspace

# Set terminal type for proper color support
ENV TERM=xterm-256color

# Default to zsh
CMD ["zsh", "-l"]

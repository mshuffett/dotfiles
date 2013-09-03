# Path to your oh-my-zsh configuration.
ZSH=$HOME/.oh-my-zsh

# Set name of the theme to load.
# Look in ~/.oh-my-zsh/themes/
# Optionally, if you set this to "random", it'll load a random theme each
# time that oh-my-zsh is loaded.
ZSH_THEME="agnoster"

# Uncomment following line if you want to disable command autocorrection
# DISABLE_CORRECTION="true"

# Uncomment following line if you want red dots to be displayed while waiting for completion
# COMPLETION_WAITING_DOTS="true"

# Uncomment following line if you want to disable marking untracked files under
# VCS as dirty. This makes repository status check for large repositories much,
# much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# export ZSH_TMUX_AUTOSTART=true
# plugins=(git autojump tmux)

source $ZSH/oh-my-zsh.sh

# Custom code

# Path manipulation
# force path array to have unique values
typeset -U path
path=(/home/mshuff/.local/bin /usr/local/bin "$path[@]")
#bindkey -e
export DEFAULT_USER=mshuff

# Ctrl-u: Deletes everything before cursor (u is on left)
#bindkey '^u' backward-kill-line
# Ctrl-o: Deletes everything after cursor (o is on right)
    # (Commonly Ctrl-k)
#bindkey '^o' kill-line
bindkey '^R' history-incremental-pattern-search-backward

setopt extended_glob
autoload -Uz compinit
compinit
zstyle ':completion:*' menu select
zstyle ':completion:*:descriptions' format '%U%B%d%b%u'
zstyle ':completion:*:warnings' format '%BSorry, no matches for: %d%b'

# setopt nohistverify
# Report statistics on commands that take longer than 10 seconds
REPORTTIME=10

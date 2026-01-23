# matches case insensitive for lowercase
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'

# pasting with tabs doesn't perform completion
zstyle ':completion:*' insert-tab pending

# ignore missing completion files
ZSH_DISABLE_COMPFIX="true"

# docker completion path
fpath=(~/.dotfiles/completions ~/.zsh/completion /usr/local/share/zsh/site-functions $fpath)

if ((! $+ALIASES_FILE))
then
    readonly ALIASES_FILE="/home/shuffem/.dotfiles/zsh/aliases.zsh"
fi

alias l=ls
alias ll="ls -lh"
alias dirs="dirs -v"
alias sz="source ~/.zshrc"
alias s="source ~/.zshrc"
alias sa="source $ALIASES_FILE"
alias ez="vim ~/.zshrc"
alias ea="vim $ALIASES_FILE"
alias shuffle="perl -MList::Util -e 'print List::Util::shuffle <>'"
alias reload!='. ~/.zshrc'
alias lh='ls -a | egrep "^\."' # ls dotfiles only

# Vim is slow
alias vim='vim -X'

alias tmux='tmux -2'
alias mmv='noglob zmv -W'

aa() {
    local alias_to_write
    if (($# == 1))
    then
        alias_to_write="$1"
    else
        alias_to_write="$1=$2"
    fi
    local line="alias '$alias_to_write'" 
    alias $alias_to_write
    echo $line >> $ALIASES_FILE
    echo "Wrote $line to $ALIASES_FILE"
}

alias 'k=kinit -f'
alias '..=cd ..'
alias '...=cd ...'
alias '....=cd ....'
alias '.....=cd .....'
alias 'bws=brazil ws'
alias 'bbr=brazil-recursive-cmd-parallel --allPackages brazil-build'
alias 'gdiff=git diff'

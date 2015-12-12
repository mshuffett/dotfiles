if ((! $+ALIASES_FILE))
then
    readonly ALIASES_FILE="/home/$USER/.dotfiles/zsh/aliases.zsh"
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

alias tmux='tmux -2'

function {
  local is_global=false
  # Add alias
  aa() {
    local alias_name
    local alias_command
    local new_alias
    local finished=false

    [[ $1 == "alias" ]] && shift
    if (($# == 1)); then
      # split argument based on first =
      IFS='=' read -r alias_name alias_command <<< $1
    else
      alias_name=$1
      alias_command="$@[2, -1]"
    fi

    local cmd=alias
    $is_global && $finished || cmd='alias -g'

    eval $cmd "$alias_name=$alias_command"
    local alias_line="$cmd $alias_name='$alias_command'"
    echo $alias_line >> $ALIASES_FILE
    echo "Added $alias_line to $ALIASES_FILE"
    finished=true
  }

  # Add global alias
  aag() {
    is_global=true
    aa $@
  }
}


# User defined aliases (with aa)
alias mmv='noglob zmv -W'
alias et="vim /home/michael/.tmux.conf"
alias st="source /home/michael/.tmux.conf"
alias acs="apt-cache search"
alias acs='apt-cache search'
alias ac='apt-cache'
alias agi='_ apt-get install'
alias ags='acs'

alias -g ws='/c/Users/Michael/Dropbox/ws'

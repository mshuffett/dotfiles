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

# Add alias
aa() {
  local alias_name
  local alias_command
  local new_alias

  [[ $1 == "alias" ]] && shift
  if (($# == 1)); then
    # split argument based on first =
    IFS='=' read -r alias_name alias_command <<< $1
  else
    alias_name=$1
    alias_command="$@[2, -1]"
  fi

  local cmd=alias

  eval "$cmd $alias_name='$alias_command'"
  local alias_line="$cmd $alias_name='$alias_command'"
  echo $alias_line >> $ALIASES_FILE
  echo "Added $alias_line to $ALIASES_FILE"
}

alias 'k=kinit -f'
alias '..=cd ..'
alias '...=cd ...'
alias '....=cd ....'
alias '.....=cd .....'
alias 'bws=brazil ws'
alias 'bbr=brazil-recursive-cmd-parallel --allPackages brazil-build'
alias 'gdiff=git diff'
alias g2s2='k g2s2'

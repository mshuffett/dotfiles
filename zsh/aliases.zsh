#!/usr/bin/zsh

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

aa() {
  local new_alias
  [[ $1 == "alias" ]] && shift
  if (($# == 1)); then
    new_alias=$1
  else
    new_alias="$1=\"$@[2, -1]\""
  fi
  local alias_line="alias $new_alias"
  echo $alias_line >> $ALIASES_FILE
  alias $new_alias
  echo "Added $alias_line to $ALIASES_FILE"
}

# User defined aliases (with aa)

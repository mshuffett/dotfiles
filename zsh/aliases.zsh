if ((! $+ALIASES_FILE))
then
    readonly ALIASES_FILE="/home/shuffem/.dotfiles/aliases.zsh"
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
  if (($# == 1)); then
    new_alias=$1
  elif
    (($# == 2)); then
    new_alias="$1=$2"
  else
    echo "Expected 1 or 2 args"
  fi
  echo "alias $new_alias" >> $ALIASES_FILE
  alias $new_alias
}
alias sag=sudo apt-get

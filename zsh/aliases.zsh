alias l=ls
alias ll="ls -lh"
alias dirs="dirs -v"
alias sz="source ~/.zshrc"
alias s="source ~/.zshrc"
alias sa="source ~/.dotfiles/zsh/aliases.zsh"
alias ez="vim ~/.zshrc"
alias ea="vim ~/.dotfiles/zsh/aliases.zsh"
alias shuffle="perl -MList::Util -e 'print List::Util::shuffle <>'"
alias reload!='. ~/.zshrc'
alias lh='ls -a | egrep "^\."' # ls dotfiles only

alias tmux='tmux -2'

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
  echo $alias_line >> ~/.dotfiles/zsh/aliases.zsh
  echo "Added $alias_line to ~/.dotfiles/zsh/aliases.zsh"
}


# User defined aliases (with aa)
alias mmv='noglob zmv -W'
alias et="vim ~/.tmux.conf"
alias st="source ~/.tmux.conf"
alias acs="apt-cache search"
alias acs='apt-cache search'
alias ac='apt-cache'
alias agi='_ apt-get install'
alias ags='acs'
alias ev='vim ~/.vimrc'

alias ev='vim ~/.vimrc'
alias desk='/usr/bin/ssh shuffem.desktop.amazon.com'
alias b='brazil'
alias venv='source ~/venvs/mds_venv/bin/activate'
alias rsync='rsync -azP'
alias term1='ssh n7cimaterm01.cloud.corp.dig.com'
# alias pytest='PYTHONPATH=~/ws/lib_python_wdprgms:. pytest'

# latest docker image
dli() {
  docker image ls | awk -F, 'BEGIN {FS = "[ \t\n]+"} 1 < NR && NR < 3 {print $3}'
}

# latest docker container
dlc() {
  docker ps | awk -F, 'BEGIN {FS = "[ \t\n]{2,}"} 1 < NR && NR < 3 {print $7}'
}
alias db='docker build .'
alias qn7='ssh qn7cimaterm01.cloud.corp.dig.com'
alias pipenv='PIPENV_VENV_IN_PROJECT=1 pipenv'

alias ls='/usr/local/bin/colorls -light -sort-dirs -report'
alias lc='/usr/local/bin/colorls -tree -light'

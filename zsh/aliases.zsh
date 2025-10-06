alias l=ls
alias dirs="dirs -v"
alias sz="exec zsh"
alias s="exec zsh"
alias sa="source ~/.dotfiles/zsh/aliases.zsh"
alias ez="$EDITOR ~/.zshrc"
alias ea="$EDITOR ~/.dotfiles/zsh/aliases.zsh"
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
alias et="$EDITOR ~/.tmux.conf"
alias st="source ~/.tmux.conf"
alias acs='apt-cache search'
alias ac='apt-cache'
alias agi='_ apt-get install'
alias ags='acs'
alias ev='$EDITOR ~/.vimrc'
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

alias ls='eza --icons --group-directories-first'
alias ll='eza -lh --icons --git --group-directories-first'
alias lc='eza --tree --icons'
alias sl='serverless'
alias k='kubectl'
alias dash='cd /Users/michael/ws/fleet-ops-dashboard'

# https://stackoverflow.com/a/10660730/2069974
rawurlencode() {
  local string="${1}"
  local strlen=${#string}
  local encoded=""
  local pos c o

  for (( pos=0 ; pos<strlen ; pos++ )); do
     c=${string:$pos:1}
     case "$c" in
        [-_.~a-zA-Z0-9] ) o="${c}" ;;
        * )               printf -v o '%%%02x' "'$c"
     esac
     encoded+="${o}"
  done
  echo "${encoded}"    # You can either set a return variable (FASTER)
  REPLY="${encoded}"   #+or echo the result (EASIER)... or both... :p
}

# Returns a string in which the sequences with percent (%) signs followed by
# two hex digits have been replaced with literal characters.
rawurldecode() {

  # This is perhaps a risky gambit, but since all escape characters must be
  # encoded, we can replace %NN with \xNN and pass the lot to printf -b, which
  # will decode hex for us

  printf -v REPLY '%b' "${1//%/\\x}" # You can either set a return variable (FASTER)

  echo "${REPLY}"  #+or echo the result (EASIER)... or both... :p
}

mfa() {
  local token="${1}"
  unset AWS_ACCESS_KEY_ID
  unset AWS_SECRET_ACCESS_KEY
  unset AWS_SESSION_TOKEN

  local creds=$(aws sts get-session-token --serial-number "arn:aws:iam::805463414252:mfa/Administrator" --token-code $token --output=json)
  # TODO this should likely write to the creds file instead
  export AWS_ACCESS_KEY_ID=$(echo $creds | jq -r ".Credentials.AccessKeyId")
  export AWS_SECRET_ACCESS_KEY=$(echo $creds | jq -r ".Credentials.SecretAccessKey")
  export AWS_SESSION_TOKEN=$(echo $creds | jq -r ".Credentials.SessionToken")
}

alias t='todoist --color'
alias cat='bat'
alias k='kubectl'
alias kc='kubectl'
alias which='which -a'
alias gpt='sgpt'
alias airport='/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport'


alias gke-compose-prod="gcloud config configurations activate kubestack && gcloud container clusters get-credentials compose-prod-us-east4 --region=us-east4"
alias gke-compose-stage="gcloud config configurations activate kubestack && gcloud container clusters get-credentials compose-stage-us-east1 --region=us-east1"
alias gke-compose-ops="gcloud config configurations activate kubestack && gcloud container clusters get-credentials compose-ops-us-east1 --region=us-east1"
alias p='pnpm'
alias kws="cd ~/ws/kode-ws && tsx ~/ws/anon-kode/src/entrypoints/cli.tsx --yolo"
alias kode="tsx ~/ws/anon-kode/src/entrypoints/cli.tsx --yolo"
alias ckw='cd /Users/michael/ws/kode-ws/'
alias gs='git status --short --branch | sed "s/^## /🌿 /" | sed "s/^M/📝 /" | sed "s/^A/✨ /" | sed "s/^D/🗑️ /" | sed "s/^R/♻️ /" | sed "s/^??/❓ /"'

# Define aliases.
alias tree='tree -a -I .git'

# Add flags to existing aliases.
alias ls="${aliases[ls]:-ls} -A"
alias claude="claude --dangerously-skip-permissions"
alias c="claude --dangerously-skip-permissions"
alias lg='lazygit'

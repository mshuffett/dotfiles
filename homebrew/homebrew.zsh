test -d ~/.linuxbrew && PATH="$HOME/.linuxbrew/bin:$HOME/.linuxbrew/sbin:$PATH"
test -d /home/linuxbrew/.linuxbrew && export PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:$PATH"
test -r ~/.bash_profile && export PATH="$(brew --prefix)/bin:$(brew --prefix)/sbin:$PATH"
export PATH="$(brew --prefix)/bin:$(brew --prefix)/sbin:$PATH"
test -d /opt/homebrew && eval "$(/opt/homebrew/bin/brew shellenv)"
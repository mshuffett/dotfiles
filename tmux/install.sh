# https://gist.github.com/P7h/91e14096374075f5316e
# tmux v2.0 installation steps for Ubuntu 14.04 (Trusty Tahr)
tmux -V
sudo apt-get update
sudo apt-get install -y python-software-properties software-properties-common
sudo add-apt-repository -y ppa:pi-rho/dev
sudo apt-get update
sudo apt-get install -y tmux
tmux -V

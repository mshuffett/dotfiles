#!/bin/sh
sudo apt-get install vim-gnome

# Install neobundle
curl https://raw.githubusercontent.com/Shougo/neobundle.vim/master/bin/install.sh > /tmp/neo-install.sh
sh /tmp/neo-install.sh

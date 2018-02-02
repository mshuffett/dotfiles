#!/bin/sh
# Install neobundle
curl https://raw.githubusercontent.com/Shougo/dein.vim/master/bin/installer.sh > /tmp/dein-install.sh
sh /tmp/dein-install.sh ~/dein

mkdir -p ~/.undodir

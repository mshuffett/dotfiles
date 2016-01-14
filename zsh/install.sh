#!/bin/sh

if [ $(uname -s) != Darwin ]; then # we're not on a mac
  sudo apt-get install zsh
fi

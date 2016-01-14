#!/usr/bin/env zsh

setopt extended_glob

if [[ $(uname -s) == "Darwin" ]]; then
	local font_dir=~/Library/Fonts
else
	local font_dir=~/.fonts
fi

mkdir -p $font_dir
cp fonts/^install.sh $font_dir
fc-cache -fv $font_dir

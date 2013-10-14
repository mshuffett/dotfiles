# oh-j-man

## install

Run this:

```sh
git clone https://github.com/mshuffett/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
sudo script/install # sudo for changing default shell
script/bootstrap
```

This will first install janus and oh-my-zsh and then it will
symlink the appropriate files in `.dotfiles` to your home directory.
Everything is configured and tweaked within `~/.dotfiles`.

The main file you'll want to change right off the bat is `zsh/zshrc.symlink`,
which sets up a few paths that'll be different on your particular machine.

`dot` is a simple script that installs some dependencies, sets sane OS X
defaults, and so on. Tweak this script, and occasionally run `dot` from
time to time to keep your environment fresh and up-to-date. You can find
this script in `bin/`.

## topical

Everything's built around topic areas. If you're adding a new area to your
forked dotfiles — say, "Java" — you can simply add a `java` directory and put
files in there. Anything with an extension of `.zsh` will get automatically
included into your shell. Anything with an extension of `.symlink` will get
symlinked without extension into `$HOME` when you run `script/bootstrap`.

## components

There's a few special files in the hierarchy.

- **bin/**: Anything in `bin/` will get added to your `$PATH` and be made
  available everywhere.
- **topic/\*.zsh**: Any files ending in `.zsh` get loaded into your
  environment.
- **topic/path.zsh**: Any file named `path.zsh` is loaded first and is
  expected to setup `$PATH` or similar.
- **topic/completion.zsh**: Any file named `completion.zsh` is loaded
  last and is expected to setup autocomplete.
- **topic/\*.symlink**: Any files ending in `*.symlink` get symlinked into
  your `$HOME`. This is so you can keep all of those versioned in your dotfiles
  but still keep those autoloaded files in your home directory. These get
  symlinked in when you run `script/bootstrap`.

## todo

- add instalation of necessary powerline fonts note: for some reason
  menlo doesn't seem to work but Meslo LG S DZ 13 works fine.
- add instalation of solarized
- setup ack
- setup that jump command
- make cross os support streamlined
- integrate with gitflow
- make git aliases in git take priority over oh-my-zsh git plugin
- think about unifying this using a better framework or somehow making
  everything more integrated
- fix keyboard shortcuts for things like move word in zle
- integrate updating janus and oh-my-zsh
- possibly switch to more of a submodules approach
- add more python support
- add grc support (coloring) also in grc.zsh
- make mac'y things more general

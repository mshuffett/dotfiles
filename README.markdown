## mshuffett does dotfiles
These are my personal dotfiles, originally forked from [holman's dotfiles](https://github.com/holman/dotfiles) with major modifications. I am using oh-my-zsh and antigen as part of these dotfiles.

## install

Run this:

```sh
curl -sL https://github.com/mshuffett/dotfiles/raw/master/script/install_from_scratch | sh
```

## for me
Feel free to fork these dotfiles, but I am primarily focusing on them for personal use for the time being, so YMMV.

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

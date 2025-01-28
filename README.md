## mshuffett does dotfiles

These are my personal dotfiles, originally forked from [holman's dotfiles](https://github.com/holman/dotfiles) with major modifications. I am using oh-my-zsh and antigen as part of these dotfiles.

**Note:** This repository should be kept private as it contains sensitive configuration and paths.

## install

Run this:

```sh
curl -sL https://github.com/mshuffett/dotfiles/raw/master/script/install_from_scratch | bash
```

## Secrets Management

This dotfiles repo uses 1Password CLI for secure secrets management. Here's how it works:

### Setup

1. Install 1Password CLI:

```sh
brew install --cask 1password-cli
```

2. First-time setup will prompt you to login to 1Password CLI when you open a new shell

3. Secrets are then cached locally in `~/.zsh_secrets_cache` (gitignored)

### Usage

- Secrets are automatically loaded in new shell sessions
- To refresh secrets from 1Password: run `refresh_secrets`
- Secrets are stored in 1Password under the "Private" vault

### Required 1Password Setup

Store your secrets in 1Password with these paths:

- `op://Private/GitHub/token`
- `op://Private/OpenAI/api_key`
- `op://Private/Anthropic/api_key`
- `op://Private/Mapbox/access_token`

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

## prompt

Checkout out [this link](for more info on the current prompt)

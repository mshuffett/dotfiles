# VSCode Extensions

VSCode extensions are managed separately from the main Brewfile to keep it clean.

## Install all extensions

```bash
cat ~/.dotfiles/vscode/extensions.txt | xargs -L 1 code --install-extension
```

## Update the extensions list

To update `extensions.txt` with currently installed extensions:

```bash
code --list-extensions > ~/.dotfiles/vscode/extensions.txt
```

## Why separate?

- Keeps Brewfile focused on system packages
- VSCode extensions change frequently
- Easier to review and manage separately
- Prevents brew-wrapper from auto-dumping 40+ vscode lines into Brewfile

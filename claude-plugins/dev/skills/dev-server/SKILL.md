---
name: Dev Server
description: This skill should be used when the user asks to "connect to dev server", "start dev server", "stop dev server", "check dev server status", "sync to server", "work on server", or mentions "fly.io dev", "remote development", "cloud dev environment", "dev-server app".
---

# Fly.io Dev Server

Remote development server on Fly.io for working when disconnected from internet or needing more compute power.

## Server Details

- **App**: dev-server (compose-ai org)
- **Machine ID**: e827400b0e42e8
- **Instance**: performance-8x (8 dedicated CPUs, 32GB RAM)
- **Region**: iad (Ashburn, VA)
- **Volume**: 100GB persistent at /data
- **Monthly cost**: ~$341 (from $15k credits)

## Quick Commands

### Connect to Server

```bash
dev              # SSH and attach to tmux session 'main'
dev -n           # SSH without tmux (new shell)
dev <cmd>        # Run a command on the server
dev stop         # Stop the server (save credits)
dev start        # Start the server
dev status       # Check server status
```

Or manually:
```bash
fly ssh console -a dev-server -u michael
```

### Check Status

```bash
# App status
fly status -a dev-server

# Machine status
fly machines list -a dev-server
```

### Start/Stop Server

```bash
dev stop         # Stop (saves credits when not in use)
dev start        # Start the server
```

## Server Setup

### Installed Software

- Ubuntu 24.04 LTS
- Node.js 22.x, pnpm 10.x
- Claude Code (`claude` command)
- zsh, tmux, mosh
- git, ripgrep, fd (`fdfind`), bat (`batcat`), neovim, fzf, direnv

### Directory Structure

```
/data/                  # Persistent volume (100GB)
├── ws/                 # Workspace (symlinked to ~/ws)
│   ├── compose-monorepo/
│   └── everything-monorepo/
└── dotfiles/           # Dotfiles (symlinked to ~/.dotfiles)

/home/michael/          # User home
├── ws -> /data/ws
└── .dotfiles -> /data/dotfiles
```

### User Account

- Username: michael
- Shell: zsh
- Sudo: passwordless

## Reproducible Setup (Dockerfile)

The dev server can be rebuilt from scratch using the Dockerfile at `~/.dotfiles/dev-server/`.

### Files

- `~/.dotfiles/dev-server/Dockerfile` - Container image definition
- `~/.dotfiles/dev-server/fly.toml` - Fly.io deployment config
- `~/.dotfiles/dev-server/setup.sh` - First-time setup script

### Updating the Server

**IMPORTANT**: When updating the dev server setup, clarify with the user:
1. **Update running server only** - Install packages, change configs on the live machine (doesn't persist across redeploys)
2. **Update Dockerfile** - Modify `~/.dotfiles/dev-server/Dockerfile` so changes persist in future deploys

For Dockerfile changes, after editing:
```bash
cd ~/.dotfiles/dev-server

# Update existing machine with new image (preserves volume + machine ID)
fly deploy --build-only  # Build and push image
fly machine update e827400b0e42e8 -a dev-server --image <new-image-tag> -y

# OR if fly deploy creates a new machine, clean up manually:
# 1. Destroy the new machine and its volume
# 2. Update the old machine: fly machine update e827400b0e42e8 ...
```

### First-Time Setup (Fresh Volume)

```bash
# Run setup script (only needed on fresh volume)
fly ssh console -a dev-server -u michael -C "bash ~/.dotfiles/dev-server/setup.sh"
```

### Fresh Deploy (New Server) - One-Step Setup

```bash
cd ~/.dotfiles/dev-server

# 1. Create app and volume
fly apps create dev-server -o compose-ai
fly volumes create dev_data --size 100 --region iad

# 2. Deploy the container
fly deploy

# 3. Generate SSH key and add to GitHub
fly ssh console -a dev-server -C 'su - michael -c "ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N \"\""'
fly ssh console -a dev-server -C 'cat /home/michael/.ssh/id_ed25519.pub'
# → Copy output and add to GitHub: gh ssh-key add - --title "dev-server"

# 4. Run setup script
fly ssh console -a dev-server -u michael -C "bash /data/dotfiles/dev-server/setup.sh"

# 5. Copy Claude Code OAuth credentials from local machine (note the leading dot!)
CREDS=$(security find-generic-password -s "Claude Code-credentials" -w)
fly ssh console -a dev-server -u michael -C "bash -c 'echo '\''$CREDS'\'' > ~/.claude/.credentials.json && chmod 600 ~/.claude/.credentials.json'"
```

This clones repos, sets up dotfiles symlinks, installs pnpm dependencies, and copies OAuth credentials.

## Persistence Model

Fly.io persistence works through **volumes** and **persistent machines**:

1. **Volume (`/data`)**: 100GB persistent storage survives container restarts and redeployments
   - Repos live here (`/data/ws/`)
   - Dotfiles live here (`/data/dotfiles/`)
   - Changes are preserved even when container image is updated

2. **Machine**: Unlike serverless, this is a persistent VM that stays running
   - Container entrypoint (`tail -f /dev/null`) keeps it alive
   - Machine persists until explicitly stopped or deleted

3. **Redeploy behavior**: `fly deploy` replaces the container but preserves:
   - All data in `/data` (repos, dotfiles, pnpm cache)
   - Machine identity and volume attachment

## Current Setup (Already Configured)

The server is fully set up with:
- Dotfiles cloned and symlinked
- compose-monorepo and everything-monorepo cloned
- pnpm dependencies installed
- SSH key added to GitHub
- Claude Code OAuth credentials at `~/.claude/.credentials.json`
- Environment secrets at `~/.env.zsh` (symlinked from /data/dotfiles/.env.zsh)

## Syncing Secrets

The `~/.env.zsh` file contains API tokens and secrets (TODOIST_API_TOKEN, etc.) that need to be synced to the dev server.

### Sync .env.zsh to Dev Server

```bash
# Copy the file
fly ssh sftp shell -a dev-server << 'EOF'
put ~/.env.zsh /data/dotfiles/.env.zsh
EOF

# Fix ownership (as root) and create symlink
fly ssh console -a dev-server -C "bash -c 'chown michael:michael /data/dotfiles/.env.zsh && chmod 600 /data/dotfiles/.env.zsh'"
fly ssh console -a dev-server -u michael -C "bash -c 'ln -sf /data/dotfiles/.env.zsh ~/.env.zsh'"
```

The `.zshrc` already sources `~/.env.zsh` if it exists, so tokens will be available in new shells.

## Working with tmux

Start a persistent session that survives disconnects:

```bash
fly ssh console -a dev-server -u michael
tmux new -s main

# Detach: Ctrl+b, d
# Reattach after reconnect:
tmux attach -t main
```

## Syncing Local Changes

To sync uncommitted local changes to the server:

```bash
# From local machine
rsync -avz --exclude node_modules --exclude .git \
  ~/ws/compose-monorepo/ \
  "$(fly ssh console -a dev-server -C 'echo $SSH_CONNECTION' 2>/dev/null | head -1):/data/ws/compose-monorepo/"
```

## Cost Management

- **Always-on**: ~$341/month
- **Stop when idle**: Stop machine when not using to save credits
- **Credits remaining**: ~$15k (~44 months of always-on)

To check current usage:
```bash
fly billing view -o compose-ai
```

## Troubleshooting

### Machine Won't Start

```bash
fly machines list -a dev-server
fly logs -a dev-server
```

### SSH Connection Issues

```bash
# Check machine is running
fly machines list -a dev-server

# If "publickey" auth fails, refresh SSH certificate
fly ssh issue --agent -o compose-ai -u michael,root

# Force restart if needed
fly machine restart e827400b0e42e8 -a dev-server
```

### Volume Not Mounted

The volume should auto-mount at /data. If not:
```bash
fly volumes list -a dev-server
# Recreate machine if volume is detached
```

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
# SSH into server
fly ssh console -a dev-server

# Connect as michael user
fly ssh console -a dev-server -u michael

# Run a command
fly ssh console -a dev-server -C "command here"
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
# Stop (saves credits when not in use)
fly machine stop e827400b0e42e8 -a dev-server

# Start
fly machine start e827400b0e42e8 -a dev-server
```

## Server Setup

### Installed Software

- Ubuntu 24.04 LTS
- Node.js 22.x, pnpm 10.x
- Claude Code (`claude` command)
- zsh, tmux, mosh
- git, ripgrep, fd, bat, neovim, fzf, direnv

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

## First-Time Setup

### 1. Add SSH Key to GitHub

The server has an SSH key that needs to be added to GitHub:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICDLBDBTSMfi2B3H8kp7Gdj+/01TGvbss7OMaGWUwT6v dev-server-fly
```

Add at: https://github.com/settings/ssh/new

### 2. Clone Repositories

```bash
fly ssh console -a dev-server -u michael

# Clone repos to persistent volume
cd ~/ws
git clone git@github.com:compose-ai/compose-monorepo.git
git clone git@github.com:michaelfromyeg/everything-monorepo.git

# Clone dotfiles
cd ~
git clone git@github.com:michaelfromyeg/dotfiles.git .dotfiles

# Install dependencies
cd ~/ws/compose-monorepo && pnpm install
cd ~/ws/everything-monorepo && pnpm install
```

### 3. Set Up Claude Code

```bash
# Set API key
export ANTHROPIC_API_KEY="your-key"

# Or add to ~/.zshrc
echo 'export ANTHROPIC_API_KEY="your-key"' >> ~/.zshrc
```

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

# Force restart if needed
fly machine restart e827400b0e42e8 -a dev-server
```

### Volume Not Mounted

The volume should auto-mount at /data. If not:
```bash
fly volumes list -a dev-server
# Recreate machine if volume is detached
```

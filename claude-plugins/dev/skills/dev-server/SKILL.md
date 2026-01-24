---
name: Dev Server
description: This skill should be used when the user asks to "connect to dev server", "start dev server", "stop dev server", "check dev server status", "sync to server", "work on server", or mentions "aws dev", "ec2 dev", "remote development", "cloud dev environment", "dev-server".
---

# AWS Dev Server

Remote development server on AWS EC2 for running Claude Code agents autonomously or when needing cloud compute.

## Server Details

- **Instance ID**: i-01718f43eb12bd418
- **Instance Type**: m7i.xlarge (4 vCPUs, 16GB RAM)
- **Region**: us-west-2 (Oregon)
- **Storage**: 100GB gp3 (16K IOPS, 1000 MB/s throughput)
- **IP**: 44.244.19.35 (changes on stop/start)
- **Monthly cost**: ~$240 (instance + high-perf storage)

### Why This Config?

See `benchmark-results.md` for full comparison. Key points:
- **Disk**: 1.5 GB/s write (vs 8 MB/s on Fly.io, 208 MB/s on GCP)
- **CPU**: 24% faster than GCP equivalent
- **Real-world**: Next.js builds in 4.4s (vs 5.5s GCP)

The high-IOPS gp3 storage config is critical - without it you get ~200 MB/s instead of 1.5 GB/s.

## Quick Commands

### Connect to Server

```bash
dev              # SSH and attach to tmux session 'main'
dev -n           # SSH without tmux (new shell)
dev run <cmd>    # Run a command on the server
dev stop         # Stop the instance (save money)
dev start        # Start the instance
dev status       # Check server status
dev sync-creds   # Sync Claude OAuth credentials
```

### Manual SSH

```bash
ssh dev
```

## Environment Variables

Set in `~/.env.zsh`:
```bash
export DEV_INSTANCE_ID="i-01718f43eb12bd418"
export DEV_VOLUME_ID="vol-09a50f33b812310a1"
export AWS_DEFAULT_REGION="us-west-2"
```

## Server Setup

### Installed Software

- Ubuntu 24.04 LTS
- Node.js 22.x, pnpm 10.x
- Claude Code 2.x
- zsh, tmux
- git, ripgrep, fd, bat, neovim, fzf, direnv

### Directory Structure

```
/home/michael/
├── ws/                 # Workspace for repos
└── .claude/            # Claude Code config
```

### SSH Config

In `~/.ssh/config`:
```
Host dev
    HostName 44.244.19.35
    User michael
    IdentityFile ~/.ssh/dev-server-aws.pem
```

**Note**: IP changes when instance stops/starts. Update with:
```bash
NEW_IP=$(aws ec2 describe-instances --instance-ids i-01718f43eb12bd418 --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
sed -i '' "s/HostName .*/HostName $NEW_IP/" ~/.ssh/config
```

## Cost Management

| State | Compute | Storage | Total |
|-------|---------|---------|-------|
| Running | ~$140/mo | ~$100/mo (16K IOPS) | **~$240/mo** |
| Stopped | $0 | ~$8/mo (baseline IOPS) | **~$8/mo** |

The `dev stop` command automatically scales down IOPS to baseline (saves ~$92/mo).
The `dev start` command scales IOPS back up for performance.

Always stop when not in use:
```bash
dev stop    # Scales down IOPS, stops instance
dev start   # Starts instance, scales up IOPS, updates SSH config
```

**Note**: Volume modifications take a few minutes to complete. If you stop and immediately start, the IOPS scale-up may queue behind the scale-down.

## Syncing Claude Credentials

The `dev` command auto-syncs credentials every 30 minutes. To force sync:
```bash
dev sync-creds
```

This copies `~/.claude/.credentials.json` from local machine to server.

## Working with tmux

The `dev` command auto-attaches to a tmux session named "main":

```bash
dev              # Connect and attach to 'main' session

# Inside tmux:
Ctrl+b d         # Detach (session keeps running)
Ctrl+b c         # New window
Ctrl+b n/p       # Next/prev window
```

## Troubleshooting

### Instance Won't Start

```bash
aws ec2 describe-instances --instance-ids i-01718f43eb12bd418 \
  --query 'Reservations[0].Instances[0].State.Name'
```

### SSH Connection Refused

Instance IP changes on stop/start. Update SSH config:
```bash
dev status  # Shows current IP if reachable
# Or manually:
aws ec2 describe-instances --instance-ids i-01718f43eb12bd418 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

### Credentials Not Working

```bash
dev sync-creds  # Force re-sync credentials
```

## Recreating the Instance

If you need to recreate from scratch:

```bash
# Create instance with high-perf storage
aws ec2 run-instances \
  --image-id ami-0cf2b4e024cdb6960 \
  --instance-type m7i.xlarge \
  --key-name dev-server-key \
  --security-group-ids sg-0f155dd58de85c2ae \
  --block-device-mappings '[{
    "DeviceName": "/dev/sda1",
    "Ebs": {
      "VolumeType": "gp3",
      "VolumeSize": 100,
      "Iops": 16000,
      "Throughput": 1000
    }
  }]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=dev-server}]' \
  --region us-west-2

# Then set up user and software (see setup script)
```

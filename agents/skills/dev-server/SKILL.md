---
name: dev-server
description: >
  Use when managing remote dev server EC2 instances — starting, stopping, connecting,
  creating new instances, or troubleshooting the `dev` CLI. Also use when the user mentions
  "dev server", "dev instance", "remote development", or asks to spin up a cloud dev environment.
---

# Dev Server Management

The `dev` CLI (`~/.dotfiles/bin/dev.ts`, Bun script) manages multi-profile remote EC2 dev servers.

## Commands

| Command | Description |
|---------|-------------|
| `dev` | SSH into default profile (with tmux) |
| `dev connect [profile]` | SSH with tmux, syncs Claude creds, runs setup script if needed |
| `dev start [profile]` | Start EC2 instance, scale up EBS IOPS, update SSH config |
| `dev stop [profile]` | Scale down EBS IOPS, stop EC2 instance |
| `dev status [profile]` | Check SSH reachability and EC2 state |
| `dev create <name>` | Create a new EC2 instance and profile |
| `dev list` | List all profiles with instance state |
| `dev run [profile] <cmd>` | Run a command on the server via SSH |
| `dev sync-creds [profile]` | Manually sync Claude OAuth credentials |
| `dev -n` / `dev connect -n` | SSH without tmux |

## Configuration

- **Profiles**: `~/.config/dev/profiles.json`
- **SSH config**: Managed blocks in `~/.ssh/config` (markers: `# dev-managed: <name>`)
- **SSH key**: `~/.ssh/dev-server-aws.pem` (key pair name: `dev-server-key`)
- **Cred sync cache**: `~/.cache/dev-creds-sync-<profile>` (30-min interval)

## Profile Schema

```json
{
  "default_profile": "default",
  "profiles": {
    "<name>": {
      "name": "<name>",
      "instance_id": "<i-xxx>",
      "volume_id": "<vol-xxx>",
      "region": "<aws-region>",
      "ssh_host": "<ssh-alias>",
      "ssh_user": "<user>",
      "instance_type": "<type>",
      "setup_script": "<script-url or null>",
      "setup_completed": true
    }
  }
}
```

## Previous Instances (decommissioned, old account 639237226972)

These were on the friend's AWS account in us-west-2. Preserved here for reference when recreating:

| Profile | Instance Type | SSH Host | SSH User | Setup Script | Notes |
|---------|--------------|----------|----------|-------------|-------|
| default | m7i.xlarge | dev | michael | none | General-purpose dev server, 100GB gp3 |
| flywheel | m7i.xlarge | dev-flywheel | ubuntu | [agentic_coding_flywheel](https://raw.githubusercontent.com/Dicklesworthstone/agentic_coding_flywheel_setup/main/install.sh) `--yes --mode vibe` | Agentic coding flywheel setup |

## Creating New Instances

**`dev create` has hardcoded values that need updating for the new AWS account (636160605813).**

In `~/.dotfiles/bin/dev.ts`, the `create` subcommand hardcodes:

| Value | Current (old account, us-west-2) | Needs update to (new account, us-east-1) |
|-------|----------------------------------|------------------------------------------|
| region | `us-west-2` | `us-east-1` |
| AMI | `ami-0cf2b4e024cdb6960` | Find Ubuntu 24.04 arm64 or x86 AMI for us-east-1 |
| Security group | `sg-0f155dd58de85c2ae` | Create or use existing SG on new account |
| Subnet | `subnet-0989be4d1cc95616c` | Use a public subnet in new account VPC |

Before using `dev create`, update these values in `dev.ts` or the command will fail (old account resources).

## EBS IOPS Scaling

The `dev` CLI scales EBS IOPS on start/stop to save costs:
- **Start**: 16,000 IOPS / 1,000 MB/s throughput
- **Stop**: 3,000 IOPS / 125 MB/s throughput (gp3 baseline, free)

## Credential Sync

`dev connect` automatically syncs Claude Code OAuth credentials from the local macOS Keychain (`Claude Code-credentials`) to `~/.claude/.credentials.json` on the remote instance. This runs at most every 30 minutes.

---
name: dev-server
description: >
  Use when managing remote dev server EC2 instances — starting, stopping, connecting,
  creating new instances, or troubleshooting the `dev` CLI. Also use when the user mentions
  "dev server", "dev instance", "remote development", or asks to spin up a cloud dev environment.
  Also use when the dev box is unreachable/impaired/browned-out, an EC2 instance OOM'd or hung,
  remote tmux/Claude sessions need recovering after a reboot, or the box needs hardening or
  rebuilding from code.
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
| `dev create <name>` | Create a new EC2 instance + profile (auto-hardens, attaches SSM role) |
| `dev list` | List all profiles with instance state |
| `dev run [profile] <cmd>` | Run a command on the server via SSH |
| `dev sync-creds [profile]` | Manually sync Claude OAuth credentials |
| `dev ssm [profile]` | Shell in via AWS SSM Session Manager — IP-independent, no SSH |
| `dev -n` / `dev connect -n` | SSH without tmux |

**Reach for `dev ssm` first when the box is "unreachable."** SSH depends on the security group allowlisting your current home IP; when that IP rotates you get connection timeouts even though the box is fine. `dev ssm` goes through SSM (needs the `dev-server-ssm-profile` IAM role, which `dev create` now attaches) and does not depend on the SG or IP — it's the reliable diagnostic path when `dev status` shows the instance running but SSH hangs. Use `dev ssm` (or the AWS console "Get system log") before concluding the box is dead.

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

`dev create <name>` is wired for the current account and works end-to-end: it launches in `us-west-2` with the account's SG/subnet, attaches the `dev-server-ssm-profile` IAM role (enables `dev ssm`), waits for SSH, then **auto-runs `bin/dev-harden.sh`** (swap + earlyoom + sysctls). Hardcoded values live in the `create` subcommand of `~/.dotfiles/bin/dev.ts` (AMI `ami-0cf2b4e024cdb6960`, SG `sg-0f48d7fb34f72a2ea`, subnet `subnet-02493c820e0e60ac1`) — edit there if the account/region changes. Default instance type is `m7i.xlarge`; pass `--instance-type` for something beefier (the working box is `r7i.8xlarge`).

## OOM Hardening & Recovery

**Incident (2026-06-27):** the dev box (16 GB, **no swap**) OOM-livelocked — a memory spike hard-hung the kernel, the box went `impaired`/browned-out, and SSH stopped responding while the instance stayed "running." It was *not* dead; it needed a reboot + hardening, not a rebuild.

**What's in place now (`bin/dev-harden.sh`, idempotent, auto-run by `dev create`):**
- **Swap** (16 GB `/swapfile`, persisted in fstab) — a memory spike now pages instead of livelocking.
- **earlyoom** — userspace OOM killer that acts at <6% free memory and `--prefer`s killing `node|claude|codex|bun` agents while `--avoid`ing `sshd|tmux|systemd|dockerd`. Without it the kernel livelocks instead of killing the hog.
- **sysctls** — `vm.swappiness=10`, `vm.vfs_cache_pressure=50`.

**Recovery playbook when the box is impaired:**
1. `dev status` — is the instance `running` but SSH dead? Then it's likely a brownout, not a death. Don't rebuild.
2. `dev ssm <profile>` (or AWS console system log) to get in IP-independently and inspect (`free -h`, `dmesg | grep -i oom`, `journalctl`).
3. Reboot the instance (`aws ec2 reboot-instances`) if hung.
4. **Recover Claude sessions, don't assume they're lost.** Session transcripts persist at `~/.claude/projects/<escaped-cwd>/<session-uuid>.jsonl` (on the box, the EBS volume survives reboots). Find the right one by grepping the `.jsonl` files for distinctive text the user remembers, then resume with `claude --resume <uuid>` in the matching cwd. (Pitfall this session: resuming the wrong session — confirm by matching remembered content, not just the session name.)
5. Long-running tmux sessions (e.g. `hermes`, `michael-remote`, `dev-default`, `paperclip`) should come back via the systemd user services / linger; if not, resume the Claude sessions manually as above.

## Reproducibility (rebuild from code)

The box is rebuildable from code. Provisioning scripts in `~/.dotfiles/bin/`:
- **`dev-harden.sh`** — swap/earlyoom/sysctls (above).
- **`dev-provision.sh`** — idempotent: install toolchain → clone repos → build venvs/deps → install systemd user units + linger → restore secrets → enable/start services.
- **`dev-push-secrets.sh`** — store/restore secret files via 1Password (`op`, **composeai** account) as documents `devbox/<name>`; nothing secret in git.

Full manifest (repos, systemd services, secret-file → op-document mapping) and verification status: `~/.dotfiles/plans/dev-box-full-reproducibility.md`.

## EBS IOPS Scaling

The `dev` CLI scales EBS IOPS on start/stop to save costs:
- **Start**: 16,000 IOPS / 1,000 MB/s throughput
- **Stop**: 3,000 IOPS / 125 MB/s throughput (gp3 baseline, free)

## Credential Sync

`dev connect` automatically syncs Claude Code OAuth credentials from the local macOS Keychain (`Claude Code-credentials`) to `~/.claude/.credentials.json` on the remote instance. This runs at most every 30 minutes.

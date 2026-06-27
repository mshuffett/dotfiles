---
name: project-devbox
description: "How to connect to and manage Michael's AWS devbox (dev-default) running a remote Claude Code session, incl. phone access via Tailscale."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 11a0c98c-405c-46fe-b821-6bba6246caf3
---

Remote devbox **dev-default**, created 2026-06-16 via the `dev` CLI (`~/.dotfiles/bin/dev.ts`, profiles in `~/.config/dev/profiles.json`). Hosts a persistent Claude Code session.

**Box facts**
- AWS acct `636160605813`, region `us-west-2`, instance `i-0af3ba1b73ce754b3`, type **m7i.xlarge** (4 vCPU / 16 GB), Ubuntu 24.04, 100 GB gp3 (`vol-039946af76783ea36`).
- Public IP `35.92.69.44` (**changes on stop/start** — the SG break-glass rule must be updated to your current laptop IP when it changes).
- Tailnet: **`dev-default` = `100.103.238.123`**, MagicDNS `dev-default.tail433b0e.ts.net`, owned by michael@, **Tailscale SSH enabled**.
- Security group `sg-0f48d7fb34f72a2ea`: break-glass SSH (port 22) from laptop IP only. SSH key `dev-server-key` = `~/.ssh/dev-server-aws.pem` (break-glass only; Tailscale SSH is keyless).

**Connect from laptop**
- `dev connect default` (or just `dev`) → attaches tmux session **`main`** = the live Claude Code session. `ssh dev-default` also works (break-glass).
- Manage: `dev start default` / `dev stop default` (stop halts compute billing + scales EBS IOPS down), `dev list`, `dev status`.

**Join the Claude Code session — Remote Control (easiest, no SSH)**
The tmux `main` session runs `claude --remote-control "dev-default"` (shows `/rc active`, Opus 4.8, Claude Max). Join from **claude.ai/code** (web) or the **Claude mobile app** → it appears as a running session named **dev-default**. Outbound-only; no SSH/Tailscale/port needed. To restart it after a reboot/stop: `dev connect default` then run `claude --remote-control "dev-default"` in tmux `main`.

**Join via SSH + tmux (alt)**
- Laptop: `dev connect default` (attaches tmux `main`), or `ssh dev-default`.
- Phone: **Tailscale app** (same tailnet) + SSH client (Termius/Blink) → `ssh ubuntu@dev-default` → `tmux attach -t main`. Tailnet ACL `ssh` is still **`check`** (browser re-auth ~12h); set to `accept` (`autogroup:self`) for seamless keyless SSH.

**Claude Code auth (important)** — the box uses a **full `claude auth login`** (interactive OAuth, run on the box; creds in `~/.claude/.credentials.json`). This is required for **Remote Control** — the long-lived `CLAUDE_CODE_OAUTH_TOKEN`/`setup-token` tokens are **inference-only** and the cloud refuses to attach RC to them. We removed the earlier env-token hack (`~/.config/claude-env`, the `~/.ssh/environment` token line). Gotcha: the interactive TUI only sees creds/env if the **tmux server was started from a session that had them** — if `claude` shows a login screen unexpectedly, `tmux kill-server` and recreate from a fresh ssh session. To re-login: `claude auth login` on the box → open the printed URL → paste the code back into the prompt. Keychain `syncCreds` is dead (entries expired); `dev.ts` skips expired tokens.

**Secrets/env** — all 45 `export` lines from the laptop's `~/.env.zsh` are copied to the box at `~/.env.sh` (600), sourced from `.bashrc`+`.profile` (includes AWS keys, OpenAI/Gemini/Notion/Todoist/Vercel/etc.). The running tmux session must be **restarted** to pick up any future key changes (env is captured at process start). The Remote Control session runs with `--dangerously-skip-permissions`.

**GitHub** — `gh` 2.95 installed; authed as `mshuffett` with the laptop's `gho_` token (`gh auth login --with-token`), `gh auth setup-git` configures the git https credential helper, git identity = Michael Shuffett <mshuffett@gmail.com>. (Note 2026-06-17: `mshuffett/dotfiles` shows visibility=PUBLIC despite CLAUDE.md saying it should be private — flagged to Michael.)

**Himalaya** (email) — v1.2.0 binary in `/usr/local/bin`; config at `~/.config/himalaya/config.toml` mirrors the laptop's two Gmail accounts (`everything-ai`=michael@geteverything.ai default, `compose`=michael@compose.ai) over IMAP/SMTP. App-passwords pulled from the mac Keychain (`himalaya-gmail`,`himalaya-compose`) → box files `~/.config/himalaya/pw-everything` / `pw-compose` (600); `auth.cmd = cat <pwfile>`. Verified folder+envelope list for both.

**Reproducible images** (built 2026-06-17, on the box under `~/devbox-build/`):
- `docker/Dockerfile` — Ubuntu 24.04 + CLI tools + node22 + claude-code + gh + himalaya + dotfiles. Secrets NOT baked; inject at runtime (`docker run --env-file ...`). Pushed to **private ECR** `636160605813.dkr.ecr.us-west-2.amazonaws.com/devbox:latest`.
- `nix/flake.nix` — `dockerTools.buildLayeredImage` (pinned nixpkgs nixos-24.11) with equivalent CLI toolset + devShell (`nix develop`).
- `setup-devbox.sh` (the canonical imperative setup), `bench.sh`/`nix_bench.sh` (Docker-vs-Nix benchmark → `RESULTS.md`), `push-ecr.sh`.
- Rebuild box from image: `docker pull <ECR>:latest && docker run -it --env-file <(sed "s/^export //" ~/.env.sh) <ECR>:latest`.

**Cost** ~$0.20/hr (~$145/mo) compute if always-on + ~$8/mo EBS → run `dev stop default` when idle. Todoist reminder set for 2026-06-24 to stop if unused.

**Pending hardening** (gated on the ACL `accept` edit): then set `profile.tailscale_host = dev-default.tail433b0e.ts.net` in profiles.json (dev.ts already supports the field → pins SSH config to MagicDNS, no public-IP rewrite) and remove the inbound rule from `sg-0f48d7fb34f72a2ea` (egress-only, no public exposure). Related: [[project-claude-code-src-reference]]. The old openclaw/puffin EC2 (us-east-1) is a separate box.

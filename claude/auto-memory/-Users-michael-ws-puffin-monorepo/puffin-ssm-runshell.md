---
name: puffin-ssm-runshell
description: "How to operate the prod puffin-openclaw EC2 box via SSM RunShellScript (gotchas, paths, openclaw CLI)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6219483b-ebc7-4702-92dd-97d2f601a02f
---

Operating the production `puffin-openclaw` EC2 (`i-02cef0acfa720d57b`, us-east-1) — access is **SSM only** (no SSH key, SG opens only 80/443). The `skills/puffin-debugging.md` in-repo guide is Railway-era and outdated; use SSM.

**Pick the fastest mode FIRST — don't default to `send-command` per step.** On 2026-05-21 I did a long interactive debug session as ~25 separate `aws ssm send-command` + poll round-trips (~6–10s each). That's the slow batch primitive. For iterative work prefer:
- **Interactive Session Manager shell**: `aws ssm start-session --target i-02cef0acfa720d57b` (`session-manager-plugin` is installed at `/opt/homebrew/bin`). Run it **inside a tmux pane** and drive with send-keys/capture-pane → no per-command polling, persistent state, `docker exec -it`, vim. This is the default for iterative ops + anything interactive (e.g. WhatsApp QR re-link).
- **SSH-over-SSM** (`AWS-StartSSHSession` ProxyCommand + EC2 Instance Connect temp key) → real `ssh`/`scp`/`rsync`, makes file edits + secret transfer trivial (no base64/ParamStore dance).
- **Port-forward** (`AWS-StartPortForwardingSession`) to hit the gateway/setup HTTP locally.
Reserve `send-command` for genuinely one-shot scripted actions; if you must use it, send one fat `base64 | bash` script, not many small probes.

**SSM RunShellScript gotchas (learned the hard way):**
- The document runs under `/bin/sh` (dash). **Any literal `(` breaks it** — even inside `echo "=== (note) ==="` strings or jq `map(...)`/`select(...)`. Error: `Syntax error: "(" unexpected`.
- For anything non-trivial, write the script locally, `base64` it, and run `echo '<B64>' | base64 -d | bash` as the single SSM command. Bash (not dash) then runs it and parens are fine. Build params safely: `jq -n --arg cmd "..." '{commands:[$cmd]}' > params.json` then `--parameters file://params.json`.
- Poll completion with: `until [ "$(aws ssm get-command-invocation ... --query Status --output text)" != "InProgress" ]; do sleep 3; done` (foreground `sleep` chaining is blocked in the harness).
- To deliver a secret to the box without logging it: put in SSM Parameter Store SecureString from laptop (`--value file://`), fetch on-box with the instance role into a file (no stdout). SSM command text + stdout are retained ~30 days and visible to SSM readers.

**Paths / tools on the box:**
- Active state dir is **`/data/.moltbot`** (contains `openclaw.json`, `agents/<id>/agent/{models.json,auth-profiles.json}`). Env vars `OPENCLAW_STATE_DIR`/`MOLTBOT_STATE_DIR` are confusingly swapped — trust the files, not the env names.
- Compose: `/opt/puffin/docker-compose.yml`, env file `/opt/puffin/puffin.env` (root:600). Container `puffin-openclaw-1`. Recreate after env change: `docker compose -f /opt/puffin/docker-compose.yml up -d --force-recreate`.
- Container has `node`/`curl`/`wget` but **no `aws` cli**; the **host** has aws cli (v1) + the instance role.
- OpenClaw CLI inside container: `/usr/local/bin/openclaw`. Useful: `openclaw models status [--probe --probe-provider <p>]`, `openclaw models list`, and end-to-end agent test: `openclaw agent --agent <id> --message "..."` (note: `--agent`/`--message` flags, not positional).

Related: [[puffin-bedrock-model]]

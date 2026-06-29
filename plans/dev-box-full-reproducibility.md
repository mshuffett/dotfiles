---
status: complete
created: 2026-06-27
completed: 2026-06-28
owner: michael
---

> ✅ COMPLETE — verified on a fresh box: toolchain, hardening, secret delivery (incl. openclaw identity), hermes (uv/py3.11) importable, todoist ready, all units enabled. Scripts: bin/dev-harden.sh, bin/dev-provision.sh, bin/dev-push-secrets.sh; `dev create` auto-hardens + attaches SSM role.

# Full reproducibility for the dev box (dev-default)

**Goal:** rebuild the entire working dev box from code — `dev create` → hardened + toolchain + repos + systemd services running (secrets restored from 1Password). Verify by recreating a throwaway box.

**Context:** the box OOM-livelocked 2026-06-27 (16 GB, no swap). Already done: migrated to r7i.8xlarge, hardened (swap/earlyoom/SSM/auto-reboot — `bin/dev-harden.sh`), `dev create` auto-hardens. This plan adds the toolchain + services + secrets layer. The `~/devbox-build/nix` flake is an abandoned stub — set aside; use a provisioning script.

**Secrets decision:** 1Password CLI (`op`, composeai account). Secrets stored as `op` documents, restored on provision. Nothing secret in git.

## Stages
1. **Inventory** ✅ — toolchain, repos→remotes, secret-file locations captured.
2. **Toolchain install methods** — exact commands (apt/nodesource/installers) for node, pnpm, claude, gh, docker, bun, rust, uv.
3. **Secrets → 1Password** (needs `op signin`) — store each secret file as an `op` document `devbox/<name>`.
4. **`bin/dev-provision.sh`** — idempotent: install toolchain → clone repos → build venv/bun deps → install systemd user units + linger → restore secrets via `op` → enable+start services.
5. **Wire into `dev.ts`** — run provision after harden in `dev create`.
6. **Verify** — recreate a throwaway box end-to-end, confirm services run, terminate.

## Verification result (2026-06-28)
Recreated a fresh t3.large end-to-end (harden → push-secrets → provision), auto-terminated. **PASS (foundation):** toolchain (node22, docker, gh, pnpm, claude, bun), hardening (swap+earlyoom+swappiness), secret delivery from op (files landed at correct paths), all 4 systemd units installed, public repos cloned. **Remaining (service layer):** add `gh auth setup-git` to dev-provision (private clones platform/polylog); add `~/.openclaw` + other service repos to the clone manifest; verify per-service builds (hermes venv, openclaw bun) and full secret set so all 4 services reach `active`. Also: push dotfiles to origin so `dev create`'s clone is self-sufficient (blocked on user's uncommitted claude/memory/* + remote ahead 21).

## Repo manifest
| path | remote |
|---|---|
| ~/.dotfiles | github.com/mshuffett/dotfiles |
| ~/platform | github.com/mshuffett/platform |
| ~/polylog | github.com/mshuffett/polylog |
| ~/tana-clone | github.com/mshuffett/tana-clone |
| ~/pomodoro-app | github.com/mshuffett/pomodoro-vibe |
| ~/compose-monorepo-review | github.com/compose-ai/compose-monorepo |
| ~/.hermes/hermes-agent | github.com/NousResearch/hermes-agent |
| ~/.openclaw | (check remote) |

## Services (systemd --user, linger)
- hermes-gateway, hermes-gateway-rin-grok — python venv at ~/.hermes/hermes-agent/venv
- openclaw-gateway — bun, EnvironmentFile ~/.config/agents/openclaw.env
- todoist-claude — bash poller at ~/platform/services/todoist-claude/poller.sh

## Secret files → op documents
~/.config/agents/openclaw.env, gbrain.env · ~/.claude/.credentials.json · ~/.hermes/.env · ~/.hermes/config.yaml · ~/.hermes/profiles/rin-grok/{.env,config.yaml} · ~/platform/services/todoist-claude/.env

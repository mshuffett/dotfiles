---
name: local-hermes-openclaw-instances
description: Locations and isolation of local hermes/openclaw instances + gotchas that can take down the production hermes Telegram bot
metadata: 
  node_type: memory
  type: project
  originSessionId: 3bfa6e30-c7dc-4d73-86f8-00106120db55
---

Two agent stacks run locally on this Mac (set up 2026-05-21).

**Hermes (NousResearch/hermes-agent):**
- PRODUCTION: launchd service `ai.hermes.gateway` (`~/Library/LaunchAgents/ai.hermes.gateway.plist`), runs `gateway run --replace`, `HERMES_HOME=~/.hermes`. Runs Telegram bot **@Ender99bot** ("Ender", id 8627995049), token from `~/.hermes/.env` (loaded with `override=True` so it beats the shell env). `KeepAlive` only revives on a NON-zero exit — when Telegram is unreachable the gateway exits 0 and stays DOWN. Manual restart: `launchctl kickstart -k gui/$(id -u)/ai.hermes.gateway`.
- NOTE: the shell env exports a DIFFERENT `TELEGRAM_BOT_TOKEN` = bot **@geteverything_bot** ("Eve", id 8230544893). Prod hermes does NOT use this; it uses Ender from `.env`.
- CLEAN/dev: `~/ws/hermes` (latest `main`, venv py3.11, isolated `HERMES_HOME=~/ws/hermes/home`). On-demand CLI only: `HERMES_HOME=~/ws/hermes/home ~/ws/hermes/venv/bin/hermes chat` (needs a model key in `~/ws/hermes/home/.env`).

**OpenClaw (clawdbot, npm `openclaw`):**
- PRODUCTION config: `~/.openclaw` (telegram + imessage enabled). Default agent workspace `~/.openclaw/workspace`.
- CLEAN/dev: `~/ws/openclaw` (upstream `clawdbot/clawdbot` `main`). Isolation needs BOTH `OPENCLAW_STATE_DIR=~/ws/openclaw/state` AND config `agents.defaults.workspace=~/ws/openclaw/workspace` — the agent workspace is built from `os.homedir()/.openclaw/workspace-<id>` (`src/agents/agent-scope.ts`) and is NOT covered by `OPENCLAW_STATE_DIR`. On-demand TUI: `cd ~/ws/openclaw && OPENCLAW_STATE_DIR=~/ws/openclaw/state node scripts/run-node.mjs tui`.

GOTCHAS (observed 2026-05-21):
- hermes `gateway run` auto-connects to any `TELEGRAM_BOT_TOKEN` in the shell env. A clean instance with no `.env` therefore grabbed the ambient shell-env bot **@geteverything_bot (Eve)** — NOT prod hermes (which uses @Ender99bot from `.env`). It overwrote Eve's command menu. So a 2nd gateway hijacks whatever bot the ambient token points at; isolate by stripping it: `env -u TELEGRAM_BOT_TOKEN -u TELEGRAM_CHAT_ID ...`.
- prod hermes went DOWN at 00:47 the same day, but the recorded cause was a genuine Telegram **network ConnectError** (api.telegram.org unreachable, intermittent for days) + launchd not reviving a clean (exit 0) shutdown — NOT the clean-instance bot grab (different bot). Fixed by `launchctl kickstart`.
- hermes `--replace` uses psutil process discovery and can kill hermes gateways across different `HERMES_HOME`s (clean 32221 died the same instant as prod). Use clean hermes for CLI/TUI, not a competing daemon.
- A separate hermes/openclaw instance on Telegram needs its OWN @BotFather bot; one bot token = one poller, tokens can't be shared. See [[isolate-channels-when-spawning-bot-agents]].

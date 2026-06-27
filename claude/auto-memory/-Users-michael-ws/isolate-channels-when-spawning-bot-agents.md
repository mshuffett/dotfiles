---
name: isolate-channels-when-spawning-bot-agents
description: "When spawning agents/processes that run channel-connected bots or gateways, strip shared channel tokens from the env, not just the home/state dir"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3bfa6e30-c7dc-4d73-86f8-00106120db55
---

When spawning agents or background processes that start a channel-connected bot/gateway (hermes, openclaw, etc.), isolate BOTH the home/state dir AND the shared channel tokens in the env. Stripping only the home dir is not enough.

**Why:** On 2026-05-21, a clean hermes gateway was launched with an isolated `HERMES_HOME` but the shell still exported `TELEGRAM_BOT_TOKEN`. The clean gateway silently connected to the bot that ambient token points at (@geteverything_bot / "Eve") and overwrote its command menu. (It was NOT prod hermes's bot — prod uses @Ender99bot from `~/.hermes/.env` — but it was still a live bot it shouldn't have touched.) The home-dir isolation gave false confidence: a different live bot got hijacked via the ambient env token.

**How to apply:** Pass `env -u TELEGRAM_BOT_TOKEN -u TELEGRAM_CHAT_ID ...` (and any other channel tokens) or use the project's skip-channels flag (openclaw: `OPENCLAW_SKIP_CHANNELS=1`). Then VERIFY before declaring success: the run log must show 0 platforms / "skipping channel start" / no "Connected to Telegram". Brief subagents that run bots with this requirement explicitly. See [[local-hermes-openclaw-instances]].

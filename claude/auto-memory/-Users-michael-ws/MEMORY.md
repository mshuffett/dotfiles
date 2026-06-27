# Memory

## Claude Code Agent Teams
Agent teams are experimental and disabled by default. Enable them by adding CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS to your settings.json or environment. Agent teams have known limitations around session resumption, task coordination, and shutdown behavior.

## Claude Code Routines
- [Claude Code Routines](claude-code-routines.md) — Remote (cloud) vs Local (desktop scheduled task); which tools/skills map to each; triggers, limits, docs URL

## Local agents (hermes / openclaw)
- [Local hermes/openclaw instances](local-hermes-openclaw-instances.md) — prod vs clean locations, isolation env vars, and the gotchas that took prod hermes down
- [Isolate channels when spawning bot agents](isolate-channels-when-spawning-bot-agents.md) — strip TELEGRAM_BOT_TOKEN etc. from spawned bot/gateway agents, not just the home dir

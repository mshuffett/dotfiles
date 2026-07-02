---
name: subagent-imagegen-env
description: "Subagents in this project don't inherit OPENAI_API_KEY — imagegen calls fail silently (especially when piped through tail/grep); instruct agents to source ~/.env.zsh first."
metadata: 
  node_type: memory
  type: project
  originSessionId: b4262ff6-fe11-47c7-92fb-31af933828f3
---

During the deck round-2 fleet (2026-07-01), the flywheel agent's `image_gen.py` calls failed silently because `OPENAI_API_KEY` was missing from its Bash environment, and the error was masked by `| tail -3`. It recovered by running `source ~/.env.zsh` before re-running.

**How to apply:** when prompting any subagent that will call the imagegen skill (or other API-keyed CLIs), include: "run `source ~/.env.zsh` before API calls, and check the command's full output — don't pipe through tail/grep on the first run." Alternatively verify key presence with `${#OPENAI_API_KEY}` before generating.

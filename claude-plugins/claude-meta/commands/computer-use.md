---
description: Use the computer use agent only when explicitly asked. Includes usage examples and conflict override policy.
---

# Computer Use Agent

Only use the computer use agent when explicitly asked. Do not proactively suggest using it.

Conflict handling:
- If a user request appears to conflict with a rule, clearly state the conflict and ask whether to perform a temporary override or update the rule; proceed only after explicit confirmation.

## When to Use (Triggers)
- The user explicitly asks you to control the computer or to perform an action that requires the agent

## Acceptance Checks
- [ ] Explicit request confirmed
- [ ] Any conflicts surfaced and resolved (temporary override or rule update)
- [ ] Scope and steps confirmed before execution (dry-run or live)

Usage:
```bash
# Dry-run (shows what will happen)
cd ~/ws/claude-computer-use-mac && python agent.py "task description"

# Live mode (actually controls computer)
cd ~/ws/claude-computer-use-mac && python agent.py "task description" --live
```

Example acceptable usage:
- User: "Can you open Activity Monitor for me?" → Run the agent with that task.

Example unacceptable usage:
- User: "I need to check my memory usage" → Do not run the agent automatically; provide manual steps unless explicitly asked to control the computer.

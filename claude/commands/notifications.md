---
description: How and when to send notifications using the push command; only on explicit request.
---

# Notifications

Only use notifications when explicitly asked by the user. Do not proactively send notifications.

When asked to notify on completion:
```bash
# Normal priority
push "Task completed: [description]"

# High priority (bypasses quiet hours)
push "Task completed: [description]" 1

# Emergency (makes sound even on silent)
push "Task completed: [description]" 2
```

The `push` command is available at `~/bin/push` (symlinked from `~/.dotfiles/bin/push`).


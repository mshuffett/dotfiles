---
name: notifications
description: Use when user asks about macOS notifications, requests a notification on task completion, or mentions the push command. Covers Notifier app, Pushover, and AppleScript.
---

# Notifications

Only send notifications when explicitly asked. Do not proactively notify.

## Methods

### 1. Notifier (Local Mac - Preferred)

[Jamf Notifier](https://github.com/jamf/Notifier) at `/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier`.

```bash
# Banner (temporary)
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type banner --message "Message" --title "Title"

# Alert (persistent, requires dismissal) - use for task completion
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type alert --message "Message" --title "Title" --sound default

# With button and action
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type alert --message "Message" --messagebutton "Open" --messagebuttonaction "https://example.com"

# Clear notifications
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier --remove all
```

### 2. Pushover (Cross-Device)

```bash
push "Task completed: [description]"      # Normal
push "Task completed: [description]" 1    # High (bypasses quiet hours)
push "Task completed: [description]" 2    # Emergency (sounds on silent)
```

The `push` command is at `~/.dotfiles/bin/push`.

### 3. AppleScript (Simple Local)

```bash
osascript -e 'display notification "Message" with title "Title" sound name "default"'
```

## When to Use Which

| Method | Use Case |
|--------|----------|
| Notifier (alert) | Task completion — persists until dismissed |
| Notifier (banner) | Quick transient notification |
| push (Pushover) | Need notification on phone/all devices |
| osascript | Quick one-off, no extra features needed |

## Acceptance Checks

- [ ] User explicitly asked for a notification
- [ ] Appropriate method chosen (local vs cross-device)

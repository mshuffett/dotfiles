---
description: Use when the user asks about macOS notifications, how to send notifications, or requests a notification on completion. Covers Notifier app and push command.
---

# Notifications

Only use notifications when explicitly asked by the user. Do not proactively send notifications.

## When to Use (Triggers)
- The user asks how to show/send notifications on Mac
- The user explicitly requests a notification on completion
- The user asks about the push command, Notifier, or notification system

## Acceptance Checks
- [ ] User explicitly asked for a notification
- [ ] Appropriate method chosen (local vs cross-device)
- [ ] Message includes clear description

## Methods

### 1. Notifier (Local Mac - Preferred)

[Jamf Notifier](https://github.com/jamf/Notifier) - Native macOS notifications with buttons and actions.

**Location**: `/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier`

```bash
# Basic banner (temporary)
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type banner --message "Message" --title "Title"

# Alert (persistent, requires dismissal)
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type alert --message "Message" --title "Title"

# With sound
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type banner --message "Message" --title "Title" --sound default

# With button and action
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type alert --message "Message" --messagebutton "Open" --messagebuttonaction "https://example.com"

# Remove prior notifications
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier --remove all
```

**Arguments:**
- `--type` (required): `banner` (temporary) or `alert` (persistent)
- `--message`: Main notification text
- `--title`: Header text
- `--subtitle`: Secondary text
- `--sound`: Sound name or "default"
- `--messagebutton`: Button label
- `--messagebuttonaction`: Action URL or command for button
- `--messageaction`: Action when clicking notification body
- `--remove prior|all`: Clear notifications
- `--verbose`: Enable logging

### 2. Pushover (Cross-Device)

Sends notifications to all devices via Pushover API.

```bash
# Normal priority
push "Task completed: [description]"

# High priority (bypasses quiet hours)
push "Task completed: [description]" 1

# Emergency (makes sound even on silent)
push "Task completed: [description]" 2
```

The `push` command is at `~/bin/push` (symlinked from `~/.dotfiles/bin/push`).

### 3. AppleScript (Simple Local)

Built-in, no dependencies:

```bash
osascript -e 'display notification "Message" with title "Title" sound name "default"'
```

## When to Use Which

| Method | Use Case |
|--------|----------|
| Notifier (alert) | Claude Code workflows, task completion - persists until dismissed |
| Notifier (banner) | Quick local notification, temporary |
| push (Pushover) | Need notification on phone/all devices |
| osascript | Quick one-off, no extra features needed |

## Default for Claude Code

For task completion notifications (e.g., long-running builds, tests), **use alert type** so it persists until the user dismisses it:

```bash
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier \
  --type alert --message "Task completed: [description]" --title "Claude Code" --sound default
```

Use `banner` only for transient/informational notifications that don't need user acknowledgment.

---
name: macOS Notifications
description: Use when sending macOS native notifications or alerts from CLI. Uses jamf/Notifier which works from background contexts (cron, launchd). Supports one action button per notification.
---

# macOS Native Notifications (Notifier)

## Quick Reference

```bash
# Binary
NOTIFIER="/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier"

# Banner (auto-dismisses)
"$NOTIFIER" --type banner --title "Title" --message "Message"

# Alert (stays until dismissed)
"$NOTIFIER" --type alert --title "Title" --message "Message"

# Alert with action button
"$NOTIFIER" --type alert --title "Task Complete" --message "Build succeeded" \
  --messagebutton "Open" --messagebuttonaction "/usr/bin/open -a Terminal" --sound default
```

## Options

| Flag | Description |
|------|-------------|
| `--type <alert\|banner>` | Required. Alert persists, banner auto-dismisses |
| `--title <text>` | Notification title |
| `--subtitle <text>` | Notification subtitle |
| `--message <text>` | Notification body |
| `--messagebutton <label>` | Custom button label (only ONE supported) |
| `--messagebuttonaction <cmd>` | Action when button clicked (full path required) |
| `--messageaction <cmd>` | Action when message body clicked |
| `--sound <name>` | "default" or name from /System/Library/Sounds |
| `--remove prior` | Remove prior notification (requires same message) |
| `--remove all` | Remove all notifications |

## Action Commands

Actions require full binary paths:

```bash
--messagebuttonaction "/usr/bin/open -a Terminal"
--messagebuttonaction "/Users/michael/.dotfiles/bin/some-script"
--messagebuttonaction "/bin/bash -c 'tmux attach -t session || tmux new -s session'"
```

## Permissions

System Settings → Notifications → "Notifier - Alerts" → Enable, set style to "Alerts" for persistence.

## Limitations

- Only ONE custom action button per notification
- Close/dismiss button has no custom action
- For multiple buttons, need custom Swift app (alerter is abandoned)

## Alternatives Comparison

| Tool | Buttons | Background | Status |
|------|---------|------------|--------|
| jamf/Notifier | 1 custom | Yes | Maintained |
| osascript dialog | Multiple | No | Native |
| osascript notification | None | Yes | Native |
| terminal-notifier | None | Yes | Minimal |

## Acceptance Checks

- [ ] Notification appears with correct title/message
- [ ] Alert type persists until dismissed (not auto-dismissing)
- [ ] Action button executes command when clicked
- [ ] Works from background context (launchd/cron)

## Resources

- GitHub: https://github.com/jamf/Notifier
- Install: Download pkg from releases

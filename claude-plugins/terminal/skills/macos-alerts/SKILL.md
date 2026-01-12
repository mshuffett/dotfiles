---
name: macOS Alerts
description: Use when sending macOS native notifications or alerts from the command line, triggering user prompts, or building scripts that need to notify/prompt the user locally.
---

# macOS Native Alerts (Notifier)

Use **jamf/Notifier** for macOS native notifications with action buttons. Works from background contexts (cron, launchd).

## Binary Location

```bash
/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier
```

## Basic Usage

```bash
# Banner (auto-dismisses)
"/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier" \
  --type banner \
  --title "Title" \
  --message "Message"

# Alert (stays until dismissed)
"/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier" \
  --type alert \
  --title "Title" \
  --message "Message"
```

## With Action Button

```bash
"/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier" \
  --type alert \
  --title "Claude Daily" \
  --message "Time for morning routine?" \
  --messagebutton "Open Session" \
  --messagebuttonaction "/usr/bin/open -a Terminal" \
  --sound default
```

## All Options

| Flag | Description |
|------|-------------|
| `--type <alert\|banner>` | Required. Alert stays until dismissed, banner auto-dismisses |
| `--title <text>` | Notification title |
| `--subtitle <text>` | Notification subtitle |
| `--message <text>` | Notification body |
| `--messagebutton <label>` | Custom button label (only ONE supported) |
| `--messagebuttonaction <cmd>` | Action when button clicked (full path required) |
| `--messageaction <cmd>` | Action when message body clicked |
| `--sound <name>` | Sound name: "default" or name from /System/Library/Sounds |
| `--remove prior` | Remove prior notification (requires same message) |
| `--remove all` | Remove all notifications |
| `--verbose` | Enable logging to Console.app |

## Action Command Requirements

Actions must use full binary paths:
- `/usr/bin/open` (not `open`)
- `/bin/bash -c "..."` for complex commands

```bash
# Open an app
--messagebuttonaction "/usr/bin/open -a Terminal"

# Run a script
--messagebuttonaction "/Users/michael/.dotfiles/bin/claude-daily"

# Complex command
--messagebuttonaction "/bin/bash -c 'tmux attach -t claude-daily || tmux new -s claude-daily'"
```

## Permissions

Notifier needs notification permissions:
1. System Settings → Notifications
2. Find "Notifier - Alerts"
3. Enable notifications
4. Set alert style to "Alerts" (not Banners) for persistent notifications

## Limitations

- Only ONE custom action button per notification
- For multiple buttons, would need alerter (abandoned) or custom Swift app
- Close/dismiss is implicit (no custom action)

## Comparison with Alternatives

| Tool | Buttons | Background | Maintained |
|------|---------|------------|------------|
| jamf/Notifier | 1 custom | Yes | Yes (2024) |
| osascript dialog | Multiple | No | Native |
| osascript notification | None | Yes | Native |
| alerter | Multiple | Yes | No (2023) |
| terminal-notifier | None | Yes | Minimal |

## Example: Cron/Launchd Trigger

```bash
#!/bin/bash
# ~/.dotfiles/bin/morning-alert

"/Applications/Utilities/Notifier.app/Contents/MacOS/Notifier" \
  --type alert \
  --title "Claude Daily" \
  --message "Good morning! Ready for your daily planning?" \
  --messagebutton "Start" \
  --messagebuttonaction "$HOME/.dotfiles/bin/claude-daily" \
  --sound Glass
```

## Resources

- GitHub: https://github.com/jamf/Notifier
- Installed via: https://github.com/jamf/Notifier/releases (pkg)

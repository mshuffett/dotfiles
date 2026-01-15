---
name: Peekaboo Mac Automation
description: Use when automating macOS apps, clicking UI elements, taking screenshots, or controlling applications programmatically. Covers the peekaboo CLI for vision-based automation.
---

# Peekaboo Mac Automation

Peekaboo is a CLI tool for macOS automation that combines accessibility APIs with vision-based element detection.

## Core Commands

```bash
# Switch to an app
peekaboo app switch --to "AppName" --verify

# Take a screenshot
peekaboo image  # saves to current dir

# See UI elements (accessibility tree + vision)
peekaboo see --app "AppName" --json

# Click by element text
peekaboo click "Button Label" --app "AppName"

# Click by element ID (from see output)
peekaboo click --id elem_27 --app "AppName"

# Click by coordinates (screen coordinates)
peekaboo click --coords 150,400 --app "AppName"

# Type text
peekaboo type "text to type" --app "AppName"

# Press keys
peekaboo press "Return" --app "AppName"
peekaboo press "Down" --app "AppName"

# Scroll
peekaboo scroll --direction down --amount 10 --app "AppName"

# Move mouse
peekaboo move 150,400 --app "AppName"
```

## The Agent Feature (Recommended)

The `peekaboo agent` command uses AI to autonomously complete complex UI tasks. **Use `--model gemini-3-flash`** for best results (Anthropic OAuth often has auth issues).

```bash
# Basic agent usage
peekaboo agent "Click on Settings in the app" --model gemini-3-flash --max-steps 5

# More complex task
peekaboo agent "Search for 'Group 1' and click on it, then open the members list" --model gemini-3-flash --max-steps 10
```

### Agent Setup

1. Set up credentials:
```bash
# For Gemini (recommended)
peekaboo config set-credential GOOGLE_API_KEY "$GOOGLE_API_KEY"

# For Anthropic (requires OAuth, often problematic)
peekaboo config login anthropic
```

2. Available models:
   - `gemini-3-flash` (recommended - fast, reliable)
   - `claude-opus-4-5` (requires OAuth setup)
   - `gpt-5.1`

### Agent Tips

- Keep task descriptions clear and specific
- Use `--max-steps` to limit iterations (default: unlimited)
- Agent automatically uses `see`, `click`, `type`, `scroll` tools
- Agent reports what it's doing in real-time

## Finding Elements

When clicking doesn't work by label, use `see` to find element IDs:

```bash
# Get all actionable elements
peekaboo see --app "AppName" --json 2>/dev/null | \
  jq -r '.data.ui_elements[] | select(.is_actionable == true) | "\(.id): \(.label)"'

# Search for specific text
peekaboo see --app "AppName" --json 2>/dev/null | \
  jq -r '.data.ui_elements[] | select(.label | tostring | test("search term")) | "\(.id): \(.label)"'
```

Then click by ID:
```bash
peekaboo click --id elem_27 --app "AppName"
```

## Common Patterns

### Navigate and Screenshot
```bash
peekaboo app switch --to "AppName" --verify
sleep 0.5
peekaboo image
```

### Search and Select
```bash
peekaboo click "Search" --app "AppName"
peekaboo type "search query" --app "AppName"
peekaboo press "Return" --app "AppName"
```

### Scroll Through List
```bash
peekaboo move 400,300 --app "AppName"  # position over list
peekaboo scroll --direction down --amount 10 --app "AppName"
```

## Troubleshooting

- **Element not found**: Use `peekaboo see --json` to find the correct element ID
- **Clicks wrong app**: Always specify `--app "AppName"` and use `--verify` with `app switch`
- **Auth errors with agent**: Use `--model gemini-3-flash` instead of Anthropic
- **Coordinates off**: Coordinates are screen-absolute; make sure target app is frontmost

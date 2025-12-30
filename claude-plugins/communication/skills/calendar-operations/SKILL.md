---
name: Calendar Operations
description: Use when user asks about calendar, schedule, wants to create/view events, mentions meetings, appointments, or availability.
version: 1.0.0
---

# Calendar Operations

Google Calendar CLI tool for viewing, creating, and managing calendar events.

## Quick Reference

```bash
# Authentication (first time)
gcal auth

# View events
gcal today                          # Today's events
gcal week                           # This week's events
gcal list --from 2025-01-15 --to 2025-01-20

# Create event
gcal create "Team Meeting" --when "tomorrow 2pm" --duration 60
gcal create "Lunch" --when "2025-01-15 12:00" --duration 90 --location "Cafe"
gcal create "Review" --when "next monday 10am" --attendees "alice@example.com,bob@example.com"

# Update event
gcal update <event_id> --title "New Title"
gcal update <event_id> --when "2025-01-16 3pm"
gcal update <event_id> --location "Room 42"

# Delete event
gcal delete <event_id>

# Check availability
gcal freebusy "tomorrow"
gcal freebusy "2025-01-15"

# List calendars
gcal calendars
```

## Date/Time Parsing

The CLI supports natural language dates:

| Input | Interpretation |
|-------|---------------|
| `today` | Today at midnight |
| `tomorrow` | Tomorrow at midnight |
| `tomorrow 2pm` | Tomorrow at 14:00 |
| `next monday` | Coming Monday |
| `next friday 10am` | Coming Friday at 10:00 |
| `2025-01-15` | Specific date |
| `2025-01-15 14:30` | Specific date and time |

## Create Event Options

```bash
gcal create "Title" \
  --when "tomorrow 2pm" \       # Required: start time
  --duration 60 \               # Optional: minutes (default: 60)
  --location "Conference Room" \ # Optional: location
  --description "Agenda..." \   # Optional: description
  --attendees "a@b.com,c@d.com" # Optional: comma-separated emails
```

## Output Formats

- Default: Human-readable output
- `--json`: JSON output for programmatic use

## Common Workflows

### Check today's schedule
```bash
gcal today
```

### Schedule a meeting
```bash
gcal create "1:1 with Alice" --when "tomorrow 3pm" --duration 30 --attendees "alice@company.com"
```

### Find free time
```bash
gcal freebusy "tomorrow"
```

### Reschedule meeting
```bash
gcal update <event_id> --when "friday 2pm"
```

### Cancel meeting
```bash
gcal delete <event_id>
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_CREDENTIALS_PATH` | `~/.config/google/credentials.json` | OAuth credentials |
| `GOOGLE_TOKEN_PATH` | `~/.config/google/token.json` | Cached token |

## Timezone

Events are created in `America/Chicago` timezone by default. The CLI uses local time for display.

## First-Time Setup

1. Enable Google Calendar API in Google Cloud Console
2. Create OAuth 2.0 Desktop credentials
3. Download JSON to `~/.config/google/credentials.json`
4. Run `gcal auth` to authenticate

## Error Handling

- **"Credentials file not found"**: Download OAuth credentials from GCP Console
- **"Token expired"**: Run `gcal auth` to re-authenticate
- **"Event not found"**: Verify event ID with `gcal today` or `gcal list`

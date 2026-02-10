---
name: calendar-operations
description: Use when user asks about calendar, schedule, wants to create/view events, mentions meetings, appointments, or availability. Covers gcal CLI.
---

# Calendar Operations

Google Calendar CLI tool (`gcal`) for viewing, creating, and managing calendar events.

## Quick Reference

```bash
# View events
gcal today                          # Today's events
gcal week                           # This week's events
gcal list --from 2025-01-15 --to 2025-01-20

# Create event
gcal create "Team Meeting" --when "tomorrow 2pm" --duration 60
gcal create "Lunch" --when "2025-01-15 12:00" --duration 90 --location "Cafe"
gcal create "Review" --when "next monday 10am" --attendees "alice@example.com,bob@example.com"

# Update / Delete
gcal update <event_id> --title "New Title"
gcal update <event_id> --when "2025-01-16 3pm"
gcal delete <event_id>

# Check availability
gcal freebusy "tomorrow"

# List calendars
gcal calendars
```

## Create Event Options

```bash
gcal create "Title" \
  --when "tomorrow 2pm" \       # Required: start time
  --duration 60 \               # Optional: minutes (default: 60)
  --location "Conference Room" \ # Optional: location
  --description "Agenda..." \   # Optional: description
  --attendees "a@b.com,c@d.com" # Optional: comma-separated emails
```

## Date/Time Parsing

Supports natural language: `today`, `tomorrow 2pm`, `next monday`, `next friday 10am`, `2025-01-15 14:30`.

## Output Formats

- Default: Human-readable
- `--json`: JSON for programmatic use

## Environment

- `GOOGLE_CREDENTIALS_PATH` (default `~/.config/google/credentials.json`)
- `GOOGLE_TOKEN_PATH` (default `~/.config/google/token.json`)
- Timezone: `America/Chicago` by default
- Auth: `gcal auth` (first time or token expired)

## Acceptance Checks

- [ ] Correct gcal subcommand used (create, update, delete, list)
- [ ] Event times use natural language or ISO format
- [ ] Attendees comma-separated if multiple

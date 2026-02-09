---
tags: [calendar, cli]
updated: 2026-02-08
---

# gcal CLI (Google Calendar)

## Defaults (Michael)

- Local timezone: `America/Los_Angeles`
- Primary calendar: `primary` (michael@geteverything.ai)
- Secondary calendar (read): `michael@compose.ai`

## Commands

```bash
# Calendars
gcal calendars

# Today / Week
gcal today
gcal week

# List range
gcal list --from 2026-02-14 --to 2026-02-15

# JSON output (flag goes before subcommand)
gcal --json list --from 2026-02-14 --to 2026-02-15

# Create
gcal create "Title" --when "2026-02-14 12:00" --duration 240 \
  --attendees "person@example.com" \
  --description "..."

# Update
gcal update <event_id> --when "2026-02-14 12:00"

# Delete
gcal delete <event_id>
```

## Notes

- For weekly repeating blocks: create a rolling series (e.g. 8-12 weeks) unless recurrence is supported.
- Verify by listing the day after creating/updating.

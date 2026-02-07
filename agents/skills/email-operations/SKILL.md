---
name: Email Operations
description: Use when user asks about emails, wants to send/read/search email, mentions inbox, drafts, labels, or Gmail operations.
version: 1.0.0
---

# Email Operations

Gmail CLI tool for reading, sending, and managing emails.

## Quick Reference

```bash
# Authentication (first time)
gmail auth

# Search emails
gmail search "from:boss@company.com"
gmail search "is:unread" --limit 20
gmail search "subject:meeting after:2025/01/01"

# Read email
gmail read <message_id>
gmail read <message_id> --json

# Send email
gmail send "to@example.com" "Subject line" "Email body here"

# Reply to email
gmail reply <message_id> "Reply text here"

# Archive (remove from inbox)
gmail archive <message_id>

# Add label
gmail label <message_id> "Important"

# Move to trash
gmail trash <message_id>

# List all labels
gmail labels

# Drafts
gmail drafts list
gmail drafts create "to@example.com" "Subject" "Body"
gmail drafts send <draft_id>
```

## Search Query Syntax

Gmail search supports these operators:

| Operator | Example | Description |
|----------|---------|-------------|
| `from:` | `from:alice@example.com` | Sender |
| `to:` | `to:bob@example.com` | Recipient |
| `subject:` | `subject:meeting` | Subject line |
| `is:` | `is:unread`, `is:starred` | Message state |
| `has:` | `has:attachment` | Has attachments |
| `after:` | `after:2025/01/01` | Date filter |
| `before:` | `before:2025/12/31` | Date filter |
| `label:` | `label:work` | Has label |
| `in:` | `in:inbox`, `in:sent` | Location |
| `-` | `-from:spam@` | Exclude |

Combine operators: `from:boss@company.com is:unread after:2025/01/01`

## Output Formats

- Default: Human-readable output
- `--json`: JSON output for programmatic use

## Common Workflows

### Check unread emails

```bash
gmail search "is:unread" --limit 10
```

### Read and archive

```bash
gmail read <id>
gmail archive <id>
```

### Send quick reply

```bash
gmail reply <id> "Thanks, I'll take a look!"
```

### Organize with labels

```bash
gmail label <id> "Projects/Alpha"
gmail archive <id>
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_CREDENTIALS_PATH` | `~/.config/google/credentials.json` | OAuth credentials |
| `GOOGLE_TOKEN_PATH` | `~/.config/google/token.json` | Cached token |

## First-Time Setup

1. Enable Gmail API in Google Cloud Console
2. Create OAuth 2.0 Desktop credentials
3. Download JSON to `~/.config/google/credentials.json`
4. Run `gmail auth` to authenticate

## Error Handling

- **"Credentials file not found"**: Download OAuth credentials from GCP Console
- **"Token expired"**: Run `gmail auth` to re-authenticate
- **"Insufficient permissions"**: Re-authenticate with `gmail auth` (scopes may have changed)

## Related Notes (Deep Dives)

- `agents/knowledge/atoms/claude-skill-archive/email-triage/SKILL.md`

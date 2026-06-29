---
name: Email Operations
description: Use when user asks about emails, wants to send/read/search email, mentions inbox, drafts, labels, or Gmail operations.
version: 1.0.0
---

# Email Operations

Gmail CLI tool for reading, sending, and managing emails.

## Never determine status from snippets — read the full thread

When you search email to answer **did they reply / what's the status / did they decline / did they confirm / what did they say**, the flow is always: **search → `get_thread` (FULL content) → read EVERY message in the thread, full bodies, start to finish → then judge status.** Do NOT conclude from search-result snippets, a list/preview view, or a metadata/minimal thread view — a decline, a "yes", or the one key condition is usually an ordinary message that the snippet truncates or buries.

Read the **entire** thread, every message — not just the latest reply. Status is set by the full back-and-forth, and a decline or key condition often sits *mid-thread* (before a later logistics or auto-reply message), so reading only the most recent message still gets it wrong. Read all of it, start to finish, before you assert anything.

**Auto-replies never determine status.** An out-of-office / vacation / "I'm away until X" bounce is not an answer — ignore it and read the human messages in the thread. "OOO" means *keep reading*, not "still pending."

This holds even for a "quick check." The extra read is cheap; reporting the wrong status (warm when they've declined, pending when they've confirmed) sends Michael down the wrong path and is hard to walk back.

> Canonical miss (2026-06-29): reported Okta/Auth0 as "still warm / out-of-office" for the Demo Day venue from search snippets + a Jun-27 out-of-office auto-reply — when they had actually **declined** in an ordinary Jun-26 reply ("our team is unfortunately unable to support this event"). The full thread was never opened. This is the same failure as the `email-reply-style` "read the full thread, never snippets" rule, applied to status-determination instead of drafting.

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

## Reading large threads (Gmail MCP `get_thread` token-limit workaround)

When using the **claude.ai Gmail MCP** tools (`get_thread`, not the `gmail` CLI), long threads frequently blow the tool-result token limit. You'll get:

```
Error: result (89,970 characters) exceeds maximum allowed tokens.
Output has been saved to /Users/michael/.claude/projects/<project>/<session>/tool-results/mcp-claude_ai_Gmail-get_thread-<id>.txt
```

Do **not** give up or fall back to snippets (drafting from snippets is the #1 email mistake — see `email-reply-style`). The full thread is sitting in that saved `.txt` file as JSON. Extract just the message bodies with `jq`:

```bash
jq -r '.messages[] | "--- \(.date[0:10]) | FROM \(.sender) | TO \(.toRecipients // [] | join(",")) ---\n\(.plaintextBody[0:800])\n"' \
  "/Users/michael/.claude/projects/<project>/<session>/tool-results/mcp-claude_ai_Gmail-get_thread-<id>.txt"
```

Schema of the saved JSON: top-level `.messages[]`, each with `.date`, `.sender`, `.toRecipients` (array), `.plaintextBody`. Slice `.plaintextBody[0:800]` to keep each message compact while still capturing the actual ask (proposed times, links, questions). Batch multiple saved files in a `for f in <id1> <id2>; do ... done` loop. This gives you every full message body without re-fetching or exceeding context.

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


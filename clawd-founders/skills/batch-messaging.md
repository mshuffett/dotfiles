# Batch Messaging

Send messages to multiple founders with human-like delays to avoid spam detection.

## CLI Tool: batch-wa

For bulk sends with the same message:

```bash
# Preview what would be sent (no actual sends)
batch-wa --message "Hey! Quick check-in - how's everything going?" --file founders.txt --dry-run

# Actually send
batch-wa --message "Hey! Quick check-in - how's everything going?" --file founders.txt

# Custom delays (10-30 seconds between messages)
batch-wa --message "..." --file founders.txt --delay-min 10 --delay-max 30
```

The file should have one phone number per line in E.164 format:
```
+14155551234
+17035551234
```

## Agent Message Tool

For personalized messages (reading founder context), use the message tool directly:

```json
{
  "action": "send",
  "channel": "whatsapp",
  "to": "+14155551234",
  "message": "Hey [Name]! Wanted to check in on [Company]...",
  "dryRun": true
}
```

When sending to multiple founders:
1. Query founder context from database: `bun ~/clawd-founders/scripts/query-db.ts phone +14155551234`
2. Personalize the message using their name, company, goals
3. Send with `dryRun: true` first to preview
4. If looks good, send for real
5. Wait 5-15 seconds between sends (use a natural pace)

## Rate Limiting Guidelines

- Default: 5-15 seconds between messages
- For larger batches (20+): consider 10-30 seconds
- Never send more than ~50 messages in a single session
- If you get rate limited, stop and wait an hour

## Founder List

The list at `~/clawd-founders/founders.txt` contains phone numbers for batch messaging:
```
# Active founders
+14155551234
+17035551234

# On hold (skip for now)
# +12125551234
```

Lines starting with # are ignored.

## Querying Recipients by Subgroup

To message a specific subgroup:
```bash
# Get all phones for subgroup 1
sqlite3 ~/clawd-founders/data/founders.db "SELECT phone FROM founders WHERE subgroup = 1 AND phone IS NOT NULL"
```

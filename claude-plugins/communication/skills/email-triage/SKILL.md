---
name: Email Triage
description: Use when triaging emails, classifying inbox messages, or working with email-triage CLI. Provides classification rules, categories, and action mapping.
version: 1.0.0
---

# Email Triage System

Automated email classification and response drafting system.

## Categories

| Category | Description | Actions |
|----------|-------------|---------|
| `urgent` | Needs response today, time-sensitive | Push notification, draft response, keep in inbox |
| `action` | Needs response, not time-sensitive | Draft response, label, keep in inbox |
| `fyi` | Informational, worth reading | Label, keep in inbox |
| `noise` | Newsletters, notifications, marketing | Auto-archive |
| `calendar` | Meeting invites/updates | Label, no notification |

## Classification Signals

### Urgent Signals
- Sender is known important contact (YC partners, investors, key customers)
- Subject contains: urgent, asap, deadline, today, EOD, by [time]
- Reply to an email you sent (they responded)
- Direct question requiring answer
- Time-sensitive request with specific date

### Action Signals
- Direct question or request
- Requires decision or input
- Follow-up on previous conversation
- Meeting scheduling request
- Review/feedback request

### FYI Signals
- CC'd on thread (not primary recipient)
- Status update, no action needed
- Announcement or news
- Confirmation of completed action
- Automated but relevant (build notifications, deploys)

### Noise Signals
- Contains "unsubscribe" link
- From known newsletter domains (@substack.com, @beehiiv.com, @convertkit.com)
- Marketing language (sale, discount, offer, limited time)
- Mass email (many recipients)
- Automated notifications you don't need to act on
- Social media notifications

### Calendar Signals
- From calendar-notification@google.com
- Subject contains: invite, accepted, declined, updated, canceled
- Contains .ics attachment or calendar event

## Draft Response Guidelines

When drafting responses:
1. Match the sender's formality level
2. Be concise - aim for 2-3 sentences when possible
3. Include clear next step or answer
4. Use preferences.md for scheduling links, signature, templates
5. If unsure, ask clarifying question rather than guess

## CLI Commands

```bash
# Learn your style from sent emails
email-triage --learn-style

# Backtest on historical emails
email-triage --backtest 50

# Dry-run (default) - shows actions, creates drafts
email-triage

# Actually apply all actions
email-triage --apply

# Correct a misclassification
email-triage --correct <message_id>
```

## Files

- `preferences.md` - Your personal style, templates, known contacts
- `corrections.md` - Feedback on misclassifications (improves over time)

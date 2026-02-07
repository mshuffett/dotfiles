---
name: Email Triage
description: Use when triaging emails, classifying inbox messages, or working with email-triage CLI. Provides categories, classification rules, and action mapping.
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
| `calendar` | **Automated** meeting invites/updates only | Label, no notification |

**Note**: The `calendar` category is only for automated notifications (calendar-notification@google.com), not human messages about events.

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
- Emails containing "YC", "Y Combinator", or from YC-related contacts with action items

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
- From marketing@* or noreply@*

### Calendar Signals (Automated Only)
- From calendar-notification@google.com
- Subject contains: invite, accepted, declined, updated, canceled
- Contains .ics attachment or calendar event

## Draft Response Guidelines

1. Match the sender's formality level
2. Be concise - aim for 2-3 sentences when possible
3. Include clear next step or answer
4. Use preferences.md for scheduling links, signature, templates
5. If unsure, ask clarifying question rather than guess
6. Use warm/enthusiastic tone: "awesome", "crushing it", "glad you can make it"
7. Address the person directly, not the introducer (in forwarded intros)
8. Short acknowledgments are valid responses

### Context-Aware Responses
- Demo day in subject + interest -> use RSVP link, not calendar link
- Investor from fund -> proactively mention sponsor opportunities
- When unclear -> ask clarifying question + offer call

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

## Reference Files

This skill uses additional files in its directory:
- `preferences.md` - Personal style, templates, known contacts, scheduling links
- `corrections.md` - Feedback on misclassifications (used as few-shot examples)
- `backtest-results.md` - Historical testing results and prompt improvements

## Acceptance Checks

- [ ] Emails correctly categorized (urgent/action/fyi/noise/calendar)
- [ ] Human messages about events NOT classified as "calendar"
- [ ] YC-related emails with action items NOT classified as "noise"
- [ ] Draft responses match user's tone and style from preferences.md
- [ ] Corrections from corrections.md reflected in classification

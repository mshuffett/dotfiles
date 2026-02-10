---
name: email-reply-style
description: Use when drafting email replies for Michael, generating outbound emails, or applying his email communication patterns and style.
---

# Michael's Email Reply Style

When generating email replies or drafts for Michael, follow this style guide.

## Email Direction Detection

**FIRST, determine if this is OUTBOUND or INBOUND:**

### OUTBOUND (Michael Initiating)

Michael is sending TO someone, not responding:

- Subject has NO "Re:" prefix
- `is_reply: false` in training data
- Common outbound patterns:
  - **Cold intros**: "Introducing Everything AI", "Agreement on...", "Intro to..."
  - **Requests**: "Please delete my account", account deletions
  - **Pitches**: Fundraising emails with product demos

**For OUTBOUND emails**: Generate content Michael would SEND, not receive.

### INBOUND (Michael Responding)

Michael is responding to someone else:

- Subject has "Re:" prefix
- `is_reply: true` in training data
- `original_message` contains what they sent

**For INBOUND emails**: Respond to the thread context.

## Superhuman Automation Patterns

Michael uses Superhuman for automated actions. Recognize these:

### Unsubscribe Requests

When email is TO a weird hash address (like `LBPWIYZTGQ...@unsub-ab.mktomail.com`) with subject "Unsubscribe":

- This is Superhuman sending an unsubscribe ON BEHALF of Michael
- The reply is: `This is an unsubscribe request sent from Superhuman on behalf of michael@geteverything.ai`
- **DO NOT** generate "You've been unsubscribed" - Michael is the one unsubscribing

## Thread Context Usage

**ALWAYS use the `original_message` to understand:**

1. What was asked/proposed
2. What specific details were mentioned
3. What Michael needs to address
4. Any links or resources mentioned

**Example of proper context usage:**

- If they say "I'll send the memo" -> Michael's reply references the memo
- If they ask about timing -> Michael gives specific timing
- If they share an error -> Michael acknowledges the specific error

## Key Differences from Messaging (WhatsApp/SMS)

Email is MORE formal than messaging:

- Complete sentences and proper grammar
- Sign-offs ("Best," "Thanks,")
- Often includes links (Luma events, Cal.com scheduling)
- Longer substantive content when needed
- Professional but warm tone

## Style Patterns

### Length by Context

| Context               | Length         | Example                          |
| --------------------- | -------------- | -------------------------------- |
| Simple acknowledgment | 1 line         | "Thanks" or "Got it, thanks!"    |
| Quick reply           | 2-3 sentences  | Answer + sign-off                |
| Substantive reply     | Paragraph(s)   | Full response with context       |
| Intro/meeting request | Short + links  | Greeting, 1-2 sentences, links   |

### Common Structures

**Quick Acknowledgment:**

```text
Thanks
```

**Simple Reply:**

```text
Hey [Name],

[1-2 sentence response]

Best,
Michael
```

**Reply with Links:**

```text
Hey [Name],

[Brief context]

Here's the event: https://luma.com/...
If you have questions: https://cal.com/everythingai/15min

Thanks
```

**Substantive Reply:**

```text
Hey [Name],

[Main response - can be multiple paragraphs for complex topics]

[Optional: next steps or links]

Best,
Michael
```

## Key Resources (Auto-Include When Relevant)

- **15-min meeting**: https://cal.com/everythingai/15min
- **30-min meeting**: https://cal.com/everythingai/30min
- **Demo Day Event**: https://luma.com/7wf4iwk5
- **Batch Meetup Location**: Avalon at Mission Bay, 255 King St, San Francisco CA 94107
- **Michael's Address**: 338 Main Street Apartment 15G, San Francisco, CA

## Characteristic Phrases

- "Hey [Name]," (not "Hi" or "Hello")
- "Thanks" or "Best," as sign-off
- "Happy to [verb]" (connect, discuss, help)
- "Let me know if you have any questions"
- "Feel free to grab a time here: [cal link]"
- "Here's the event: [luma link]"

## Response Patterns by Scenario

### Meeting/Call Requests

- Include Cal.com link
- Brief context if needed
- Example: "Happy to connect! Here's my calendar: https://cal.com/everythingai/15min"

### Introductions Received

- Thank the introducer (move to BCC)
- Greet the new person
- Provide relevant links
- Example: "Thanks [Introducer]! (moving to BCC)\n\nHey [New Person], nice to meet you! [Context + links]"

### Event Invitations

- Include RSVP link
- Mention limited spots if applicable
- Example: "RSVP here to lock in your spot: https://luma.com/..."

### Feedback/Exits

- Acknowledge gracefully
- Ask for SPECIFIC reasons if someone exits
- Example: "Makes total sense. [Acknowledgment]. Can you tell me what the misalignment was?"

### Information Requests

- Direct answer
- "Will share closer to the event" if info not ready

### Timeline Questions

When someone asks about timing:

- Give APPROXIMATE timeframe: "next month or so", "in the next 2-3 weeks"
- Don't overcommit to specific dates unless certain
- Example: "I think timeline is in next month or so. Thanks! No questions so far."

### Follow-Up After Meetings

When following up on a meeting:

- Reference what was discussed: "I was trying to remember the next steps from our meeting"
- Ask what you may have missed: "I think you were going to send X..."
- Be honest about forgetting details
- Example: "I was trying to remember the next steps from our meeting last week -- I think you were going to send me the memo?"

### Error/Bug Reports

When someone reports an error:

- Acknowledge the SPECIFIC error they mentioned
- Don't generate generic "I'll check it out" - reference what they said
- Example: "Ok no worries would love to keep up on the progress. I signed up on the website but I did hit this error: [specific error]"

### Request for PayPal/Payment Info

When asking about payment:

- Ask for SPECIFIC instructions: "how do I pay through PayPal?"
- Request links if needed: "May I have the link where I can pay it via PayPal, please?"
- Don't generate "I'll set up PayPal" - ask for the info you need

### Date/Time Confirmations

When confirming meeting times:

- State the EXACT time from the thread: "3/23 at 3-4pm works for me"
- Don't pick random times - use what was offered in the thread
- Simple confirmation only - no extra fluff

## Confidence Classification

### HIGH CONFIDENCE (draft directly)

- Simple acknowledgments
- Scheduling with calendar links
- Standard intro responses
- Event RSVP reminders

### MEDIUM CONFIDENCE (draft with options)

- Replies requiring specific context
- Negotiating times/terms
- Requests that could go either way

### LOW CONFIDENCE (flag for review)

- Legal/contractual content
- Sensitive personnel matters
- Strategic decisions
- Financial discussions

## What NOT to Do

- Don't use "Hi [Name]" - use "Hey [Name],"
- Don't use elaborate sign-offs - just "Best," or "Thanks"
- Don't forget to include relevant links when applicable
- Don't be overly formal or stiff
- Don't use emojis in professional emails
- Don't include unnecessary pleasantries

## RAG Lookup (Dynamic Learning)

Before generating an email reply, retrieve similar emails from Michael's history:

```bash
llm similar michael-emails -c "Subject: Re: [subject]\n[original_message snippet]" -n 3
```

This returns JSON with similar emails and Michael's actual replies. Use these as few-shot examples to:

- Match the exact style for similar situations
- Use the same links Michael used for similar emails
- Learn from new email patterns automatically (new emails are indexed periodically)

The embeddings are stored in `~/.llm.db` and indexed via launchd (`com.michael.email-index`).

## Training Data

Full training examples are in `training-data.json` in the original skill folder at:
`~/.dotfiles/claude-plugins/productivity/skills/email-reply-style/`

Format:

```json
{
  "to_name": "Person name",
  "to_email": "email@example.com",
  "subject": "Re: Subject line",
  "timestamp": "2026-01-14...",
  "is_reply": true,
  "original_message": "The email being replied to",
  "michael_reply": "Michael's actual reply"
}
```

## Real Examples

For full training examples, see [references/training-examples.md](references/training-examples.md).

## Learned Patterns & Memories

### Recent Observations

- Uses invisible character as email signature marker (Google invisible character)
- Moves introducers to BCC with explicit note
- For investor/event intros: provides RSVP link immediately
- Asks clarifying questions when someone exits/declines something

### Contact-Specific Patterns

(Add patterns for specific contacts as learned)

### Corrections & Adjustments

(Log corrections from Michael here to improve future replies)

---
name: Email Reply Style
description: Use when generating email replies for Michael, drafting emails, or tuning email response style. Provides Michael's email communication patterns and style guide.
---

# Michael's Email Reply Style

When generating email replies or drafts for Michael, follow this style guide.

## Key Differences from Messaging (WhatsApp/SMS)

Email is MORE formal than messaging:
- Complete sentences and proper grammar
- Sign-offs ("Best," "Thanks,")
- Often includes links (Luma events, Cal.com scheduling)
- Longer substantive content when needed
- Professional but warm tone

## Style Patterns

### Length by Context
| Context | Length | Example |
|---------|--------|---------|
| Simple acknowledgment | 1 line | "Thanks" or "Got it, thanks!" |
| Quick reply | 2-3 sentences | Answer + sign-off |
| Substantive reply | Paragraph(s) | Full response with context |
| Intro/meeting request | Short + links | Greeting, 1-2 sentences, links |

### Common Structures

**Quick Acknowledgment:**
```
Thanks
```

**Simple Reply:**
```
Hey [Name],

[1-2 sentence response]

Best,
Michael
```

**Reply with Links:**
```
Hey [Name],

[Brief context]

Here's the event: https://luma.com/...
If you have questions: https://cal.com/everythingai/15min

Thanks
```

**Substantive Reply:**
```
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
- **Address**: Avalon at Mission Bay, 255 King St, San Francisco CA 94107

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
- Ask for specifics if helpful
- Example: "Makes total sense. [Acknowledgment of their situation]. Thanks for the feedback!"

### Information Requests
- Direct answer
- "Will share closer to the event" if info not ready

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

## Training Data

Full training examples are in `training-data.json` in this skill folder.

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

## Learned Patterns & Memories

<!-- Add new learnings below as they are discovered from actual replies -->

### Recent Observations
- Uses "ᐧ" character as email signature marker (Google invisible character)
- Moves introducers to BCC with explicit note
- For investor/event intros: provides RSVP link immediately
- Asks clarifying questions when someone exits/declines something

### Contact-Specific Patterns
<!-- Add patterns for specific contacts as learned -->

### Corrections & Adjustments
<!-- Log corrections from Michael here to improve future replies -->

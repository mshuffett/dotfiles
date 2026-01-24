---
name: whatsapp-reply-style
description: Use when generating WhatsApp replies for Michael, auto-replying to messages, or tuning message response style. Provides communication patterns and style guide.
---

# Michael's WhatsApp Reply Style

When generating replies for Michael on WhatsApp (or similar messaging), follow this style guide.

## CRITICAL: Brevity First

Michael's replies are **extremely short**. Default to 1-5 words.

| Reply Type | Word Count | Examples |
|------------|------------|----------|
| Acknowledgments | 1-2 | "K", "Yes", "Yeah", "Cool", "nice" |
| Simple responses | 2-4 | "same lol", "I'm down", "3 works", "awesome thanks" |
| Questions | 2-5 | "They have lunch there?", "does that work?", "15?" |
| Scheduling | 0-3 | Just send Calendly link, or "does X work?" |
| Substantive | Longer OK | But still conversational, not formal |

## Style Patterns

- **Casual** - no formal greetings ("Hello!") or sign-offs ("Best,")
- **Lowercase OK** - "hey just got off...", "does that work?"
- **Ellipsis** - "cleared my day...", "I'll think about it..."
- **No emojis** typically
- **Direct** - send links without explanation
- **Flexible** - "OK either works", "today or tomorrow lmk"

## Characteristic Phrases

- "K" (not "Ok" or "Okay")
- "Yeah" / "Yep"
- "I'm down"
- "lmk"
- "does that work?"
- "awesome thanks"
- "same lol"

## Key Resources

- **15-min meeting**: https://cal.com/everythingai/15min
- **30-min meeting**: https://cal.com/everythingai/30min
- **Event invites**: Luma (https://luma.com/...)
- **Address**: Avalon at Mission Bay, 255 King St, San Francisco CA 94107

For quick scheduling, prefer the 15-min link. For substantive discussions, use 30-min.

## Response Patterns

### Scheduling Requests

Someone asks to meet/call -> Often just send Calendly link directly (no preamble)

### Acknowledgments

"I did X" or "Here's Y" -> "awesome thanks" / "nice" / "K"

### Timing Negotiation

"I'll call in 5" -> "15?" (counter-propose if needed)
"Does 3pm work?" -> "3 works" / "OK either works"

### Arrival/Location

"Lmk when you're here" -> "Here" / "Pulling up now" / "2 min"

### Empathy (brief)

Bad news shared -> "That sucks sorry to hear that"

## Multi-Option Generation

When uncertain, generate 3 DIVERSE reply options representing different response types:
- **Yes/Affirmative**
- **No/Decline/Alternative**
- **Need more info/Clarification**

Examples:

```text
"Is this your iMessage?"
a) Yeah  b) Nope different number  c) Which number did you try?

"Can we push our call to tomorrow?"
a) Works for me  b) Tomorrow's packed, what about Friday?  c) What time?

"Want to grab dinner Thursday?"
a) I'm down  b) Can't do Thursday  c) Where were you thinking?

"Can you intro me to [person]?"
a) Yeah happy to  b) Don't know them well enough tbh  c) What's the context?
```

This approach captures different possible responses, not just variations of the same answer.

## Confidence Classification

Before generating a reply, classify the message into one of these categories:

### HIGH CONFIDENCE (single answer)

- Simple acknowledgments ("thanks for the intro")
- Yes/no questions about facts ("is this your number?")
- Scheduling logistics ("what time works?")
- Location/address requests

**Action:** Generate single reply

### MEDIUM CONFIDENCE (multiple valid options)

- Requests that could go either way ("can we reschedule?")
- Questions where Michael's current state matters ("are you free?")
- Social invitations ("want to grab dinner?")

**Action:** Generate 3 diverse options (yes/no/need-more-info)

### LOW CONFIDENCE (needs human)

- Questions requiring Michael's specific opinions/ideas
- Strategic decisions
- Sensitive/personal topics
- Anything about money/investments
- Unfamiliar contacts with complex requests

**Action:** Reply with `[NEEDS_MICHAEL: Brief reason why]`

### Classification Examples

| Message | Confidence | Reason |
|---------|------------|--------|
| "Is this your iMessage?" | HIGH | Factual yes/no |
| "Just intro'd you to Dave" | HIGH | Acknowledgment |
| "What do you think about X approach?" | LOW | Needs Michael's opinion |
| "Can we meet tomorrow?" | MEDIUM | Depends on Michael's schedule |
| "I have a business proposal" | LOW | Strategic decision |

## Training Data

Full training examples are in `training-data.json` in this skill folder.
Use for few-shot prompting or DSPy optimization.

Format:

```json
{
  "chat_name": "Person/Group name",
  "conversation_history": [],
  "input_message": "Their message",
  "output_reply": "Michael's actual reply"
}
```

## What NOT to Do

- Don't use formal greetings/sign-offs
- Don't over-explain when sharing links
- Don't use emojis
- Don't add unnecessary words
- Don't say "Okay" - use "K" or "OK"
- Don't be overly enthusiastic

## Learned Patterns & Memories

### Recent Observations

- When someone sends an introduction, Michael often asks clarifying questions before sending calendar
- For investor intros specifically: "awesome thanks" (very brief)
- Scheduling: tends to just send the link without preamble for repeat contacts
- Time negotiation: often counter-proposes with just a number ("15?" instead of "Can we do 15?")

### Contact-Specific Patterns

- Hannah: Very brief, often single words ("K", "15?", "Now good?")

### Context-Dependent Behaviors

- YC batch members: More open to calls, often sends short calendar link
- Cold outreach: Asks "what are you building and how can I help?" first
- Friends: Ultra-brief, assumes context

### Corrections & Adjustments

<!-- Log corrections from Michael here to improve future replies -->

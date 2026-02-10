# Email Reply Style - Training Examples

Real examples from Michael's email history for few-shot prompting.

## Simple Acknowledgment (1 word)

```text
Input: [Jeremy shares links to forms]
Michael: "Thanks"
```

## Short Sympathy Reply

```text
Input: "I've had some personal stuff come up... won't be able to participate this batch"
Michael: "OK sorry to hear that."
```

## Introduction with Links (OUTBOUND)

```text
Subject: "Re: Dave Anderson (Beat Ventures) <> Michael/Michelle (YC alumni)"
Input: [Rune introduces Dave]
Michael: "Hey Dave,

Thanks for the intro Rune. Happy to connect with you about the demo day.

Here's the event please RSVP to lock in your spot. https://luma.com/7wf4iwk5

If you have any questions feel free to grab a time here:
https://cal.com/everythingai/30min

Thanks"
```

## Asking for Clarification on Exit

```text
Input: "Our group wasn't that aligned with the stage we're at, so it's hard to make the time commitment."
Michael: "Ok got it yeah might have been a bit tricky with the later kind of entry into the program. Can you tell me what the misalignment was?"
```

## Substantive Feedback Response

```text
Input: [Leo explains misalignment was due to location and team size]
Michael: "Makes total sense Leo. One of the things I'm finding is it is difficult to keep the experience consistent across locations and groups. Something I will need to account for if we want to make this the right kind of experience for more people going forward.

Thanks for the feedback!"
```

## Investor Question Response

```text
Input: "What kind of investors should I invite? Angels, VC's?"
Michael: "Hey Michael, thanks for inviting them. People in the batch I think are looking for the usual suspects like the highly rated investors who invest in YC companies and the higher tier firms."
```

## Simple Forward with Link

```text
Input: "One of my investors responded he wants in. Should I send an email to introduce him?"
Michael: "Hey Max yeah you can intro me and also send him them this link
https://luma.com/7wf4iwk5
Thanks"
```

## Superhuman Unsubscribe (AUTOMATION)

```text
To: [hash]@unsub-ab.mktomail.com
Subject: Unsubscribe
Michael: "This is an unsubscribe request sent from Superhuman on behalf of michael@geteverything.ai"
```

## Legal Agreement (OUTBOUND - no original)

```text
Subject: "Agreement on Deep24 Code Ownership"
Michael: "Hey Oliver,

Just wanted to memorialize the agreement that we had around ownership on the Deep24 codebase.

Since you will be sharing the code with me and we are not yet sure if we are going to be working together long term, we agreed that any edits that I make to the repo https://github.com/amber-ai-org/open_combinator would have an unlimited irrevocable license granted to Amber AI Inc. I would maintain ownership of all knowhow and this would in no way bar me from working on any related projects.

I will maintain full ownership of any edits I make to any repos other than that one specifically."
```

## Training Data Location

Full training examples (JSON) are in `training-data.json` in the original skill folder at:
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

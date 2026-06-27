---
name: Discord ack before long-running work
description: On Discord channels, send a short "on it, doing X" reply before any multi-step/long-running task so the channel isn't silent while I work
type: feedback
originSessionId: 55f3aaf4-5975-4eab-a9b8-395e4a99c8ef
---
When replying on Discord (and by extension other async channels), post a brief acknowledgment before starting any semi-long-running work — e.g. "on it, pulling the backlog now" or "checking, give me a sec" — so the user isn't staring at silence while tools run.

**Why:** tokenmaxxer explicitly asked for this on 2026-04-23 after I went quiet while filing a GitHub issue. Discord users can't see my tool calls; silence reads as "bot is broken" or "ignored."

**How to apply:**
- Trigger: any Discord-originated task that will take more than a single quick tool call (fetching messages, filing issues, downloading attachments, multi-step work).
- Reply first with one short sentence naming what I'm doing, then do it, then reply with the result.
- Use the reply tool for the ack (not just terminal text — terminal output never reaches the channel).
- For truly instant replies (one quick answer), skip the ack.

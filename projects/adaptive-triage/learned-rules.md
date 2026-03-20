# Learned Rules

Rules are proposed at the end of triage sessions based on correction patterns.
Confidence levels: low (1 example), medium (2-3 examples), high (4+ examples).

```yaml
rules:
  - id: rule-001
    rule: "When an event has already happened, default to Delete for pre-event tasks unless the item is clearly a post-event follow-up with a named deliverable (e.g., 'send recap to investors'). Vague post-event items like 'improve X for event' or 'verify Y day-of' are stale."
    examples:
      - "come up with logo for the batch" (2026-03-17)
      - "right now open batch lets you click sign in even if you don't have an account" (2026-03-17)
      - "decide if i need help from people like yuliya" (2026-03-17)
      - "update my profile and company info on open batch" (2026-03-17)
      - "send out updated volunteer names to chen-chen" (2026-03-17)
      - "get tasks on here updated" (2026-03-17)
      - "probably we could improve the software for demo day" (2026-03-17)
      - "possibly have the demo day website have more of a list view" (2026-03-17)
    confidence: medium
    added: 2026-03-17
    last_confirmed: 2026-03-17

  - id: rule-002
    rule: "When an item seems ambiguous but has ANY identifiable content (a name, a topic, a substance), classify as Reference rather than Clarify. Reserve Clarify only for items where you genuinely cannot determine even the domain."
    examples:
      - "Obi @ open batch" → Reference (bot name idea) (2026-03-17)
      - "glow stack peptides" → Reference (health) (2026-03-17)
      - "invited influencers..." → Reference (backlog note) (2026-03-17)
    confidence: low
    added: 2026-03-17
    last_confirmed: 2026-03-17

  - id: rule-003
    rule: "Items with 'consider' or deliberation language about people/opportunities the user hasn't engaged with yet lean Delete, not Seed. Only file as Seed if the idea has substance beyond 'maybe talk to X' or 'maybe apply to Y'."
    examples:
      - "Consider applying to hf0 again" → Delete (2026-03-17)
      - "consider working with the one dude from palmer" → Delete (2026-03-17)
    confidence: low
    added: 2026-03-17
    last_confirmed: 2026-03-17
```

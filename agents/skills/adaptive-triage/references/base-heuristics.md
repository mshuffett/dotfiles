# Base Classification Heuristics

These rules are the cold-start baseline. They apply when no learned rules exist
or when learned rules don't cover an item. As the system accumulates corrections,
learned rules take precedence over these heuristics.

## Category Detection

### Action
- Imperative verb + specific target/person, no hedging
- Has deadline or time-sensitivity
- Names a specific person to communicate WITH ("tell X", "send X", "follow up with X")
- Clear deliverable ("create", "review", "submit", "cancel", "schedule")

### Quick
- Under 5 minutes to complete
- Simple administrative task
- Single decision or approval
- Contains "APPROVE" prefix

### Reference
- Information worth keeping, not actionable now
- Tool/tech evaluations, articles, resources
- Feedback FROM someone (not action — user decides what to do)
- Philosophical reflections, observations, strategic thinking

### Seed
- Creative concept or product idea
- "What if we..." / "Imagine..." / brainstorming language
- Understood but not actionable yet — needs incubation

### Clarify
- Genuinely ambiguous — can't determine domain or intent
- Missing context that changes the classification
- Multiple valid interpretations with different outcomes

### Delete
- Over 30 days old AND vague
- Duplicate of another item
- Superseded by other work
- Was never actionable

## Voice Capture Detection

Voice captures are the #1 source of misclassification. Key signals:

**Brainstorming (→ Reference or Seed, NOT Action):**
- Modal verbs: could, might, would, should (tentative)
- Deliberation: "Let me think...", "either...or", "I'm thinking about"
- Observation: "is a pretty good...", "I guess...", "I wonder if"
- Hedging: "maybe", "possibly", "not sure but"

**Real action (→ Action):**
- Imperative + specific person: "tell Chen-Chen about X"
- Imperative + specific target: "cancel my subscription to X"
- Explicit commitment: "make sure X is enabled", "send the contract"

When in doubt between Action and Reference, choose Reference. A missed action
is easy to catch in review; a brainstorm filed as a task clutters the system.

## Project Assignment

Priority order:
1. Person-based: if item involves communicating WITH a known person, use that
   person's project association (stronger than keywords)
2. Keyword-based: match against active project domains
3. Default: Everything AI for technical content

Note: feedback FROM a person doesn't trigger person-based assignment.
The person-project associations come from learned rules, not this file.

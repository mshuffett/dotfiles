# Triage Correction Scenarios

Domain-specific examples showing how corrections translate into understanding and prompt edits. For the general improvement methodology, see the `prompt-self-improvement` skill.

## How Corrections Work

When the user marks something as wrong:

1. **Articulate the misunderstanding** — not just what, but WHY. What signal was over/under-weighted?
2. **Propose a fix** — specific edit to the prompt, project annotations, or processing principles. Say exactly where and why.
3. **Test the fix** — re-run corrected items + similar past items. Verify no regressions.
4. **Present for approval** — show: misunderstanding, proposed fix, proof it works.

## Scenarios

### 1: Wrong project assignment — keyword vs. person

**Correction:** "Chen-Chen → Demo Day, not Everything AI"

**Understanding:** "Chen-Chen is a Demo Day contact and 'the space' is event-related. Both signals point to Demo Day. The person-project association rule is valid — the error was having the wrong association data."

**Fix:** Add processing principle: *"When an item references a person, use their known project association as the primary signal over keywords."* Annotate project list with key contacts. Ensure contact associations are based on real data, not hypothetical scenarios.

### 2: Misreading brainstorming as action

**Correction:** "'could make the bot for the event' — that's brainstorming, not a task"

**Understanding:** "I treated 'could make' as intent to act. In voice captures, modal verbs (could/might/what if) are thinking out loud. Real tasks use imperative language with a specific target."

**Fix:** Update classification: *"Voice captures with modal/conditional language → Reference or Project Seed. Imperative language with specific person + target → Action."*

### 3: Failed to cluster related items

**Correction:** "These 4 claude repos should have been one note"

**Understanding:** "I treated each GitHub link as independent because they had different names. But they're all tools in the same problem space. Shared problem domain matters more than distinct repos."

**Fix:** Strengthen clustering: *"Cluster by problem domain and use case, not by source. Multiple tools solving the same problem = one note."*

### 4: Wrong output depth

**Correction:** "GitHub summaries are too long, just tell me what it does and if it's maintained"

**Understanding:** "I was summarizing READMEs comprehensively. For tooling references, the user wants a quick evaluation lens — what it does, is it alive, is it relevant."

**Fix:** Update enrichment: *"For GitHub repos: one sentence on function, note stars/last-commit/activity, flag if relevant to active project. Don't summarize the README."*

### 5: Recurring pattern — first fix insufficient

**Correction:** Third time brainstorming was filed as action (across sessions)

**Understanding:** "The verb-based heuristic wasn't strong enough. The deeper pattern: voice captures are almost never direct actions. They're a thinking-out-loud channel. The rare exception is naming a person + specific communication."

**Fix:** Change the default: *"Voice-captured items default to Reference/Project Seed. Only classify as Action if there is both a specific person AND a specific communication."*

### 6: Confidence threshold too conservative

**Correction:** "Stop asking me to clarify things that are obviously AI-related — just assume Everything AI"

**Understanding:** "I'm being too conservative for the primary project. Everything AI is an agent orchestration platform, and most technical content is related. The prior probability is very high."

**Fix:** Two changes: (1) *"The user's primary project domain acts as a strong default. Only flag for clarification when content clearly belongs elsewhere."* (2) Annotate project list with domain keywords.

## Anti-Patterns

- **Don't create rules for one-off errors.** Genuine ambiguity ≠ systematic flaw.
- **Don't make the prompt longer when you can make it more precise.** Replace vague with specific.
- **Don't test only the corrected item.** Always include regression cases.
- **Don't accumulate contradictory rules.** New edit conflicts with existing → replace, don't stack.

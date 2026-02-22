---
name: inbox-triage
description: Process raw Todoist inbox items into a structured knowledge system using GTD (actions → Todoist) and PARA (reference → Obsidian). Use this skill whenever the user says "process my inbox", "triage my todoist", "clean up inbox items", "file these captures", or has a batch of raw items (voice notes, links, ideas) that need classifying and filing. Also use when the user mentions inbox zero, PARA filing, or batch-processing captures into Obsidian notes — even if they don't explicitly say "triage".
---

# Inbox Triage

Take a batch of raw Todoist inbox items and turn them into three things: a triage report (the audit trail), Obsidian reference notes (linked, with MOC suggestions), and Todoist action items (filed to the right projects).

## Before You Start

1. Read [references/scenarios.md](references/scenarios.md) — these correction examples show the patterns that matter most (voice capture misclassification, clustering failures, project assignment errors)
2. Check `~/ws/notes/.claude/rules/coach-patterns.md` for learned filing patterns from past sessions
3. Load any recent triage sessions that have corrections — they're more valuable than ones without

## Project Check-In

Present the active projects and ask if anything changed. Use `para-index` skill's `references/system-ids.md` for current IDs. Wait for confirmation before processing — getting the project list wrong cascades into bad assignments.

## Processing Each Item

### Enrich

- **Links/URLs**: Fetch and summarize briefly. For GitHub repos, keep it to one sentence on what it does plus activity signals (stars, last commit). The user will read the repo themselves if interested — your job is to help them decide if it's worth reading, not to summarize it for them.
- **Voice captures**: These are thinking-out-loud, captured on the go. The language matters — modal verbs (could, might, what if, maybe), deliberation ("Let me...", "either...or", "I'm thinking about"), and observation ("is a pretty good...", "I guess...") all signal brainstorming, not commitment. Only imperative language with a specific person or target ("tell X about Y", "send the contract", "make sure X is enabled") signals a real action.
- **Ambiguous items**: Flag them rather than guessing. It's better to ask one question than to silently misfile something.

### Classify

Each item goes into EXACTLY ONE of these categories — never two:

| Category | Signal | Destination |
|----------|--------|-------------|
| **Action** | Imperative verb + specific target/person, no hedging | Todoist → matching project |
| **Reference** | Information worth keeping, not actionable now. Includes feedback from others. | Obsidian → Resources or Area |
| **Project Seed** | Creative concept or idea you understand but isn't actionable yet. Needs incubation. | Obsidian → Resources/Project Seeds |
| **Clarify** | The words themselves are genuinely ambiguous — you can't even guess the domain or intent. | Hold in report with best guess + question |

**The most common mistake is classifying brainstorming as action.** Voice captures are almost never direct action items. They're a thinking-out-loud channel. The rare exception is when the user names a specific person and a specific thing to communicate ("let X know about Y"). When in doubt between Action and Reference, choose Reference — a missed action is easy to catch in review, but a brainstorm filed as a task clutters the system and gets ignored.

**Feedback from others is Reference, not Action.** When someone shares feedback or information WITH the user (e.g., "feedback from X — they said Y"), that's information to preserve. Don't infer an action from feedback — the user decides what to do during review.

**Project Seed vs Clarify:** If you understand the general nature of the item (it's a creative concept, a product idea, a brainstorm) but don't know the specifics — that's a Project Seed. Only use Clarify when the item's words don't give you enough to even guess the domain.

### Cluster Before Filing

Before writing anything, scan all items for related clusters. **Cluster broadly by technology ecosystem, not by sub-domain.** The user evaluates related tools and observations together — multiple repos, tools, discussions, and security notes about the same technology belong in one note, even if they address different aspects. The test: "Would the user want to see these items side-by-side?" If yes, cluster them. Don't split a cluster into sub-topics unless the items are genuinely about different technologies.

If 3+ items cluster under one topic, suggest a MOC (Map of Content). Name it by concept ("Agent Orchestration Patterns") not by tool ("Claude Code Links").

## Outputs

### Obsidian Notes
See [references/examples.md](references/examples.md) for the template. Key things: include frontmatter tags, preserve original inbox text verbatim in source links, suggest filing location based on vault structure (check `~/ws/notes/` and `_agent/Idea-Places.md` for routing).

### Todoist Actions
Verb-first task title. Add `📎 See also: [[Note Title]]` if there's a related Obsidian note.

**Project assignment priority:**
1. When an item involves communicating WITH a known person (telling them, sending them, following up with them), use that person's project association as the PRIMARY signal — stronger than keywords. Note: feedback FROM a person doesn't trigger this rule.
2. When keywords point to a project domain, use that.
3. When neither applies, default to Everything AI for technical content.

**Active projects (annotated):**
- **Everything AI** — Agent orchestration platform. Domain: agents, orchestration, LLMs, prompts, tool use, MCP, Claude Code. Key contacts: Chen-Chen, Raiya, Anar.
- **Demo Day** — Event planning. Domain: venue, logistics, presentations, audience.
- **Manage Finances** — Financial ops. Domain: subscriptions, billing, taxes, equity, Brex.

### Triage Report
The master document. See [references/examples.md](references/examples.md) for the full template. Includes: projects confirmed, summary stats, actions table, references table, clusters, clarifications needed, MOC suggestions.

## Principles

- **Bias toward reference.** "I should look into this someday" is a note, not a task. Feedback from someone is reference, not action.
- **Preserve raw captures.** The original text has context that clean titles lose.
- **Don't over-organize.** No clear cluster → standalone note. Don't force taxonomy.
- **Surface project connections.** If a reference relates to an active project, note it — but still file as reference unless there's a clear action.
- **80% confidence rule.** Confident → proceed and flag reasoning. Not confident → Clarify.
- **Primary domain default.** The user's main project (Everything AI) covers most technical content. Only flag for clarification when something clearly belongs elsewhere.

## After Triage

This skill improves from corrections. After the user reviews output, follow the `prompt-self-improvement` skill. Domain-specific correction examples: [references/scenarios.md](references/scenarios.md).

## Related Skills

- **para-index** — System IDs across Todoist/Notion/Obsidian
- **todoist** — CLI operations (`td` commands)
- **idea-capture** — Real-time single-idea capture (this skill does batch)
- **prompt-self-improvement** — Improvement protocol for corrections
- **coach** — Daily startup/shutdown surfaces items for triage

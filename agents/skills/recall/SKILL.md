---
name: recall
description: >-
  Semantic search over past conversations, notes, skills, and knowledge atoms
  using agent-recall. Use when facing strategic decisions, architectural
  questions, or complex problems where prior context would help. Triggers on
  "last time", "before", "we discussed", "do you remember", "how did we",
  "what was the reason", or when stuck after initial investigation yields no
  clear path. Also use when you suspect a similar problem was solved before,
  when the user describes a workflow you may have helped build previously, or
  when making a decision that feels like it should have prior art. Don't
  search for things already visible in the current conversation or answerable
  by reading the codebase directly.
---

# Recall

Search past conversations, notes, skills, and knowledge atoms before
reinventing. Searching costs seconds; repeating mistakes costs hours.

## When to Search

**After understanding the task**, dispatch a search when:

- **Strategic questions** — "how should I...", "what's the best approach for..."
- **Historical references** — user mentions "last time", "before", "we discussed", "you implemented"
- **Architectural decisions** — you've explored the codebase and need to decide on an approach
- **When stuck** — investigation yields no obvious solution and you suspect prior art exists
- **Workflow questions** — "why did we...", "what was the reason for...", "do you remember..."
- **Pattern recognition** — the problem feels familiar or you're about to build something that may already exist

**Don't search when:**

- The answer is in the current conversation
- A codebase read/grep will answer it faster
- The question is purely about current file contents
- You haven't yet understood what you're being asked (understand first, then search)

## How to Search

**Always dispatch a subagent.** Running agent-recall inline wastes main context
with raw results. The subagent reads, synthesizes, and returns only what matters.

```
Agent tool:
  subagent_type: "general-purpose"
  description: "Search recall for [topic]"
  prompt: |
    Run this command and synthesize the results:

    agent-recall search "[query]" --scope [scope] --json -k [k]

    Context: [what you're looking for and why]

    Instructions:
    1. Run the search command above
    2. Read the top results carefully
    3. Return a 200-800 word synthesis of what you found:
       - Key decisions, patterns, or solutions from prior work
       - Relevant context (dates, projects, what was tried)
       - Anything that directly answers or informs the current question
    4. If results are sparse or irrelevant, say so plainly
    5. Do NOT return raw JSON — synthesize into actionable insights
```

## Choosing Scope and Query

| Scope | What it searches | Use when |
|-------|-----------------|----------|
| `conv` | Claude Code + Codex conversation history | "Last time we...", prior decisions, debugging sessions |
| `notes` | Obsidian vault (`~/ws/notes/`) | Ideas, plans, meeting notes, journal entries |
| `skills` | Skill files (`~/.dotfiles/agents/skills/`) | "Do we have a skill for...", capability questions |
| `atoms` | Knowledge atoms (`~/.dotfiles/agents/knowledge/atoms/`) | Reusable patterns, reference facts |
| *(omit)* | All of the above | Broad searches, unsure where to look |

**Query tips:**

- Use natural language, not keywords — the search is semantic (embeddings-based)
- Be specific: "how we handled auth token refresh in the API" beats "auth"
- For broad exploration, omit `--scope` to search everything
- Default `-k 8` is usually fine; use `-k 15` for broad exploratory searches

## Multiple Searches

For complex questions, dispatch 2-3 parallel searches with different scopes or
angles. For example, when deciding on an architecture:

1. Search `conv` for prior discussions about the same system
2. Search `notes` for any design docs or ideas
3. Search `atoms` for established patterns

## What Good Recall Looks Like

The subagent should return something like:

> Found 3 relevant prior conversations. In Feb 2026, you built a similar
> queue system for the voice pipeline using BullMQ with Redis — the key
> decision was choosing BullMQ over a custom solution because of built-in
> retry and dead-letter support. You also discussed rate limiting in that
> context and decided on token-bucket over sliding window. The Obsidian
> vault has a design note on queue patterns at `2-Areas/System/...`.

Not a dump of raw search results.

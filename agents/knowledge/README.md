# Knowledge System (Progressive Disclosure)

Goal: reach correct, working outcomes efficiently by keeping the always-loaded surface area small, while still retaining deep context when needed.

## Structure

- **L0 (always present)**: root instruction files (ex: `claude/CLAUDE.md`)
- **L1 (entrypoints)**: a bounded set of skills in `agents/skills/*/SKILL.md`
  - "When to use" should be in YAML `description` (high signal, short)
  - Entrypoints may link out to deeper docs when needed
- **L2+ (deeper details)**: notes in `agents/knowledge/atoms/` referenced by entrypoints

## Hop Cost (Time + Risk)

Every additional "hop" (entrypoint -> skill -> referenced doc -> referenced doc) increases:

- Risk of missing the right instruction
- Time to find the needed detail

Use hop cost as a first-class signal:

- If something is frequently missed or high-risk, **promote** it up (fewer hops).
- If something is rarely needed, **demote** it down (more hops).

## Promotion Protocol (Learning Without Context Pollution)

When a mistake happens or a process is repeatedly expensive:

1. Capture the smallest durable learning in an atom (symptoms, root cause, fix, verification).
2. Link it from the most relevant entrypoint.
3. If it recurs, promote the key guardrail up a hop (atom -> entrypoint -> L0).
4. If the system becomes noisy, merge/prune atoms and simplify entrypoints.

## Experiments

Changes to this system should be treated as experiments:

- State a hypothesis (what will improve: fewer misses, faster recovery, less drift).
- Make a reversible change.
- Observe results (even informally).
- Keep repo clean (no stray artifacts).

See: `agents/knowledge/protocols/memory-experiments.md`.

## Semantic Recall (Conversations)

When you're stuck, repeating a mistake, or suspect you've solved something before, use local semantic recall to search prior prompts/outputs:

```bash
agent-recall search "your query"
```

This searches across:

- `~/.claude/history.jsonl` (Claude Code prompts)
- `~/.codex/history.jsonl` (Codex prompts/outputs)

Use this to reduce hop-cost: find the prior context quickly, then capture the durable part as an atom or promote a guardrail.

## Future Improvements

Ideas to improve the memory system over time (not implemented yet):

- Out-of-band procedural memory updates: periodically run a background job that reviews logs/evals/mistakes and proposes/promotes/demotes memory items without blocking interactive work (there is an implementation pattern in a third-party repo; note for future integration).
- Expand eval coverage: add more suites for high-risk workflows (git safety, secrets, delegation handoffs) and track timing trends for regressions.
- Automated hop-cost promotion tooling: detect repeated misses and suggest moving key guardrails up a level (atom -> entrypoint -> L0) with minimal diff.

---
tags: [memory, graph, retrieval, process]
updated: 2026-02-09
---

# Knowledge Graph Optimization (RME-Driven)

Goal: keep memory usable and adaptive (not “static entrypoints”) by treating knowledge as a directed graph, logging retrieval misses, and rebalancing with small, reviewable edits.

## Model

### Nodes

A node is a knowledge artifact:
- L0: system prompt roots (e.g. `claude/CLAUDE.md`, project `CLAUDE.md`, AGENTS instructions)
- L1: entrypoint skills/commands (bounded)
- L2+: atoms, repo docs, notes (unbounded)

Each node has:
- `content` (text)
- `length` (bytes/tokens)
- `out_edges` (links/hops to other nodes)
- `labels` (the text that helps route to edges; for L1, the YAML `description` is the highest-leverage label)

### Edges

Directed edges represent a hop from one node to another (link/reference).
- For skills: root -> skill is a 1-hop edge.
- For skills linking atoms: skill -> atom is an edge.
- For repo notes: wikilinks are edges.

The graph is not acyclic; that’s fine.

### Source Node

The “root” is the always-loaded prompt surface:
- L0 text
- plus the set of L1 skill descriptions (edge labels for routing)

## Constraints (Budgets)

Budgets exist to prevent overload and keep routing reliable:

- Entry points: `|out_edges(root)| <= 20` (enforced by repo lint today).
- Proposed: `|out_edges(v)| <= 20` for *all* nodes (soft constraint).
  - When a node exceeds 20 outgoing links, create an index node (README/MOC) and link through it.

Length constraints (current + recommended):
- Enforced today: `claude/CLAUDE.md <= 40000 bytes` (hard).
- Recommended:
  - L1 SKILL.md: keep “routing” section small (the rest can link out).
  - Atoms: keep one idea per atom; split if it becomes hard to scan.

## Objective

Minimize expected “time-to-correctness” over sessions while maintaining high recall.

Intuition:
- A user query is routed through edges to the needed node(s).
- Bad routing = Retrieval Miss Error (RME) = time loss + mistakes.
- We improve by adjusting **edge labels** and **graph distance** for high-value knowledge.

## Retrieval Miss Error (RME)

An RME is logged when any of these happen and the cost is non-trivial:

1. **Routing failure**: the root/L1 surface did not contain enough cueing to route to the right node.
2. **Tool stumble**: we fumble a tool/command that should have been retained (e.g. timezone defaults).
3. **Missed prior solution**: a previous conversation/atom/note contained the fix, but we didn’t retrieve it.

## Fix Operators (Small, Reversible)

When an RME occurs, pick the smallest operator that prevents recurrence:

1. **Relabel** (highest leverage):
   - Update the L1 `description:` (edge label) to include the trigger words that would have routed correctly.
   - Add 1-3 bullet cues near the top of the relevant entrypoint.
2. **Add an edge** (reduce hops):
   - Link the target node from a closer node (often an entrypoint) if it’s a repeated RME.
3. **Promote** (reduce distance-to-root):
   - Move a key guardrail from atom -> entrypoint -> L0 *only when repeated*.
4. **Split**:
   - If a node is too long or has >20 outbound links, split into multiple atoms or add an index node.
5. **Merge**:
   - If two nodes answer the same query, merge and keep one canonical.

## Rebalancing Cadence

- Immediate: after a meaningful RME (same session).
- Weekly: propose 1-5 edits based on RMEs and high-cost lookups.
- Monthly: merge duplicates; retitle nodes for better retrieval.

## Optional “LLM Review” on Skill/Atom Commits (Approval-Gated)

Sometimes you want a “loose criteria” sanity check (clarity, duplication, routing cues).
Implement as a pre-commit step that only runs when explicitly enabled:

- `AGENTS_LLM_REVIEW=1` → run LLM review script
- optional `AGENTS_LLM_REVIEW_STRICT=1` → fail commit on “fail” verdict

Keep it opt-in so it doesn’t create process drag.


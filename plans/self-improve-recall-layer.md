---
status: active
owner: michael
created: 2026-07-01
slug: self-improve-recall-layer
summary: Wire the READ half of the self-improvement loop — fresh, automated semantic recall (agent-recall) over sessions/mistakes/skills/memory, invoked by the reviewer, curator, and live sessions. Companion to self-improve-mistake-eval-loop.md (the WRITE/verify half).
---

# Self-Improve Recall Layer (retrieval + data access)

**Origin (2026-07-01):** Michael: "I feel like you probably don't have enough semantic search or eval stuff around this self improvement loop and data access." Researched via 4 parallel agents (hermes source, agent-recall audit, session mining, external SOTA). Verdict: instinct correct on both fronts. Eval side already planned in `plans/self-improve-mistake-eval-loop.md`; **this plan adds the missing READ half**.

## L0 — one sentence
The hermes port took only the *write* half (capture + curate); this plan wires the *read* half — a fresh, auto-indexed `agent-recall` that the SessionEnd reviewer, weekly curator, and live sessions actually query — so "has this happened before / does this overlap" becomes a lookup, not a guess.

## Evidence (all verified 2026-07-01, agent reports in session 44ff9820)

**agent-recall (`bin/agent-recall` → `agents/recall/agent_recall/__main__.py`) works but is orphaned:**
- Live test: `search "hermes eager skill creation"` → found the Jun 27 hermes session (score 0.807); `search "rescheduling tasks without checking destination day load"` → found the Jun 30 miss in session 7763fabf (0.784). The tool is good.
- **Cache was 19 days stale** (built 2026-06-12) — missed both sessions Michael asked about until reindexed. **No cron/launchd/hook reindexes it; manual only.** Full reindex = 68s; search ≈ 70–82s (fastembed model load dominates).
- **Not in sources:** `~/.dotfiles/claude/memory/` (wiki), `~/.claude/mistakes.jsonl`, `claude/logs/skill-review-*.log` (`.log` suffix categorically excluded). Config: `~/.agents/recall/config.json`. Both subcommands support `--json` + `--scope` — already reviewer/runner-callable.
- Noise bug: the live session indexes/searches itself (top hit for one test was the just-run command echoed back).

**Proof retrieval changes outcomes (from reviewer logs + mistakes.jsonl):**
- `guide.not_consulted` logged 3× (2/18×2, 2/23) before anyone noticed the recurrence.
- `email.status_from_snippets` (6/29) = recurrence of the 6/27 email-reply-style fix, caught only by luck.
- skill-review-20260701 log *skipped* the leaked-OPENAI_API_KEY incident on an **unverified** "already governed" claim — no lookup confirmed it.
- skill-review-20260630 log flagged positioning-copy/email-reply-style/writing overlap as a prose note "for the weekly curator" — no mechanism to act on it.
- The reviewer prompt itself greps transcripts blind because they exceed Read's 256KB limit.

**Hermes comparison (`~/ws/hermes`):**
- Its biggest unported piece: `tools/session_search_tool.py` — a first-class FTS5 **session_search tool the agent calls mid-conversation** (SQLite `messages_fts`, `hermes_state.py:692`). Pure FTS, no embeddings, no LLM calls. agent-recall ≈ same idea but unwired.
- Hermes has **no correctness evals** — our red→green plan exceeds it. What it has that we lack (cheap, portable): per-skill **usage/decay tracking** (`tools/skill_usage.py`: view/use/patch counts → active→stale→archived; we already collect `~/.claude/skill-firing.jsonl`!) and a **curator dry-run preview** (`agent/curator.py:1434`).
- Hermes core memory = flat-file injection (like CLAUDE.md); vector layer (Mem0) is an optional plugin even upstream. Embeddings-by-default is NOT required for this class of system.

**External SOTA (mid-2026):**
- Native Auto Dream searches transcripts with **grep, not semantics** — agent-recall is not redundant with native features.
- Best access pattern (obra/episodic-memory): **3 layers — search tool + "when to search" trigger skill + a small retrieval subagent (Haiku) that absorbs context bloat** from recalled conversations. We have layer 1 (CLI) and layer 2 (`recall` skill); layer 3 missing.
- **ACE (arxiv 2510.04618):** LLM full-file rewrites cause *context collapse* (detail erosion). Curator should append structured deltas + deterministic merge. Directly applicable to our weekly Opus curator.
- **SkillAxe** (arxiv 2606.10546) = published analog of the red→green plan; **SkillsBench** finding: skill benefit decays in realistic settings and agents fail to *pick* the right skill — so evals must measure **whether the skill fires**, not just force-loaded correctness. `skill-creator` already ships an eval/variance mode — use it, don't hand-roll.
- Unbuilt asks from the Jun 27 hermes session (e54f3e9a): Honcho setup (install failed twice, abandoned), background entity/rule extraction, cross-session global-traits mining, temporal/confidence discipline in memory. The first three are largely satisfied by this plan + native auto-memory; Honcho = skip for now (local-first, no new infra).

## Phases (leverage-ordered; R0 is one sitting)

### R0 — Freshness + coverage (mechanical; unblocks everything)
1. Add to `~/.agents/recall/config.json` sources: `~/.dotfiles/claude/memory/`, `~/.claude/mistakes.jsonl`. For skill-review logs: emit a per-run JSONL digest line (reviewer wrapper) instead of indexing `.log` files — cleaner than widening the suffix filter.
2. Automate reindex: append a detached `agent-recall index` to the existing SessionEnd wrapper (`self-improve-skill-review.sh`) — 68s, off critical path, recursion-guard already exists there. (Fallback: daily launchd.)
3. Fix self-contamination: `search --exclude-session <id>` flag (skip records from the current session id).
4. Perf note: ~70–80s/search is fastembed model load; consider keeping a warm daemon or `--fts-only` fast path later. Not blocking.

### R1 — Access layer (episodic-memory 3-layer pattern)
- Layer 3: retrieval subagent — a small "recall and summarize" agent (Haiku/Sonnet) the main session dispatches so recalled transcripts never bloat the main context. Encode in the existing `recall` skill.
- Sharpen the `recall` skill trigger with the capture-time cases this research surfaced ("logging a mistake", "creating/patching a skill", "claiming something is already covered").

### R2 — Wire recall into the loop (the actual point)
- **Reviewer (capture time):** before logging a mistake or creating a skill, MUST run `agent-recall search --json` over mistakes+skills+sessions: (a) recurrence → escalate per mistake-tracking ladder instead of logging fresh; (b) "already governed" claims must cite a search hit, not an assertion; (c) near-duplicate skill → patch instead of create. Needs Bash for the reviewer wrapper or a pre-computed recall bundle handed into the prompt (reviewer is file-tools-only — same seam as eval plan's reviewer/runner split; recommend: wrapper pre-runs 2–3 searches and injects results).
- **Curator (weekly):** overlap detection becomes queries; adopt hermes-style usage counters from `~/.claude/skill-firing.jsonl` (active→stale→archived), **dry-run preview mode**, and ACE delta-merge discipline (append deltas, deterministic merge; no full-file rewrites).

### R3 — Eval integration (joins `self-improve-mistake-eval-loop.md`)
- Regression suite runner uses `skill-creator`'s native eval/variance mode for judging.
- Add **trigger evals**: does the skill *fire* from a cold scenario (SkillsBench lesson), not just behave when force-loaded. This also serves CLAUDE.md's "verify the trigger with a fresh subagent" rule.

## Non-goals
- No Honcho / Mem0 / claude-mem / new vector store — agent-recall + native auto-memory cover the store; revisit only if FTS+rerank proves insufficient.
- No per-turn hooks (eval plan Phase 4 stays reserve).
- Devbox deferral unchanged (eval plan §7.6).

## Goal-loop prompt (ready to paste)

> **Goal: wire the recall layer into the self-improvement loop (plan: `plans/self-improve-recall-layer.md`).**
> Work phase-by-phase (R0 → R1 → R2 → R3); each phase = small reviewed commits, verified before moving on. Definition of done per phase:
> - R0: `agent-recall` reindexes automatically after sessions; mistakes.jsonl + memory wiki indexed; a search for a same-day session finds it; current-session self-hits excluded.
> - R1: a live session can answer "have we hit this before?" via a retrieval subagent without >1k tokens of transcript entering main context.
> - R2: reviewer log shows a recurrence check ran (with query + hit/no-hit) for every mistake/skill decision; curator supports dry-run and consumes skill-firing usage data.
> - R3: at least one skill has a passing *trigger eval* (fires from a cold scenario) registered in the regression suite.
> Constraints: don't touch the working reviewer/curator behavior except additively; scoped commits only; follow the eval plan's invariants (red-gate, off-critical-path); all mechanical fleet agents on sonnet, judgment on opus.

## Cross-refs
- `plans/self-improve-mistake-eval-loop.md` — WRITE/verify half (capture → red→green eval → regression → digest). R2/R3 here plug into its Phases 1–3.
- `claude/self-improve.md` — current loop doc; update its Components table when R0/R2 land.
- Agent reports (hermes-code, recall-audit, session-miner, external-research) delivered in session 44ff9820, 2026-07-01.

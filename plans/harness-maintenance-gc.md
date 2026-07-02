---
status: active
owner: michael
created: 2026-07-01
slug: harness-maintenance-gc
summary: Recurring cleaning/GC for the self-improving harness — extend the existing SessionEnd reviewer + weekly curator with per-artifact lifecycle policies (delta-merge, usage decay, structural supersession, replay-tests). No parallel GC system.
---

# Harness Maintenance / Garbage Collection

**Origin (2026-07-01):** Michael: "we can't just add stuff autonomously without cleaning." Deep-research run `wf_a7e126fc-18e` (107 agents, 24 sources, 25 claims → 24 confirmed 3-vote adversarial, 1 refuted). Full cited report: session 44ff9820 task output; key citations inline below.

## The research verdict (what's proven vs. directional)

1. **The premise is validated (high confidence).** Self-improvement is *non-monotonic*: purely additive accretion erodes previously-acquired capability across workflow, skill, AND memory channels; static guardrails don't prevent it. GC is structurally required, not hygiene. (arXiv 2605.09315 — CPE; 2606.21090 — rise-then-collapse.)
2. **Never curate via full-file LLM rewrites.** "Context collapse" is the canonical anti-pattern: an 18,282-token context collapsed to 122 tokens in one monolithic rewrite step, accuracy below no-adaptation baseline. Curation = small addressable deltas + deterministic (non-LLM) merge + embedding dedup. (ACE, arXiv 2510.04618.) ⚠️ Our weekly curator currently does LLM rewrites of skill files — this is our biggest exposure.
3. **Adds must be evidence-gated, conservative-by-default.** Three-way routing: extend-existing-via-smallest-diff / create-only-for-out-of-boundary / skip. Only successful, reusable evidence authorizes an edit; repeated observations merge into ONE proposed change. (SkillsVote 2605.18401, SkillOS 2605.06614, Audited Skill-Graph 2512.23760.)
4. **Keep/prune = usage signals + periodic replay-tests.** Per-entry helpful/harmful counters; time-decay for unused entries (LeanCTX defaults: 0.01/day decay, 30d stale, 90d archive); re-run the SAME tests that justified promotion to catch rot. Soft archival, never auto-delete.
5. **Conservative + frequent-incremental beats batched-aggressive** consolidation (arXiv 2606.24775). Dual cadence: cheap incremental pass often + heavier consolidation on a slow schedule — which is exactly our existing SessionEnd + weekly shape. Extend it; don't add a third system.
6. **Contradiction/staleness detection must be structural, not embedding-similarity.** Cosine similarity separates contradiction from duplicate at AUROC 0.59 (chance); similarity+LLM-judge gates leak stale facts 25–60%. Structural supersession — same (subject, relation) key, different object, newer wins — drives stale-fact error to ~0%. (arXiv 2606.26511.)
7. **Refuted (0-3), don't build on it:** "single-scalar optimization systematically causes hidden regressions elsewhere." Track more than usage count because of finding 1, not this.

**Caveats:** mostly 2025–2026 preprints; degradation results are from RL/benchmark settings — mechanism analogy to a markdown harness, not direct evidence. LeanCTX constants are defaults, not calibrated for a low-volume single-user harness.

## Architecture: two existing cadences, upgraded — no new system

### Cadence A — Session end (exists: reviewer). Incremental, cheap.
- Reviewer keeps capturing (skills + mistakes — Phase 1 shipped) under the **three-way routing gate** (its preference-order already approximates this; codify admissibility: corrections/verified techniques only, one merged proposal per learning).
- `agent-recall index` refresh (recall plan R0) — incremental at session end; full rebuild weekly (answers the coupling question).
- Emit/update health JSON counters (eval plan Phase 0 digest).

### Cadence B — Weekly curator (exists; MOVE to Friday night ~21:00 per Michael 2026-07-01, so output lands before Saturday weekly review). Upgrade, in order:
0. **Weekly self-improvement report → Todoist inbox (Michael's explicit ask, do first).** Each Friday-night run compiles: sessions this week (count, notable ones), skills created/patched/archived (with the reviewer's one-line summaries), mistakes logged + recurrences, eval/regression status, notable insights, and budget/health counters — and files it to the Todoist inbox via `td` CLI (`TODOIST_API_TOKEN` in `~/.env.zsh`; task due Saturday, report body in description or a linked file) so it surfaces in the Saturday weekly review. Data sources already exist: skill-review logs, git log, mistakes.jsonl, skill-firing.jsonl, reviewed/ markers. This absorbs the eval plan's Phase 0 digest as its weekly rollup.
1. **Usage-decay lifecycle.** Feed `~/.claude/skill-firing.jsonl` (already collected!) into active→stale (30d unused)→archived (90d) transitions. Archived = moved out of the loaded set, recoverable, never deleted. Pinned skills exempt. This also manages the 16k description budget structurally instead of by lint failure. [Michael: approved direction.]
2. **Rewrite-safety, right-sized (DOWNGRADED from "delta-merge engine" after Michael pushback).** The research risk (ACE "context collapse": an LLM asked to rewrite a whole knowledge file can return a drastically shorter one, losing detail) is real but our exposure is low: every curator change is a git commit, so collapse is visible in the diff and revertible. So: no merge engine. Just (a) curator rule "make targeted Edits; never regenerate a whole file", (b) dry-run proposal report reviewed before apply, (c) a guard in the wrapper flagging any single-run shrink >40% of a file for the weekly report instead of auto-committing it.
3. **Structural supersession pass** over CLAUDE.md bullets + memory wiki: extract (subject, relation)-style rule keys; same key + conflicting guidance → newer supersedes, older archived to a graveyard section with date. Deterministic where possible; LLM only for triple extraction from prose (open question from research — start crude: per-topic bullet keys).
4. **Mechanical sweeps** (deterministic, no LLM):
   - Hooks: smoke-test every command hook (sample payload → exit 0 + valid JSON); flag orphans (wired-but-missing script, script-but-not-wired).
   - Plans: `status: active` with no referencing commits in 21d → flag in digest for park-or-close (park-with-review-time rule).
   - Workflow templates: model-policy lint (no unset model in fleet agent() calls — caught live 2026-07-01 when deep-research defaulted its 107 agents to Fable).
   - Size budgets: CLAUDE.md line count, skill-description total, MEMORY.md caps — report headroom in digest.
5. **Replay-test retained skills** (once eval plan Phase 3 / replay-eval harness lands): re-run the regression set weekly; pass→fail flip = rot caught. Minimal viable version = the replay-eval tool currently being built + the 3 already-logged mistakes' evals.

### Measurement (digest = the one surface, eval plan Phase 0)
Per week: skills active/stale/archived counts · adds by route (extend/create/skip) · CLAUDE.md + description-budget headroom · supersessions applied · orphan hooks · stale plans · regression flips (target 0) · repeat-miss rate (target ↓).

## Sequencing
1. Move curator to Friday night + weekly report → Todoist inbox (Michael's ask; one sitting; touches `self-improve-skill-curator.{sh,md}` + launchd plist).
2. Usage-decay lifecycle + shrink-guard + dry-run (same files).
3. Mechanical sweeps script (deterministic, easy), feeding the report.
4. Supersession pass (needs key-extraction design; Michael not yet sold — propose with examples first).
5. Replay-test wiring (blocked on replay-eval harness — in flight).

## Non-goals
- No new daemon/third cadence; no auto-delete anywhere; no embedding-based contradiction detection; auto-dream keeps owning auto-memory files.

## Cross-refs
- `plans/self-improve-mistake-eval-loop.md` (digest, evals), `plans/self-improve-recall-layer.md` (index freshness), `claude/self-improve.md` (update Components when this lands).

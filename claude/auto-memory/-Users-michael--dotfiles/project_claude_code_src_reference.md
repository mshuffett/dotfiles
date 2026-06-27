---
name: Anthropic's shipped vs. unshipped self-improvement machinery
description: What Claude Code v2.1.87 source shows for skill/memory self-improvement, vs. what actually ships in the installed binary (verified 2026-04-20 against v2.1.116). Use this before reinventing.
type: project
originSessionId: 09dbaba4-9056-4d05-a0a4-fa8bb41f478d
---
## Where to look

- Source dump: `~/ws/claude-code-src/` (v2.1.87, March 2026). `FEATURE_FLAGS.md` + `HIDDEN_FEATURES.md` catalog all 96 build flags; `src/_shims/bun-bundle.ts` is the flag set.
- Installed binary: `/Users/michael/.local/share/claude/versions/<version>` — single bundled JS file, inspectable via `strings <binary> | grep <marker>`.
- Build-time `feature('FLAG')` is dead-code-eliminated in the public npm build — any zero-hit grep means that feature is stripped, not just disabled.

## What SHIPPED (present in installed binary)

- **`autoDream` — automatic memory consolidation.** Gated by GrowthBook `tengu_onyx_plover`. Gate order (cheapest first): time (min 24h since last consolidation) → session count (min 5 sessions since last) → lock file. Runs as forked subagent. The 4-phase prompt (Orient → Gather → Consolidate → Prune) is embedded in the binary.
- **Auto-memory type taxonomy:** `user`, `feedback`, `project` in binary (3 types; `reference` appears in source but seems trimmed in shipped prompt).
- **`findRelevantMemories`** — Sonnet-based relevance selector, picks ≤5 memories per query by scanning file headers.
- **`truncateEntrypointContent`** — MEMORY.md capped at 200 lines AND ~25KB. Line cap first, then byte cap at last newline boundary.
- **Team memory (`team/` subdirectory)** — shared across sessions on shared repos. Specific "be conservative pruning" instructions for team memories.
- **Staleness handling** — explicit instructions in the system prompt: "Before answering, verify memory is still correct… trust what you observe now — delete the stale memory file."

## What DID NOT ship (stripped from public build)

Verified by `strings <binary> | grep`: zero hits for any of these.

- **`SKILL_IMPROVEMENT` / `tengu_copper_panda`** — automatic skill self-improvement. Reference implementation at `src/utils/hooks/skillImprovement.ts` (267 lines).
- **`EXTRACT_MEMORIES`** — background memory extraction from conversations. Source at `src/services/extractMemories/` (615 + 154 lines).
- **`MEMORY_SHAPE_TELEMETRY`** — tracking which memory files are accessed and in what sequence. Used to rank relevance.
- **KAIROS\*** — the whole autonomous agent framework. Kairos is the internal codename for the daemon/brief-mode stack.

## Design patterns worth borrowing

1. **TURN_BATCH_SIZE = 5**: their skill-improvement hook runs every 5 user messages, not every turn. Good cadence for our `reflect`-style analysis.
2. **Specific trigger vocabulary in the prompt** (from `skillImprovement.ts`):
   - Look for: "can you also ask me X", "please do Y too", "don't do Z"
   - Preferences: "ask me about energy levels", "note the time", "use a casual tone"
   - Corrections: "no, do X instead", "always use Y", "make sure to…"
   - Ignore: routine conversation that doesn't generalize, things the skill already does

   Worth copying into our `reflect` system prompt — more specific than what we currently have.
3. **Scoped to project skills only** — Anthropic's skill-improver explicitly looks only for `projectSettings:` skills (`findProjectSkill()`). Never touches user-level or canonical skills. Our tool targets canonical, which is a higher-risk surface; review gate is therefore not optional.
4. **Separation of detect and apply** — `initSkillImprovement()` runs detection post-sampling. `applySkillImprovement()` is a separate function that rewrites the file via side-channel LLM, fire-and-forget. We already do this via proposal queue + manual apply.
5. **Cheapest-gate-first ordering** (from `autoDream`): time → session-count → lock. Apply this pattern to any periodic job we add.
6. **Full-file rewrite for apply, not diff** — Anthropic's apply step passes the current file + improvement list to a model, asks for the full updated file inside `<updated_file>` tags, writes it. Preserves frontmatter. Different from our proposal-diff approach; theirs is more robust to small edits, ours is more reviewable.

## What OUR build does that Anthropic's doesn't

- **Historical mistake-corpus replay** — our `skill-profile replay` tests edits against past known failures. No equivalent in the source.
- **Explicit evaluation harness (RED/CANARY/NEIGHBOR) per skill** — not present.
- **Diff-based proposals as reviewable files** — Anthropic's goes directly from detect → apply via full-file rewrite. Ours has a review gate.
- **Archive-aware filtering** — they don't have this convention.
- **Plugin toggle management** — their `enabledPlugins` is a simple setting; we compose it through profile hierarchy.

## Lessons that should update what we built

1. **Our `reflect` prompt should copy Anthropic's trigger vocabulary** — more concrete than what we're using now.
2. **Our firing telemetry is turn-level; Anthropic's batch-size-5 is probably right** for skill-improvement analysis specifically. If we add automatic `reflect`, don't run per turn.
3. **Memory consolidation is a separate concern from skill improvement** — Anthropic ships the former and not the latter. We should not conflate them in our system (we haven't, but the distinction is worth keeping).
4. **Staleness detection is missing from our build** — we verify skill descriptions via replay, but don't have a periodic check that memory files still match reality. If we build this, the pattern is: periodic scan + "does this still hold?" subagent prompt per memory.
5. **The 4-phase consolidation prompt** (Orient → Gather → Consolidate → Prune) is a well-tested shape. If we ever add an auto-consolidate step to our skill-proposals flow, borrow this structure.

## How to apply

- Before adding any new "self-improvement" machinery, check here first and against `~/ws/claude-code-src/`. Don't reinvent what's already shipped or already-designed-but-stripped.
- If you run `strings <binary>` and find a new marker, it means Anthropic enabled it for a rollout — update this file.
- Our system is complementary to Anthropic's, not a replacement: they consolidate memory automatically; we propose skill edits with review.

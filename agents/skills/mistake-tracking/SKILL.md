---
name: mistake-tracking
description: "Log, analyze, and prevent recurring mistakes. Use when: (1) a mistake or near-miss occurs (self-detected or user-detected), (2) session start/end review of recent patterns, (3) user asks to review or analyze mistakes, (4) after any corrective action to verify the fix was logged. Covers logging JSONL events, running RCA, promoting/demoting guardrails, and testing prevention."
---

# Mistake Tracking

Each mistake is an iteration on the prevention system. The goal is not just to log what happened, but to make the system better at catching the next one.

**Cycle**: detect → understand → fix the system → test the fix → monitor

## Files

- Global log: `~/.claude/mistakes.jsonl`
- Project log: `<repo>/logs/mistakes.jsonl`
- Analysis script: `scripts/analyze-mistakes.sh`
- Validation script: `scripts/log-mistake.sh`
- Known patterns: [references/common-antipatterns.md](references/common-antipatterns.md)
- Testing guide: [references/testing.md](references/testing.md)
- Eval scenarios: `evals/evals.json`

## 1. Detect & Log

When a mistake or near-miss occurs, use the validation script to log it:

```bash
scripts/log-mistake.sh '{"ts":"2026-02-23T00:00:00Z","repo":"~/ws/example","mistake_id":"guide.not_consulted","scope":"global","detector":"user","notes":"what happened","action_taken":"what systemic change was made"}'
```

The script validates required fields and `mistake_id` format before appending. It rejects malformed entries.

**Required**: `ts`, `mistake_id` (lowercase dot-separated, e.g. `guide.not_consulted`), `scope` (global|project), `detector` (self|user), `notes`
**Recommended**: `type` (mistake|near-miss|violation|learning), `severity` (critical|high|medium|low), `action_taken`, `repo`, `guide`, `condition`

Before logging, check [references/common-antipatterns.md](references/common-antipatterns.md) — if it matches a known pattern, reuse the existing `mistake_id`.

## 2. Understand Why the System Missed It

This is the key step. Don't just categorize the mistake — ask why the existing system didn't prevent it:

1. **Was there a guardrail?** If no → the system has a gap. If yes → the guardrail failed.
2. **Why did the guardrail fail?** Too passive? Wrong location? Doesn't match the trigger condition? I rationalized past it?
3. **What's the smallest systemic change that would have caught this?** A stronger guardrail? A new one? A script? A check in a skill?

## 3. Fix the System

Based on the analysis, make a concrete change. Run `scripts/analyze-mistakes.sh` to see if this is part of a pattern:

```bash
scripts/analyze-mistakes.sh              # 14-day window, default log
scripts/analyze-mistakes.sh --days=30    # wider window
```

The script outputs promotion candidates automatically. Act on them:

**Promote** (when `action_needed: true`):
- First occurrence → improve or create the relevant skill
- 2+ in 14 days, same repo → add Hot Rule to that repo's CLAUDE.md
- 2+ repos in 14 days → add universal guardrail to root `~/.claude/CLAUDE.md`
- **Guardrail already exists but miss recurred** → "already exists" is never a reason to skip. Promote by rewriting the guardrail stronger: passive wording → imperative STOP gate, name the specific failure pattern, increase prominence.

**Demote** (when 14-30 quiet days pass):
- Propose removing one-liner hot rules (the skill/guide remains as canonical source)

Always log `action_taken` in the JSONL event describing the systemic change.

## 4. Test the Fix

Don't assume the fix works — verify it. See [references/testing.md](references/testing.md) for the full procedure.

**For guardrail changes** (CLAUDE.md edits, skill updates):
1. Check `evals/evals.json` for an existing eval matching this `mistake_id`
2. If none exists, create one: write the scenario prompt as the context that triggered the mistake, write expectations that check *process* (did the agent consult X, did it stop at Y)
3. Run the eval — spawn a subagent with the scenario prompt, grade against expectations
4. If it fails → the guardrail is insufficient, iterate (strengthen wording, add specificity, rerun)

**For script/tooling changes**:
1. Run the script against real data (not synthetic)
2. Verify the output catches the pattern that was missed
3. Test edge cases (empty log, old-format entries, boundary dates)

## 5. Monitor

At session start/end, run `scripts/analyze-mistakes.sh`:
- `action_needed: true` → handle before starting work
- New patterns → update [references/common-antipatterns.md](references/common-antipatterns.md)
- Quiet periods (14-30 days) → consider demoting hot rules

## Acceptance Checks

- [ ] JSONL event appended with `action_taken` field
- [ ] `scripts/analyze-mistakes.sh` run, promotion candidates addressed
- [ ] If guardrail existed and failed → guardrail rewritten stronger (not skipped)
- [ ] Fix tested (subagent for guardrails, real data for scripts)
- [ ] [references/common-antipatterns.md](references/common-antipatterns.md) updated if new pattern

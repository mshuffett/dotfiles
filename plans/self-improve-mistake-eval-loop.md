---
status: active
owner: michael
created: 2026-06-30
slug: self-improve-mistake-eval-loop
summary: LOCAL self-improve loop that produces PROOF it improves (red→green eval per mistake) and PROOF it doesn't get dumber (regression suite stays green). Devbox/remote deferred.
focus: local (mac) only — 2026-06-30. Devbox = vast minority of sessions right now; §7.6 deferred.
---

# Self-Improve → Mistake → Eval Loop (methodical plan)

> **Companion (2026-07-01):** `plans/self-improve-recall-layer.md` — the READ half (semantic recall over sessions/mistakes/skills, wired into reviewer + curator). This file remains the WRITE/verify half.

**Constraint from Michael:** plan methodically, *do not make edits yet*. Focus = **local loop + proof**. Devbox/remote consolidation deferred (remote is a small minority now). What Michael wants: *"proof that it actually improves the things we want and catches the bad things."*

---

## ★ CRITICAL PATH (progressive disclosure — read top-down, stop when satisfied)

### L0 — one sentence
Make the local session-end loop, for **every mistake**, emit a **failing eval that then passes once the fix is in** (proof it improves) and keep a **frozen regression suite green** (proof it doesn't get dumber). The output you watch is two numbers: *repeat-misses ↓*, *regression-flips = 0*.

### L1 — the loop (4 steps, all local/mac)
1. **Capture** — at session end, detect mistakes/corrections and log them to `~/.claude/mistakes.jsonl` (today the reviewer captures *skills only* and provably missed the scheduling correction — this is the hole).
2. **Prove-it-improves** — for each mistake, generate an eval reproducing the triggering context, and run it **red→green**: fails against pre-fix behavior, passes against post-fix. The red is mandatory — see the invariant.
3. **Prove-it-doesn't-regress** — run a **frozen regression suite** (known-good scenarios) after each fix; any pass→fail flip = the fix made us dumber → hold/flag it.
4. **Surface** — write the two numbers + what changed to a small health/digest file you can glance at.

### L2 — the load-bearing invariant (this is what makes it PROOF, not vibes)
> **No eval enters the regression suite unless it demonstrably went red→green.**
An eval that passes *without* the fix proves nothing (it never caught the bug). So the runner must checkout the **pre-fix** skill (git parent of the fix commit), run the eval, and **require a failure**; then restore and require a pass. That red→green transition, graded on **process** ("did it pull the destination day's load?"), is the proof. It also blocks the self-grading/reward-hacking failure mode the research flagged.

### L2 — fastest proof available (use data we already have)
We don't need to wait for new mistakes. Three are already logged (`schedule.destination_load_unchecked`, `email.status_from_snippets`, the ai-slop→`positioning-copy` fix) **with their fixes already committed**. Build **one** end-to-end red→green→no-regression cycle on an existing one → that alone is proof the whole concept works. Proposed as the reversible first step / side-test.

### L2 — architecture (what runs where)
- **Reviewer** (existing `SessionEnd` hook, file-tools-only, no Bash): extend to **capture** mistakes → `mistakes.jsonl` + draft an eval. *Cannot run evals* (no Bash/subagent).
- **Runner** (new, Bash + `claude -p` graders; hosted by the existing weekly-curator cron pattern, off any session's critical path): does the **red→green** + **regression** execution and updates the health file. This split is forced by the reviewer's toolset and is the right seam anyway (capture is fast/local; proving is heavier/batched).

Files (for reference — NOT edited yet): `claude/prompts/self-improve-skill-review.md` (capture), `claude/scripts/self-improve-skill-curator.sh` or a new `run-evals.sh` (runner), `~/.claude/mistakes.jsonl`, `~/.claude/skills/mistake-tracking/evals/{evals.json,regression.json}`, new `bin/self-improve-digest`.

### L3 — implications fully accounted (consequences of local-focus + proof-centric design)
1. **Eval fidelity is the whole game.** The "fix" is a skill/prompt edit; the eval only proves anything if the grader subagent has the skill loaded the way a real session does. If the scenario doesn't actually put the skill in context, red→green is meaningless. → Runner must invoke the skill via the real mechanism (or inject the exact skill text) and grade **process signals** (tool calls, stop points), not prose.
2. **Red→green needs the pre-fix state.** Proving an eval catches a bug requires running against behavior *before* the fix. Clean source = the git parent of the fix commit; the runner checks out the pre-fix skill, runs (expect fail), restores (expect pass). → Implies the fix is a discrete commit and the runner is git-aware. For already-logged mistakes this is a past commit; for future ones it's the reviewer's own commit.
3. **Session-end only ⇒ latency between miss and proof.** A mistake made+corrected mid-session isn't caught until session end (backstop), not in-flow. Accepted for now (guarantees capture, unprompted, off critical path). In-flow reflex stays Phase-4/reserve. → No per-turn hook cost paid.
4. **Self-grading risk is real** (research-flagged). Mitigations, all structural: grader ≠ agent-under-test; process-based expectations; and the **red gate** (an eval that can't fail pre-fix is rejected). → The suite is trustworthy *because* every member demonstrably discriminated fix from no-fix once.
5. **Regression suite = cost + curation.** Running N scenarios per fix burns tokens/time. Local + cron ⇒ latency fine; cost bounded by set size. Seed ~8-12 (from the 3 logged mistakes + a few known-good coach/email flows), grow one per new mistake. → `regression.json` is a living asset; digest reports its size + green/flip count.
6. **What "improves the things we want" concretely means here:** the mistake classes *you actually hit* stop recurring. Metric = **repeat-miss rate** over your future corrections (free labels). Not an abstract benchmark — it's grounded in your real usage. → Ties the proof to your lived experience, not a synthetic score.
7. **mistakes.jsonl versioning:** stays `~/.claude/mistakes.jsonl`; recommend symlink+commit into dotfiles so the digest/history is diffable and the runner can git-diff it. Low stakes locally.
8. **Autonomy widening:** the runner autonomously edits `mistakes.jsonl`/`evals.json`/`regression.json` and spawns graders. All local, off-path, scoped commits, reversible — it's *your harness*, not your Todoist/Notion. Flagged, low-stakes, but it's a real widening from "skills-only."
9. **Devbox deferral has a cost:** until the loop runs on the devbox too, remote sessions are uncaptured. Fine now (minority), but the day you flip to always-remote, this must ship first or the loop goes blind. → Tracked in §7.6; not forgotten.
10. **Existing loop keeps running unchanged** during all this — capture/eval/regression are additive. No teardown of the working skill-reviewer; we extend it. (Anti-"kill it" pitfall.)

## 0. What triggered this

Two misses stacked:
1. **Object miss:** during evening-shutdown triage I rescheduled today's tasks onto tomorrow while checking capacity using *only the moved items* — never pulled tomorrow's existing Todoist load. Michael caught it twice (6/29, 6/30). Logged as `schedule.destination_load_unchecked`.
2. **Meta miss (the real one):** the self-correction loop *didn't self-trigger*. I only ran mistake-tracking because Michael told me to. "It also didn't trigger fixing it as well which is a more systemic issue."

Then Michael widened the ask: the **killer app** = "tracking issues or mistakes maybe on session end or day and actually creating evals against them and verifying they would be fixed. **but also verifying it doesn't make it dumber.**" Plus: "I thought that's what we had as an MVP with the self-improvement session-end sessions but **I have no way of monitoring** so that's part of the picture."

## 1. Evidence — current state (verified this session, not assumed)

**The SessionEnd loop IS firing.** 12+ commits `claude: self-improve skill review (session …)`, including this session's segments (7763fabf, 58e81359, 22b40167). Not vaporware.

**It produces real quality.** Latest run (`claude/logs/skill-review-20260630-204314.log`, reviewing session 7763fabf) created a `positioning-copy` skill from the "ai slop" one-liner correction — exactly the kind of durable capture we want.

**But it is unsystematic — proven, not theorized.** That *same* review pass looked at session 7763fabf, explicitly noted the "Todoist triage," captured the **style** correction — and **completely missed the scheduling workflow correction** (`schedule.destination_load_unchecked`), the one Michael cared about most. It grabs the salient learning and drops the operational one.

**Monitoring exists but is buried.** The system already writes:
- `~/.dotfiles/claude/logs/skill-review-<stamp>.log` — full reviewer output, per session (11 logs so far)
- `~/.claude/self-improve/reviewed/<session_id>` — dedupe markers (which sessions were reviewed)
- git commits — the visible outcome, but *only when a skill changed* (silent noops otherwise)
There is no **digest** — so Michael correctly feels blind.

**Architecture reality:** we have **two disconnected systems**:
- `self-improve` (SessionEnd hook → forks Opus, `--allowedTools Read,Write,Edit,Glob,Grep`, **no Bash**, commits only `agents/skills`). Captures **skills only**; memory left to native auto-memory.
- `mistake-tracking` (skill) — already has `~/.claude/mistakes.jsonl`, `scripts/log-mistake.sh`, `scripts/analyze-mistakes.sh`, `evals/evals.json`, a promotion ladder, and a testing procedure. **Nothing feeds it automatically.** I only log by hand, in-flow, when I remember (which is the miss).

**The core insight:** the killer app is ~80% built. The missing piece is the **wire** between these two systems plus an eval-verify stage and a digest. Build only the missing half (harness-engineering).

## 2. Hook capabilities (from online research, 2026 — `code.claude.com/docs/en/hooks`)

| Event | Blocks? | Injects context? | Fit for us |
|---|---|---|---|
| **SessionEnd** | No | No (side-effect only) | ✅ flush/log — what we already use |
| **Stop** | Yes (`decision:"block"`+`reason`, guard `stop_hook_active`) | Yes | real-time "force reflect," but **every turn = critical path** |
| **UserPromptSubmit** | Yes | Yes (`additionalContext`) | fires on the correcting message; **every turn = critical path** |

- **Prompt-type hooks are real** (`type:"prompt"`, on PreToolUse/UserPromptSubmit/Stop) — an LLM can judge "was that a correction?" without a hand-written classifier. But it adds a **full model round-trip (seconds) every turn**, 30s timeout.
- Reflexion / Self-Refine / Generative-Agents invariants all agree: **keep reflection off the critical path, recursion-guard it, reflect on corrections/failures only (not every turn), verify the lesson before persisting, bound memory growth.** These match our existing design invariants.

**Design consequence:** a per-turn LLM hook is the *expensive* answer. Given first-occurrence proportionality (mistake-tracking ladder), keep the reflex at **session-end** for now and hold the per-turn hook in reserve. The session-end backstop already makes "the fixing triggers" guaranteed and unprompted — which is the actual complaint.

## 3. Target architecture

```
   in-session correction/miss                 (Phase 4, reserve: real-time nudge)
             │                                  Stop/UserPromptSubmit prompt-hook
             ▼
   ┌──────────────────────┐  extend prompt  ┌────────────────────────────┐
   │ SessionEnd reviewer   │───────────────▶│ detect corrections/misses   │
   │ (already forks Opus)  │                 │ → append ~/.claude/          │
   └──────────────────────┘                 │   mistakes.jsonl (Phase 1)   │
             │                                └────────────┬───────────────┘
             │ (already) capture skill                     │
             ▼                                              ▼
     agents/skills commit                     ┌────────────────────────────┐
                                              │ generate eval per mistake    │
                                              │ → evals/evals.json (Phase 2) │
                                              └────────────┬───────────────┘
                                                           ▼
                                              ┌────────────────────────────┐
                                              │ VERIFY: run eval vs patched  │
                                              │ skill → must pass (green)    │
                                              │ + REGRESSION set → not dumber│  (Phase 3)
                                              └────────────┬───────────────┘
                                                           ▼
                                              ┌────────────────────────────┐
                                              │ self-improve-digest (Phase 0)│
                                              │ sessions reviewed · skills   │
                                              │ changed · mistakes · eval    │
                                              │ pass/regress — surfaced      │
                                              └────────────────────────────┘
```

## 4. Phased plan (leverage- and risk-ordered)

### Phase 0 — Monitoring digest (do first; read-only, zero risk)
**Why first:** Michael's "no way of monitoring" is the cheapest, highest-immediate-value fix, and it's the observability backbone every later phase reports into. Read-only ⇒ safe under calibration-phase trust rules.

- New durable tool `~/.dotfiles/bin/self-improve-digest` (durable-by-default): reads the run logs + `reviewed/` markers + `git log` (skill-review commits) + `mistakes.jsonl` + eval results, prints:
  - last N sessions reviewed (id, date, turns)
  - skills created/modified (with the one-line SKILL REVIEW: summary the reviewer already emits)
  - mistakes logged (id, severity, action_taken)
  - eval status: added / passing / **regressed** (once Phases 2-3 exist)
  - noop sessions (reviewed, no change) so silence is legible
- Surface it: a line at `/morning` (coach startup already reads state) and/or `claude/scripts` SessionStart. Optionally a `--since` daily rollup.
- **Test:** run it against the existing 11 logs + current mistakes.jsonl; confirm it reconstructs the true history (incl. the positioning-copy capture and the 3 logged mistakes).

### Phase 1 — Systematic mistake capture at session-end (closes the proven gap)

> **STATUS 2026-07-01: implemented + under verification.** Trigger: the teams-vs-subagents miss (session 44ff9820; object fix `237ddcb9`, logged as `guide.not_consulted` recurrence). Side-test findings that shaped the edit: (1) the reviewer's grep-token gate missed **neutral-question corrections** ("why are you using X vs Y?") — fixed by making `"type":"user"` the gate and semantic judgment the filter, tokens demoted to hints; (2) routing preference re-lands fixes in the very skills that weren't loaded at the miss — mitigated by requiring an in-context-or-not root-cause note in each mistakes.jsonl entry, flagging salience failures for point-of-use/forcing-function fixes (reviewer can't edit CLAUDE.md/hooks; the log line is the routing signal). Verification = §5 side-test run against the REAL 733KB transcript (RED: old detection text; GREEN: new prompt; negative control: benign session). Escalation held in reserve if the miss class recurs despite this: PreToolUse hook on Agent calls with `name` set.
- Extend `~/.dotfiles/claude/prompts/self-improve-skill-review.md`: in addition to skills, the reviewer must scan for **(a) user corrected a workflow/approach/sequence, (b) an operational miss/near-miss** and, for each, **append a valid entry to `~/.claude/mistakes.jsonl`** using the mistake-tracking schema (ts, mistake_id dot-format, scope, detector, notes, action_taken, severity, guide, condition). Reviewer already has Write/Edit + `--add-dir ~/.claude`, so it can append without Bash.
- Reuse mistake-tracking's `common-antipatterns.md` so ids are stable (don't invent a new id for a known pattern).
- Guardrail: the reviewer must not *duplicate* an entry already logged in-session (dedupe on mistake_id+ts window) — else this session's `schedule.destination_load_unchecked` gets double-logged.
- Wrapper (`self-improve-skill-review.sh`): after the reviewer runs, also `git add/commit` the mistakes.jsonl delta (currently only `agents/skills` is committed) — but mistakes.jsonl lives under `~/.claude`, which is **not** the dotfiles repo path the wrapper commits. **Open question O1** (see §6): where does mistakes.jsonl live / get versioned.
- **Regression concern for this phase:** logging is additive and off-path; low risk. Main risk = noise (logging non-mistakes). Mitigation: prompt says "durable, first-class corrections only — not routine turns" (matches Reflexion invariant #3).

### Phase 2 — Eval generation per mistake (the "create evals against them")
- After a mistake is logged, the reviewer writes a scenario into `~/.claude/skills/mistake-tracking/evals/evals.json` keyed by mistake_id: a prompt reproducing the triggering context + **process expectations** (did the agent consult X, stop at Y) — per the mistake-tracking testing guide, which already prescribes exactly this.
- Idempotent: skip if an eval for that mistake_id already exists.

### Phase 3 — Verify green + regression guard ("doesn't make it dumber")
This is the part that needs **Bash / subagent execution**, which the current reviewer deliberately lacks. Two implementation options (**Open question O2**):
- **(a) Wrapper-driven:** after the file-only reviewer commits, the shell wrapper spawns a *second* `claude -p` grader subagent (Bash allowed, sandboxed) that: runs the new eval against the **patched** skill → must PASS (proves the fix works); then runs a **regression set** (a curated `evals/regression.json` of known-good scenarios) with the change applied → must not flip pass→fail. If any regression flips, the wrapper **holds/flags** rather than trusting the change, and the digest shows `REGRESSED`.
- **(b) Separate cadence:** a daily/weekly cron (like the existing `self-improve-skill-curator`) runs the eval+regression sweep in a batch, decoupled from session-end latency.
- **Recommendation:** (b) for the regression sweep (batch, off any session's critical path, cheaper), (a)-lite for the single new-mistake green check (fast, one scenario). Curator already exists as the weekly-cadence home.
- **"Not dumber" definition:** regression set = N scenarios with known-correct process outcomes spanning the skills most edited (coach, email, positioning-copy…). A skill edit is only "good" if new-eval PASS ∧ zero regression flips. This is the eval-gated self-improvement Michael asked for.

### Phase 4 — In-flow reflex (reserve; proportional to recurrence)
- **Now (cheap):** sharpen the CLAUDE.personal.md "after any miss, run mistake-tracking + propose fix unprompted" prose into a **named STOP-gate** with an explicit trigger ("when Michael corrects a workflow/sequence, or says 'you should have…' / 'did you check…'"). Documented-rule drift is why it failed once; naming the trigger + the concrete phrases is the minimal hardening. Route via skill-creator if it touches skill files.
- **Reserve (only if it recurs):** a `Stop` or `UserPromptSubmit` **prompt-hook** that LLM-judges "was the assistant just corrected and did it fail to log?" and injects `additionalContext` to force the reflex in real time. Costs a per-turn model round-trip ⇒ defer until the session-end backstop proves insufficient. Guard with `stop_hook_active` + iteration cap.

## 5. Side-test (only if Michael wants it before committing to Phase 1)
Cheap de-risker, no edits: spawn a subagent with the Phase-1 detector prompt over **this** session's data.
- **Positive:** the scheduling correction (which the real reviewer *missed*) → detector must flag + emit a schema-valid mistakes.jsonl line with the right mistake_id.
- **Negative:** a routine exchange (e.g. "yeah go ahead") → detector must NOT flag.
If the detector reliably separates these, Phase 1 is de-risked before we touch the live prompt. (Validates the exact failure we're fixing.)

## 6. Open questions (need Michael, or a decision) 
- **O1 — mistakes.jsonl home/versioning.** It's at `~/.claude/mistakes.jsonl` (not in the dotfiles repo the wrapper commits). Options: symlink into dotfiles like memory/skills (versioned, diffable — preferred, mirrors sync-auto-memory.sh), or leave local + digest-only. Recommend: version it.
- **O2 — where eval execution runs.** Session-end wrapper (adds a detached grader run) vs the existing weekly curator (batch). Recommend: green-check at session-end, regression sweep in curator.
- **O3 — regression set seeding.** Start from the mistakes already logged (turn each into a regression scenario) + a handful of known-good coach/email flows. How big before it's "enough"? Start ~8-12, grow per mistake.
- **O4 — trust/autonomy.** The reviewer would now edit mistakes.jsonl and evals.json autonomously (currently only agents/skills). All still off-critical-path, committed scoped, reversible. Confirm Michael's comfort given calibration-phase rules (this is *his harness*, not his Todoist/Notion, so lower-stakes — but flag it).

## 7. Sequencing / commitment
- **Phase 0** is a self-contained win: ship it first, it makes everything else observable. ~1 sitting.
- **Phase 1+2** are one prompt edit + one wrapper commit-path change + O1. Small.
- **Phase 3** is the real investment (regression harness). Do after 0-2 are visibly working.
- **Phase 4-now** (rule sharpen) is 15 min, pairs with the already-queued coach scheduling-rule fix (both via skill-creator).
- Separate, already-queued: the `schedule.destination_load_unchecked` coach Scheduling-Rule ("pull the destination day's existing load before rescheduling/capping," sibling to "Anchor on the live calendar first") + its eval — this is the *object-level* fix and can land independently of the meta-loop work.

## 7.5 REFRAME (2026-06-30): monitoring belongs in the `platform` repo, not a bespoke watchdog

Michael's real ask: not a notifier for *this* loop, but a **service healthcheck dashboard for everything he builds, with tiered alerts** — and he half-remembered starting it. He did. `github.com/mshuffett/platform` (Moon+Nix monorepo, services on ec2-dev) already has:
- `services.yaml` — registry / single source of truth. Every service declares `health:`, `logs:`, `restart:`, `status:`, `depends_on:`, `owner:`. (`agent-hub`, `todoist-claude` registered, both HTTP `/health`.)
- `SERVICES.md` — generated (`moon run gen-services-md:generate`).
- `monitoring/` — **scaffolded but EMPTY (.gitkeep).** README: "(next) so is the uptime-monitoring config — so docs/monitoring never drift from reality." The slot exists; unfilled.

**Consequence — monitoring is generic infra, not part of this loop:**
- Fill `platform/monitoring/`: a generated healthcheck (reads `services.yaml`, hits each `health:`, renders status + alerts). Every future service is monitored the moment its yaml block exists ⇒ **zero per-service upkeep** (the block you already write IS the registration).
- **Add `tier:` to the services.yaml schema** for tiered notification: `critical` → immediate Pushover; `standard` → batched; `background` → weekly-digest only. Alert routing generated from the registry.
- **Register the self-improve loop as a service** in `services.yaml` (`tier: background`). Its `health:` is not HTTP (it's a local, event-driven SessionEnd hook on the mac, not an ec2 daemon) — so health = a small JSON the digest writes: `{last_run, errors, repeat_miss_rate, regression_flips}`. Liveness + improvement in one payload the dashboard reads like any other.

**Open wrinkle O5:** the self-improve loop runs **locally on the mac**; the other services + monitor run on **ec2-dev**. Decide where the monitor reads the mac-local health signal — options: (a) digest writes health JSON, committed to dotfiles (already a repo the loop touches) and the monitor reads it via git/pull; (b) push the signal to `agent-hub`; (c) monitor runs locally for local services. Lean (a) — cheapest, already-versioned. `health:` in services.yaml can be a command/file for non-HTTP services.

**Revised phase-0:** "monitoring digest" is no longer a standalone bin script — it becomes (i) the self-improve loop's **health-JSON emitter** (small, local) + (ii) the **`platform/monitoring/` layer** that renders all services incl. this one. Bigger than the original Phase 0 but it's the general dashboard Michael actually wants, and it makes every other service observable too. Requires cloning `platform` locally (not currently on this mac).

## 7.6 DEVBOX FINDING (2026-06-30) — [DEFERRED: remote is a small minority now; ship local proof loop first]

Checked `ssh dev` (`ip-172-31-35-134`, user ubuntu):
- **Devbox == platform host.** `~/platform` present; `todoist-claude/goal/webhook/cloudflared` systemd-user services running there. Resolves O5: the loop's canonical home should be the devbox — co-located with platform + monitoring + persistent services.
- **The self-improve loop does NOT run on the devbox:** 0 reviewed markers, 0 skill-review logs, and **the SessionEnd hook is absent from the devbox `~/.claude/settings.json`**. It only runs on the mac.
- **Implication:** any Claude Code session executed on the devbox (incl. Remote-Control sessions Michael runs from his laptop) is reviewed by nothing. As Michael moves toward always-remote, the loop goes increasingly blind. **This is the real current gap** — ahead of eval/regression machinery. Michael's stated wishlist is "an improvement loop that works"; step 1 of "works" is "runs everywhere you work."

**Revised priority order (serves the wishlist, minimizes Michael's time):**
1. **Make the loop fire everywhere.** Wire the SessionEnd reviewer on the devbox too (both hosts run it host-locally; each emits a health JSON). Canonical home = devbox; mac = secondary emitter. Works whether Michael is local or remote.
2. **Systematic capture + eval + regression guard** (Phases 1-3) — build once, on the canonical host, feeding one health signal. This IS the "improves / not dumber" core = the actual wishlist.
3. **Dashboard is nearly free** once (1)+(2) land: the `platform/monitoring/` slot reads the health JSON like any other service; add `tier:`. Do it, but it's a byproduct, not the point.

**Strategic decision needed (light):** consolidate on the devbox (always-remote) vs. loop genuinely spans mac+devbox. Default if unsure: **span both, canonical on devbox, aggregate health there.**

## 7.7 VERIFICATION EXPERIMENTS (2026-06-30) — what we learned by actually running red→green

Ran two behavioral red→green attempts with live subagents. BOTH were invalid — instructively, for two DIFFERENT reasons:
- **Scheduling mistake (behavioral/load):** RED (no rule) 4/4 and GREEN (rule) 4/4 both pulled the destination day. Eval couldn't reproduce the bug — a clean-context agent obviously checks; the real miss was **attention-under-load**, not ignorance. So a documented rule may not fix this class; it likely needs a **forcing function** (a gate/hook that blocks a reschedule proposal until a destination-day pull happened) and/or a **"you're deep in a long session → /compact" prompt** (the ~40%-context-degradation lever — Michael's idea).
- **Missing-link mistake (knowledge):** RED (no link in prompt) 3/3 STILL produced the correct link — because they **read it off the already-patched skill file on disk** (2–4 tool calls each). No knowledge-absent baseline. The fix is already committed, so a RED agent on the real machine just reads the patch.

**Load-bearing lessons (fold into the build):**
1. **Faithful pre-fix reproduction/isolation is ONE hard part of the system — not the only one, not necessarily THE hardest.** But it's real: a valid red→green must recreate the pre-fix world (pre-fix skills/memory via git parent) AND isolate the agent from the patched files (no filesystem backdoor).
2. **Author the eval + RED baseline at CAPTURE time, before the fix lands.** Once the fix is committed, the patched environment contaminates the test forever. Pipeline shape: **capture → snapshot scenario + run RED → apply fix → run GREEN → regression.**
3. **Tag every capture by verifiability:** `clean` (knowledge/preference/resource — isolate the fact → reliable red→green) vs `hard` (behavioral/context-load — reproduction needs realistic load; fix may be a forcing function, not a rule). Knowledge/preference captures are the cleanly-verifiable majority; the behavioral ones are the minority that need forcing-functions/compaction.
4. **Add a `/compact` nudge as a first-class intervention** for the load class: the loop (or a Stop/context hook) detects degraded long-session state and suggests compaction — no in-context rule can fix a context that is itself degrading.

## 7.8 LOOP IS LIVE + PRODUCTIVE (baseline, 2026-06-30)
Evidence the auto-loop already works (this is the monitoring baseline the digest should surface): **11 sessions reviewed → 10 skill patches + 1 correct noop + 1 curator run.** Real wins captured: `positioning-copy` (anti-slop voice), `paper-decks`, `claude-code-orchestration` (new skills); dev-server `ssm`+OOM recovery, Gmail `get_thread` token workaround, agent-teams safe-pane-kill, coach calendar-anchor, email-reply-style hedging rule (patches). The link fix (`7509c120`) was an in-session manual commit; the loop reviewed it, saw it was already handled, and captured the complementary "no hedging" correction instead (dedup + routing working). **The digest (Phase 0) is mostly a matter of surfacing what the logs already contain.**

## 8. Non-goals
- Not building a per-turn LLM hook now (Phase 4 reserve only).
- Not replacing native auto-memory/auto-dream (they stay; this is skills + mistakes + evals).
- Not touching the codebase-entropy agents; this is harness-self-improvement only.

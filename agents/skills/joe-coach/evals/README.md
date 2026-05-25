# joe-coach evals

Three evals guard the skill. All assume `OPENAI_API_KEY` is set and the corpus index
exists at `$JOE_COACH_CORPUS/index` (default `~/ws/notes/3-Resources/Joe Hudson Coaching Corpus`).

## 1. Retrieval eval — does the index surface the right material?

```bash
cd ~/.dotfiles/agents/skills/joe-coach
uv run evals/run_retrieval_eval.py
```

Asserts known coaching themes (stuck, lonely, shame, inner critic, self-reliance) each
surface a distinctive verbatim anchor in the top-k. `k=8` matches the runtime default in
`scripts/retrieve.py` and `SKILL.md`, so this guards exactly what production retrieves.
Exit 0 = all pass. A broken index fails this (~0.03% chance of passing by luck).

## 2. Triggering eval — does the skill fire on the right requests?

`triggering_cases.json` is the trigger contract: 8 should-trigger coaching requests + 8
tricky should-NOT-trigger near-misses (technical "stuck", an anxiety-article summary, a
sympathy card, a trauma-book factual question, task prioritization).

It's measured with skill-creator's harness:

```bash
cd /Users/michael/.claude/plugins/cache/.../skill-creator   # the skill-creator skill dir
python -m scripts.run_eval \
  --eval-set ~/.dotfiles/agents/skills/joe-coach/evals/triggering_cases.json \
  --skill-path ~/.dotfiles/agents/skills/joe-coach \
  --runs-per-query 2 --model claude-opus-4-7 --verbose
```

> **IMPORTANT caveat (clean-room).** `run_eval` installs a *temporary* copy named
> `joe-coach-skill-<uuid>` and checks whether **that** name is invoked. Because the
> production `joe-coach` skill is already active in the skill profile, Claude invokes the
> real `joe-coach` instead of the temp copy, so `run_eval` reports the should-trigger
> cases as misses (a false negative of the harness, not the skill). The should-NOT-trigger
> cases are unaffected and score correctly.
>
> To get a clean automated number, hide the production skill first:
> ```bash
> rm ~/.local/share/skill-profile/active-claude/joe-coach   # temporarily
> # ...run run_eval...
> skill-profile apply recommended --runtime claude          # restore
> ```
> Or measure production directly (recommended — tests the real deployed skill):
> ```bash
> claude -p "<query>" --output-format stream-json --verbose 2>/dev/null \
>   | grep -o '"skill":"joe-coach"'
> ```
> Verified this way: coaching queries fire `joe-coach`; "debug why my app is stuck on a
> loading spinner" correctly fires `superpowers:systematic-debugging`, not joe-coach.

## 3. Voice-fidelity judge — does it sound like Joe?

```bash
cd ~/.dotfiles/agents/skills/joe-coach
uv run evals/run_voice_judge.py
```

Generates coaching replies to held-out scenarios and has Claude score them against Joe's
fingerprint (short turns, body over story, how/what not why, no "should", validate before
push, welcome don't fix, no technique-talk). Passes at ≥75%.

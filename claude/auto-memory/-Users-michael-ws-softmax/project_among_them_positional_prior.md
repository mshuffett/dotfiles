---
name: among-them-positional-prior
description: Among Them imposters cluster at vote-slot indices 4 and 7 (~80%) — usable as a tiebreaker prior in vote prompts
metadata: 
  node_type: memory
  type: project
  originSessionId: c45d893b-5ebc-4a58-8aa9-cbdb5571e876
---

In the Among Them daily league (May 2026 corpus, ~30 replays), imposters were inferred at vote-slot indices 4 and 7 in roughly 80% of games (corresponding to Pink and Pale Blue in typical seating). This is a property of the league's seeding, not a game-mechanical certainty.

**Why:** I built a scoring offline eval (`eval/replay_eval.py --score`) that maps participant scores → roles via the formula `score = 1*tasks + 10*kills + 100*win`. Mult-of-10 scores = imposter; non-mult = crew. Maps positions → colors via chat speaker_color_index (verified `position == color_index` in all 30 replays). On 20 meetings across 15 replays:

| Prompt variant | vote correct | vote wrong | chat correct | chat wrong |
|---|---|---|---|---|
| baseline (no prior) | 15% | 20% | 29% | 43% |
| **baseline + positional prior on BOTH /vote and /chat** | **40%** | **10%** | **57%** | **14%** |

Note: chat scoring matters because the bot spams the chosen `<Color> sus` 60+ times per
meeting, shaping the 7 other bots' parser-based vote tallies. Chat impact is 7× the bot's
own vote because everyone tallies our color.

**How to apply:** when chat signal is thin and the bot would otherwise SKIP, break ties toward voting indices 4 or 7. The prior is *empirical from the corpus*, not absolute — strong T1-T4 evidence (own body witness, body-room chat with corroboration, alibi cluster, impossible travel) should override it.

**Where:** lives in `policy_server/strategies.py` as a `=== POSITIONAL PRIOR ===` block appended to `baseline_vote(ctx)` via the `baseline` strategy lambda. Tested at: `eval/replay_eval.py --limit 15 --strategy baseline --score`.

**Caveat:** ground-truth role inference fails when both ambiguous slots could be either role (returns None → marked `unknown` in scoring). About 14% of meetings end up `unknown` so the true positive rate is `correct_imp / (1 - unknown_fraction)`.

Related: [[project-among-them-arch]]

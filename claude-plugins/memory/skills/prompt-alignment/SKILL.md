---
description: When aligning ANY prompt — read this first; run fit→generalize loop and test with CLIs.
---

# Prompt‑Alignment (Process)

Two‑sentence definition
- Prompt‑alignment learns a prompt by fitting example input→output mappings (X→Y) and testing generalization. It iteratively proposes the smallest effective changes to the prompt until model(p, X) matches Y on known cases and holds on unseen X′.

What “alignment” means here
- Fit: model(p, Xᵢ) ≈ Yᵢ for all known pairs.
- Generalize: model(p, X′) remains within spec on nearby cases and hard negatives.
- Conform: p respects Michael’s global rules (safety/policy/constraints/style/interrupts).

Orientation (start every run)
- We are working on: <items>. Current step: <step>. Understanding: <goal>. Next: <action>.
- Confirm data you’ll use: current prompt p₀, small diverse example set {(Xᵢ, Yᵢ)} + a few hard negatives; constraints and success criteria.
- Ask for scope if unclear; do not change files until approved.

Artifacts (every iteration)
- p₀ → p₁ diff with 1–2 sentence rationale (which failures it fixes).
- Example table: X, expected Y, actual Y′, pass/fail, notes.
- Guardrails check: which global rules and on‑demand guides were honored.
- Acceptance: criteria/thresholds and whether they’re met.

Workflow (fit → generalize loop)
1) Baseline — run model(p₀, Xᵢ); record failures and which rule/constraint each violates.
2) Minimal change — propose the smallest textual edit likely to fix the widest failures.
3) Micro‑eval — test model(p₁, Xᵢ); measure pass rate and guardrail compliance; revert if regressions > improvements.
4) Generalize — probe with X′ (paraphrase, boundary, adversarial); confirm no guardrail breaks.
5) Decide & Persist — if acceptance is met, freeze p*; else loop. Document diff, rationale, examples, and acceptance result.
6) Apply (approval gate) — present patch or exact text; do not write files until explicitly approved.

Full Prompt Rules (global conformance)
1) Objective & Scope
   - Goal and boundaries are explicit; inputs/assumptions clear.
2) Safety & Policy
   - Refer to on‑demand guides for procedures (don’t inline); use Context7 for third‑party docs; surface conflicts and ask for override/update.
3) Execution Constraints
   - pnpm > npm; Biome for lint; prefer Vercel AI SDK when relevant; include approvals/env as needed.
4) Output & Acceptance
   - Expected output shape and acceptance checks are testable.
5) Task Switching & Interrupts
   - Include reflect/decide/confirm/continue guidance for long or multi‑step prompts.
6) Style
   - Concise, direct, friendly; follow AGENTS formatting rules.
7) Metarule
   - Each rule has YES/NO checks; all must pass.

Specialization: Read‑trigger descriptions (one‑liners)
- Must cause opening the guide; never summarize steps.
- Patterns: “Before <action> — read this first.”, “When asked to <task> — read this immediately.”, “Always read this whenever <topic>.”, “Never <risky action> without reading this.”
- Approved examples: Worktrees / PR / Ports / Git‑safety (see memory‑guide for exact lines).

Rubric (apply every loop)
- Fit: All known (Xᵢ→Yᵢ) pass? (YES/NO)
- Generalize: Hold on X′ probes? (YES/NO)
- Conform: All global rules satisfied? (YES/NO)
- Parsimony: Is this the smallest effective change? (YES/NO)
- Regressions: No new failures introduced? (YES/NO)
- PASS = all YES; else record failure and propose the next smallest fix.

Report template (per iteration)
- Prompt name:
- p₀ excerpt → p₁ change (diff):
- Failures addressed:
- Micro‑eval results: pass/total, regressions, guardrail status
- Generalization probes: notes
- Decision: accept/revert/next change

Utilities
- List description lines: `~/.dotfiles/claude/scripts/list-command-descriptions.sh`
- On‑demand guides: see root CLAUDE “On‑Demand Guides Index”.

Live testing (CLI)
- Claude CLI (preferred)
  1) Authenticate once: `claude setup-token`
   2) Run a one‑off test with a system prompt and an input:
      - `time claude -p --print --output-format text \\
         --system-prompt "$(cat .claude/debug/sample-prompt.md)" \\
         "ping"`
  3) Pass if the printed output matches expected (e.g., contains `pong`).

- Codex CLI (alternative)
  1) Ensure provider/model is supported by your Codex account: `codex login` then pick a working `-m`.
  2) Run non‑interactive exec with prompt+input:
     - `PROMPT="$(cat .claude/debug/sample-prompt.md; echo; echo 'User says: ping')"`
     - `time codex exec --skip-git-repo-check --sandbox read-only -m <MODEL> -- "$PROMPT"`
  3) Optionally write the last message with `-o <file>` and grep for the expected token.

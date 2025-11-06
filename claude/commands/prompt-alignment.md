---
description: When aligning any prompt — read this first; fit examples and generalize efficiently.
---

# Prompt‑Alignment (from scratch)

Two‑sentence definition
- Prompt‑alignment learns a prompt by fitting example input→output mappings (X→Y) and testing generalization. It iteratively proposes the smallest effective changes to the prompt until model(p, X) matches Y on known cases and holds on unseen X′.

What “alignment” means here
- Fit: model(p, Xᵢ) ≈ Yᵢ for all known pairs.
- Generalize: model(p, X′) remains within spec on nearby cases and hard negatives.
- Conform: p respects Michael’s global rules (safety/policy/constraints/style/interrupts).

Artifacts (always produce)
- p₀ → p* diff with rationale (which failure each change addresses).
- Example table: X, expected Y, actual Y′, pass/fail, notes.
- Guardrails report: checks against global rules + on‑demand guides.
- Acceptance doc: success criteria, thresholds, and any trade‑offs.

Workflow (single loop; repeat until criteria met)
1) Orient (Session Kickoff)
   - We are working on: <items>. Step: <step>. Understanding: <goal>. Next: <action>.
   - Collect the current prompt p₀, constraints, and a minimal, diverse set of example pairs {(Xᵢ, Yᵢ)}; add 2–3 hard negatives.
2) Specify acceptance
   - Define measurable criteria (e.g., 100% pass on known pairs; no guardrail violations; ≤ N edits or ≤ L chars change; latency/cost bounds if applicable).
3) Baseline
   - Run model(p₀, Xᵢ) and record failures; note which rule/constraint each failure violates.
4) Minimal change proposal
   - Identify the smallest edit expected to fix the widest set of failures (ordering, tighter instruction, explicit constraint, anti‑pattern, example).
   - Prefer consult‑guides cues over inlining steps; prefer Context7 cues for third‑party APIs.
5) Micro‑eval
   - Test model(p₁, Xᵢ); track pass rate, regressions, and guardrail compliance; revert if regressions > improvements.
6) Generalization probe
   - Try X′ variants (paraphrases, edge cases, adversarials); ensure no guardrail breaks.
7) Decide
   - If acceptance met, freeze p*; else iterate with another minimal change.
8) Persist
   - Document the p₀→p* diff, rationale per change, updated examples, and a short “playbook” note; commit.

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

---
name: prompt-alignment
description: Use when aligning ANY prompt, read-trigger description, or output style. Run fit-to-generalize loop iteratively and test with CLI.
---

# Prompt Alignment

Prompt-alignment learns a prompt by fitting example input-to-output mappings (X→Y) and testing generalization. It iteratively proposes the smallest effective changes until model(p, X) matches Y on known cases and holds on unseen X′.

## Definitions

- **Fit**: model(p, Xᵢ) ≈ Yᵢ for all known pairs
- **Generalize**: model(p, X′) remains within spec on nearby cases and hard negatives
- **Conform**: p respects global rules (safety/policy/constraints/style/interrupts)

## Workflow

1. **Baseline** - Run model(p₀, Xᵢ); record failures and which rule each violates
2. **Minimal change** - Propose smallest textual edit to fix widest failures
3. **Micro-eval** - Test model(p₁, Xᵢ); measure pass rate; revert if regressions > improvements
4. **Generalize** - Probe with X′ (paraphrase, boundary, adversarial); confirm no guardrail breaks
5. **Decide** - If acceptance met, freeze p*; else loop. Document diff, rationale, results
6. **Apply** - Present patch; do not write files until explicitly approved

## Artifacts per Iteration

- p₀ → p₁ diff with 1-2 sentence rationale
- Example table: X, expected Y, actual Y′, pass/fail
- Guardrails check: which global rules honored
- Decision: accept/revert/next change

## Rubric (apply every loop)

| Check | Question |
|-------|----------|
| Fit | All known (Xᵢ→Yᵢ) pass? |
| Generalize | Hold on X′ probes? |
| Conform | All global rules satisfied? |
| Parsimony | Is this the smallest effective change? |
| Regressions | No new failures introduced? |

**PASS** = all YES; else record failure and propose next smallest fix.

## Read-Trigger Descriptions (Specialization)

Must cause opening the guide; never summarize steps.

**Patterns**:
- "Before <action> — read this first."
- "When asked to <task> — read this immediately."
- "Always read this whenever <topic>."
- "Never <risky action> without reading this."

## Live Testing

**Claude CLI (preferred)**:

```bash
time claude -p --print --output-format text \
  --system-prompt "$(cat .claude/debug/sample-prompt.md)" \
  "ping"
```

**Codex CLI (alternative)**:

```bash
PROMPT="$(cat .claude/debug/sample-prompt.md; echo; echo 'User says: ping')"
time codex exec --skip-git-repo-check --sandbox read-only -m <MODEL> -- "$PROMPT"
```

## Utilities

- List description lines: `~/.dotfiles/claude/scripts/list-command-descriptions.sh`

## Related Notes (Deep Dives)

- `agents/knowledge/atoms/claude-skill-archive/prompt-engineering/SKILL.md`

## Acceptance Checks

- [ ] Baseline failures documented
- [ ] Each change is minimal and targeted
- [ ] Micro-eval run after each change
- [ ] Generalization probes tested
- [ ] No regressions introduced
- [ ] Approval obtained before writing files

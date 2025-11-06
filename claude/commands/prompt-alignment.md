---
description: Use when aligning command descriptions (or any prompt) to Michael's preferences; provides a rubric with clear pass/fail, examples, and a fix-first workflow.
---

# Prompt Alignment (Read‑Trigger Descriptions)

Purpose
- Align any prompt/description to user preferences with an explicit pass/fail rubric and fixes.
- Living document: improve the rubric as preferences evolve; all rules must have pass/fail criteria.

Scope
- Primary: command `description` lines in `~/.claude/commands/*.md`.
- Also applicable to other prompts/titles that need consistent triggers.

Current Prompt (Rules)
- Trigger‑first: start with “Before…”, “When…”, or “Always read this whenever…”.
- Read‑trigger, not summary: explicitly say “read this first/now” or use minimal imperative (“Never … without reading this”).
- No steps/checks/links/outcomes; keep ≤120 chars; do not imply you can proceed without reading.
- Meta‑rule: every rule has clear pass/fail criteria; ALL must pass to be rated PASS.

Approved Examples (reference)
- Worktrees: “Always read this whenever working with git worktrees”
- PR: “When asked to create a PR, read this immediately so you know what steps to take along the way.”
- Ports: “Before killing a process, read this first.”
- Git‑safety: “Never stash a git file without reading this.”

Rubric (Pass/Fail)
- Trigger‑first? (YES/NO)
- Read directive or minimal imperative that forces reading? (YES/NO)
- No steps/checks/links/outcomes? (YES/NO)
- ≤120 chars (approx)? (YES/NO)
- Does not imply proceeding without reading? (YES/NO)
- PASS = all YES; otherwise FAIL. Every FAIL must include a specific fix.

Workflow
1) Collect candidates
   - List current descriptions: `~/.dotfiles/claude/scripts/list-command-descriptions.sh`
2) Snapshot preferences
   - Confirm the “Current Prompt (Rules)” above and any newly approved examples.
3) Map intent → description
   - For each command, write a minimal read‑trigger description according to rules.
4) Audit
   - Apply the rubric to current and proposed versions; record PASS/FAIL and fixes.
5) Fix or propose
   - If FAIL, replace with the proposed line that passes.
6) Persist
   - Update files; commit with message “docs(commands): normalize descriptions to read‑trigger style”.
7) Review & iterate
   - Confirm with user; add newly approved examples to this command.

Report Template (per item)
- Command: `<file>`
- Current: `"…"`
- Proposed: `"…"`
- Checks: Trigger(Y/N), Read‑directive(Y/N), No‑steps(Y/N), Length(Y/N), No‑proceed‑implication(Y/N)
- Result: PASS/FAIL
- Fix (if FAIL): `"…"`

Notes
- Use this as the single source of truth for description alignment.
- When preferences change, update “Current Prompt (Rules)” and examples, then re‑run the audit.


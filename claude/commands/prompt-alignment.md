---
description: Use when aligning ANY prompt to Michael's preferences; includes full prompt rules, a pass/fail rubric, and a fix-first workflow.
---

# Prompt Alignment (Any Prompt)

Purpose
- Align any prompt to user preferences with an explicit pass/fail rubric and concrete fixes.
- Living document: improve the rubric as preferences evolve. Meta‑rule: all rules below must have clear pass/fail criteria.

Session Kickoff (Orientation)
- We are currently working on: <brief list of items in flight>
- Current step: <which step of the workflow we’re on>
- My understanding: we’re aligning <prompt name> and/or improving <descriptions> following the rules below
- After this: <next action in the workflow, e.g., audit → fix → commit → PR review>

Scope
- Primary: operational prompts (procedures, workflows, tool usage), strategy/plan prompts, and one‑line descriptions.
- Where applicable, treat “Read‑trigger description rules” as a specialization (see Specializations below).

Full Prompt Rules (Global)
1) Objective & Scope
   - State the goal and scope explicitly; avoid ambiguous “change”.
   - Define inputs, assumptions, and boundaries (what’s in/out).
   - PASS if goal/scope/inputs are present and unambiguous.
2) Safety & Policy Alignment
   - If a procedure exists, instruct to consult the on‑demand guide and follow acceptance checks (don’t inline steps).
   - For third‑party libraries, instruct to fetch current docs via Context7 (never rely on memory).
   - If a user request conflicts with a rule, surface the conflict and ask: temporary override or rule update.
   - PASS if these cues are present when applicable and do not contradict root CLAUDE.
3) Execution Constraints
   - Prefer pnpm over npm; use Biome as linter; prefer Vercel AI SDK (consult docs) where relevant.
   - Include any tool constraints, environment variables, or approvals that matter.
   - PASS if required constraints are declared when applicable.
4) Output & Acceptance
   - Specify the expected output shape (bullets/headers/paths) and acceptance checks (how we know it’s done).
   - Keep prompts testable; acceptance must be verifiable.
   - PASS if acceptance is concrete and testable.
5) Task Switching & Interrupts
   - If interrupts occur, include guidance to reflect/decide/confirm/continue (quick vs queue). 
   - PASS if present for long‑running prompts.
6) Tone & Structure (per AGENTS spec)
   - Concise, direct, friendly; use headers/bullets judiciously; monospace for commands/paths; avoid over‑formatting.
   - PASS if the structure aids execution and matches house style.
7) Metarule
   - Every rule above must be checkable with YES/NO; all must PASS.

Specialization: Read‑Trigger Descriptions
- One‑liners must cause opening the guide, not summarize steps.
- Patterns: “Before <action> — read this first.”, “When asked to <task> — read this immediately.”, “Always read this whenever <topic>.”, “Never <risky action> without reading this.”
- Approved examples:
  - Worktrees: “Always read this whenever working with git worktrees”
  - PR: “When asked to create a PR, read this immediately so you know what steps to take along the way.”
  - Ports: “Before killing a process, read this first.”
  - Git‑safety: “Never stash a git file without reading this.”

Rubric (Pass/Fail)
- Objective & scope clear? (YES/NO)
- Safety & policy cues present (guides/Context7/conflict‑override) when applicable? (YES/NO)
- Execution constraints declared when applicable? (YES/NO)
- Output shape + acceptance checks testable? (YES/NO)
- Interrupt handling for long‑running flows? (YES/NO)
- Style matches house rules? (YES/NO)
- For descriptions only: read‑trigger rules satisfied? (YES/NO)
- PASS = all required items YES; otherwise FAIL with a concrete fix.

Workflow
1) Collect candidates
   - For descriptions: `~/.dotfiles/claude/scripts/list-command-descriptions.sh`
   - For other prompts: gather the full text and any example I/O.
2) Snapshot preferences
   - Confirm the “Full Prompt Rules” above and any newly approved examples.
3) Map intent → description
   - For descriptions: write a minimal read‑trigger line.
   - For full prompts: include objective/scope, safety/policy, constraints, output/acceptance, interrupts.
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
- Checks (descriptions): Trigger(Y/N), Read‑directive(Y/N), No‑steps(Y/N), Length(Y/N), No‑proceed‑implication(Y/N)
- Checks (full prompts): Objective/Scope(Y/N), Safety/Policy(Y/N), Constraints(Y/N), Output/Acceptance(Y/N), Interrupts(Y/N), Style(Y/N)
- Result: PASS/FAIL
- Fix (if FAIL): `"…"`

Notes
- Use this as the single source of truth for description alignment.
- When preferences change, update “Full Prompt Rules” and examples, then re‑run the audit.

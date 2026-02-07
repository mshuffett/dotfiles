# Claude Skill Archive

This folder contains skills that used to live under `claude/skills/` but are no longer part of the bounded entrypoint set in `agents/skills/`.

Why:

- Too many top-level skills increases load time/attention and raises the chance the right one is skipped.
- The preferred pattern is progressive disclosure: entrypoint skill (L1) -> open deeper docs here only when needed (L2+).

Promotion / demotion:

- If something in this archive is frequently needed or frequently missed, promote the relevant parts into an entrypoint skill (or into `claude/CLAUDE.md` for universal guardrails).
- If an entrypoint skill grows too large, move detail down into this folder and link to it.


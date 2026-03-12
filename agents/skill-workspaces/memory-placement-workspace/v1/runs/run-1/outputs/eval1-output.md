# Eval Output: memory-placement

## Task

The user says: "Remember that I always prefer pnpm over npm across all my projects." Where should this information be stored?

## Answer

**Destination: `~/.claude/CLAUDE.md` — under the existing "Preferences" section.**

### Reasoning (Decision Tree Walk)

1. **Who is writing this?** The HUMAN is instructing a preference. → Human branch.
2. **Needed MOST sessions?** Yes. Package manager preference affects almost every development session involving JS/TS projects. Missing it would cause Claude to use npm when the user expects pnpm. → High miss risk confirmed.
3. **Scope: all projects or this project?** The user explicitly said "across all my projects." → Global scope.
4. **Personal preference or team preference?** Personal preference (user-level). → `~/.claude/CLAUDE.md` (not a project CLAUDE.md, which is git-tracked and shared with a team).

### Where to Add It

The existing `~/.claude/CLAUDE.md` already has a **Preferences** section that already mentions `pnpm`:

```
- Vercel AI SDK over provider SDKs; fetch docs via Context7 (never rely on memory)
- pnpm, Ultracite linter
```

The preference is already captured here. If it were not present, the correct action would be to add it to that Preferences section — for example:

```markdown
**Preferences**

- Always use pnpm over npm for all JS/TS projects
- Vercel AI SDK over provider SDKs; fetch docs via Context7 (never rely on memory)
- pnpm, Ultracite linter
...
```

### What NOT to Do

- Do NOT store in auto-memory (`~/.claude/projects/.../memory/`) — that's for Claude's own learnings, not human instructions.
- Do NOT create a skill for this — it's a simple preference, not procedural knowledge.
- Do NOT store in a project `CLAUDE.md` — scope is all projects, and project CLAUDE.md is shared with a team (git-tracked).
- Do NOT create a rules file — this preference isn't path-scoped.

## Conclusion

Store in `~/.claude/CLAUDE.md` under **Preferences**. The preference is already present in the existing file (`pnpm, Ultracite linter`), so no change is strictly needed. If strengthening the signal is desired, make the entry more explicit: "Always use pnpm over npm."

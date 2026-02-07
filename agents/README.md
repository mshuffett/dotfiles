This folder contains shared agent guidance that is intended to work across multiple runtimes (Claude, Codex, etc.).

Key idea: keep a small number of top-level *entrypoint* skills, and push detail down into referenced notes.

- Entrypoint skills: `agents/skills/*/SKILL.md` (bounded set; prefer <= 20)
- Atomic notes / deeper references: `agents/knowledge/atoms/`

`claude/skills` is a compatibility symlink to `agents/skills` so existing Claude paths continue to work.


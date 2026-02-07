# agent-recall

Local semantic recall over prompt/output history, to quickly recover prior context without bloating always-loaded instructions.

## Usage

```bash
agent-recall search "query"
```

Sources indexed (by default):

- `~/.claude/history.jsonl`
- `~/.codex/history.jsonl`

`agent-recall index` builds a lightweight cache under `~/.agents/recall/` (no precomputed embeddings).


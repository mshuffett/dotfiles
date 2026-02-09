# agent-recall

Local semantic recall over prompt/output history, to quickly recover prior context without bloating always-loaded instructions.

## Usage

```bash
agent-recall search "query"
```

Sources indexed (by default):

- `~/.claude/history.jsonl`
- `~/.codex/history.jsonl`

You can also pass `--source` as either a file or a directory; directories are scanned recursively for `*.jsonl` and `*.md` (skipping common build/venv folders).

### Optional Config

If you do not pass `--source`, agent-recall will use `~/.agents/recall/config.json` if present:

```json
{
  "sources": [
    "/path/or/dir",
    "/another/path"
  ]
}
```

### Scope Filter

Use `--scope` to filter results by source type:

```bash
agent-recall search "pomodoro" --scope notes
agent-recall search "pomodoro" --scope atoms
agent-recall search "pomodoro" --scope skills
agent-recall search "pomodoro" --scope conv
```

`agent-recall index` builds a lightweight cache under `~/.agents/recall/` (no precomputed embeddings).

What gets cached:

- `~/.agents/recall/meta.json`
- `~/.agents/recall/records.jsonl`
 - `~/.agents/recall/fts.sqlite`

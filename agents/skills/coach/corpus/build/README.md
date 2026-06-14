# Corpus build pipeline

Manual pipeline that produces the data `retrieve.py` consumes. Not part of the runtime skill.

## One-time / refresh

```bash
cd "$HOME/ws/notes/3-Resources/Joe Hudson Coaching Corpus"
export JOE_COACH_CORPUS="$PWD"
uv run build/extract_snippets.py      # research-report.md → snippet-bank.md
uv run build/fetch_transcripts.py --playlist   # YouTube → transcripts/
uv run build/build_index.py           # → index/chunks.jsonl + embeddings.npy
# or just: bash build/refresh.sh
```

Requires `yt-dlp` (`uv tool install yt-dlp`) and `OPENAI_API_KEY`.
Re-harvest quarterly — Joe publishes ~1–2 episodes/week.

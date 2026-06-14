# Joe Hudson Coaching Corpus

Source material for the `joe-coach` skill (a RAG-backed coaching agent in Joe
Hudson's voice). The skill itself lives in `~/.dotfiles/agents/skills/joe-coach/`;
this directory is the data + build pipeline it consumes.

## Contents
- `coach-prompt.md` — the persona/system prompt (voice + method).
- `research-report.md` — corpus research report: source bibliography, 87-snippet
  verbatim bank, methodology summary, style guide.
- `snippet-bank.md` — verbatim snippets extracted from the report (retrieval ground truth).
- `transcripts/` — YouTube transcripts of Joe's coaching sessions, one md per video.
- `index/` — embeddings index (`chunks.jsonl` + `embeddings.npy`) used by `retrieve.py`.
- `build/` — the (manual) pipeline that produces the above.

## Provenance
- Prompt + research report: created 2026-05-24, copied from ~/Downloads.
- Transcripts: "Coaching Sessions with Joe" playlist
  (https://www.youtube.com/playlist?list=PLrbct081G13-RY3N3PkjVN59a0bmhAV2j).

## Refresh
Joe publishes ~1–2 episodes/week. Re-harvest quarterly:
`JOE_COACH_CORPUS="$PWD" bash build/refresh.sh`

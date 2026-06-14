#!/usr/bin/env bash
# Re-harvest the corpus: re-extract snippets, fetch new transcripts, rebuild the index.
# Run from the corpus dir:  JOE_COACH_CORPUS="$PWD" bash build/refresh.sh
set -euo pipefail
: "${JOE_COACH_CORPUS:?set JOE_COACH_CORPUS to the corpus dir}"
cd "$JOE_COACH_CORPUS"
uv run build/extract_snippets.py
uv run build/fetch_transcripts.py --playlist   # idempotent: skips existing
uv run build/build_index.py
echo "refresh complete"

#!/usr/bin/env bash
# Stage 0: cache each task's full view (incl. description) + comments to disk so later
# stages never re-fetch. Writes to ../fixtures/private/cache/<id>.txt (gitignored).
#
# Usage: ./fetch_context.sh <task_id> [<task_id> ...]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE="$HERE/../fixtures/private/cache"
mkdir -p "$CACHE"
for id in "$@"; do
  out="$CACHE/$id.txt"
  { echo "===== TASK $id ====="; td task view "id:$id" 2>&1
    echo; echo "----- COMMENTS -----"; td comment list "id:$id" 2>&1; } > "$out"
  echo "cached $out"
done

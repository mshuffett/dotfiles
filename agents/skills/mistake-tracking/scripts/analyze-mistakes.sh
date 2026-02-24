#!/usr/bin/env bash
# Analyze mistakes.jsonl — aggregate counts, identify promotion candidates
# Usage: analyze-mistakes.sh [path-to-jsonl] [--days N]
# Defaults: ~/.claude/mistakes.jsonl, 14 days

set -euo pipefail

JSONL="$HOME/.claude/mistakes.jsonl"
DAYS=14

# Parse args: positional path and --days flag
while [[ $# -gt 0 ]]; do
  case "$1" in
    --days=*) DAYS="${1#*=}"; shift ;;
    --days) DAYS="${2:-14}"; shift 2 ;;
    -*) echo "Unknown flag: $1" >&2; exit 1 ;;
    *) JSONL="$1"; shift ;;
  esac
done

if [[ ! -f "$JSONL" ]]; then
  echo '{"error":"File not found","path":"'"$JSONL"'"}'
  exit 1
fi

TOTAL=$(wc -l < "$JSONL" | tr -d ' ')
CUTOFF=$(date -u -v-${DAYS}d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "${DAYS} days ago" +%Y-%m-%dT%H:%M:%SZ)

# Use jq for reliable JSONL parsing
# Normalize schema: handle both old format (timestamp/type) and current (ts/mistake_id)
jq -s --arg cutoff "$CUTOFF" --arg days "$DAYS" '
  # Normalize each entry
  map(
    .ts //= .timestamp |
    .mistake_id //= (.type // "unknown") |
    .notes //= (.description // .resolution // "")
  ) |

  # Split into recent vs all
  . as $all |
  map(select(.ts >= $cutoff)) as $recent |

  # Count by mistake_id (all time)
  ($all | group_by(.mistake_id) | map({
    id: .[0].mistake_id,
    total: length,
    recent: (map(select(.ts >= $cutoff)) | length),
    last_seen: (sort_by(.ts) | last | .ts),
    detectors: (map(.detector // "unknown") | unique)
  }) | sort_by(-.recent, -.total)) as $by_id |

  # Count by repo (recent only)
  ($recent | group_by(.repo // "global") | map({
    repo: .[0].repo // "global",
    count: length,
    mistake_ids: (map(.mistake_id) | unique)
  }) | sort_by(-.count)) as $by_repo |

  # Promotion candidates: 2+ recent in same mistake_id
  ($by_id | map(select(.recent >= 2))) as $promote_by_freq |

  # Promotion candidates: 2+ repos with same mistake_id
  ($recent | group_by(.mistake_id) | map({
    id: .[0].mistake_id,
    repos: (map(.repo // "global") | unique),
    repo_count: (map(.repo // "global") | unique | length)
  }) | map(select(.repo_count >= 2))) as $promote_cross_repo |

  {
    summary: {
      total_events: ($all | length),
      recent_events: ($recent | length),
      window_days: ($days | tonumber),
      cutoff: $cutoff,
      unique_mistake_ids: ($all | map(.mistake_id) | unique | length)
    },
    by_mistake_id: $by_id,
    by_repo: $by_repo,
    promotion_candidates: {
      frequency_based: $promote_by_freq,
      cross_repo: $promote_cross_repo,
      action_needed: (($promote_by_freq | length) + ($promote_cross_repo | length)) > 0
    }
  }
' "$JSONL"

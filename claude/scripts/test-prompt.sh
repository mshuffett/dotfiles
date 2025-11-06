#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: test-prompt.sh --provider anthropic|openai \
  --prompt <file> --input <string> [--expect <string>] \
  [--model <name>] [--timeout <sec>] [--background] [--dry-run]

Examples:
  test-prompt.sh --provider anthropic \
    --prompt .claude/debug/sample-prompt.md \
    --input "ping" --expect "pong" --timeout 20

Notes:
  - Uses ANTHROPIC_API_KEY or OPENAI_API_KEY depending on provider.
  - If the required key is missing, runs in --dry-run automatically.
USAGE
}

provider=""
prompt_file=""
input_str=""
expect_str=""
model=""
timeout_sec=30
background=0
dry_run=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --provider) provider="$2"; shift 2;;
    --prompt) prompt_file="$2"; shift 2;;
    --input) input_str="$2"; shift 2;;
    --expect) expect_str="$2"; shift 2;;
    --model) model="$2"; shift 2;;
    --timeout) timeout_sec="$2"; shift 2;;
    --background) background=1; shift;;
    --dry-run) dry_run=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

[[ -z "$provider" || -z "$prompt_file" || -z "$input_str" ]] && { usage; exit 2; }
[[ -f "$prompt_file" ]] || { echo "Prompt file not found: $prompt_file" >&2; exit 2; }

# Provider defaults and key detection
case "$provider" in
  anthropic)
    : "${model:="claude-sonnet-4-5-20250929"}"
    if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then dry_run=1; fi
    ;;
  openai)
    : "${model:="gpt-4.1-mini"}"
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then dry_run=1; fi
    ;;
  *) echo "Unsupported provider: $provider" >&2; exit 2;;
esac

if command -v python >/dev/null 2>&1; then
  start_ms=$(python - <<'PY'
import time; print(int(time.time()*1000))
PY
  )
else
  # milliseconds from date (approx, platform dependent)
  start_ms=$(date +%s000)
fi

prompt_text=$(cat "$prompt_file")

do_anthropic() {
  local body
  body=$(jq -n --arg sys "$prompt_text" --arg user "$input_str" --arg mdl "$model" '{
    model: $mdl,
    system: $sys,
    max_tokens: 512,
    messages: [ { role: "user", content: $user } ]
  }')
  if (( dry_run )); then
    echo "[DRY-RUN] curl -s https://api.anthropic.com/v1/messages -H 'x-api-key: ***' -H 'anthropic-version: 2023-06-01' -d '…'" >&2
    echo ""
  else
    curl -sS --max-time "$timeout_sec" https://api.anthropic.com/v1/messages \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      -H "content-type: application/json" \
      -d "$body"
  fi
}

do_openai() {
  local body
  body=$(jq -n --arg sys "$prompt_text" --arg user "$input_str" --arg mdl "$model" '{
    model: $mdl,
    messages: [ { role: "system", content: $sys }, { role: "user", content: $user } ]
  }')
  if (( dry_run )); then
    echo "[DRY-RUN] curl -s https://api.openai.com/v1/chat/completions -H 'Authorization: Bearer ***' -d '…'" >&2
    echo ""
  else
    curl -sS --max-time "$timeout_sec" https://api.openai.com/v1/chat/completions \
      -H "authorization: Bearer $OPENAI_API_KEY" \
      -H "content-type: application/json" \
      -d "$body"
  fi
}

run_once() {
  local json output end_ms dur_ms pass=0
  case "$provider" in
    anthropic) json=$(do_anthropic);;
    openai) json=$(do_openai);;
  esac

  if (( dry_run )); then
    output="(dry-run)"
  else
    if command -v jq >/dev/null 2>&1; then
      if [[ "$provider" == "anthropic" ]]; then
        output=$(echo "$json" | jq -r '.content[0].text // empty')
      else
        output=$(echo "$json" | jq -r '.choices[0].message.content // empty')
      fi
    else
      output="$json"
    fi
  fi

  if command -v python >/dev/null 2>&1; then
    end_ms=$(python - <<'PY'
import time; print(int(time.time()*1000))
PY
    )
  else
    end_ms=$(date +%s000)
  fi
  dur_ms=$(( end_ms - start_ms ))

  if [[ -n "$expect_str" && -n "$output" && "$output" == *"$expect_str"* ]]; then
    pass=1
  elif [[ -n "$expect_str" && "$output" == "(dry-run)" ]]; then
    pass=0
  elif [[ -z "$expect_str" ]]; then
    pass=1
  fi

  printf "provider=%s model=%s time_ms=%s pass=%s\n" "$provider" "$model" "$dur_ms" "$pass"
  printf "output:\n%s\n" "$output"
}

if (( background )); then
  run_once &
  echo "spawned PID $!"
else
  run_once
fi

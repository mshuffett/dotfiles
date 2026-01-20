#!/bin/bash

# Everything Loop Stop Hook
# Core loop mechanism: prevents exit when loop is active, re-injects prompts
# Supports two-level loop: outer (project planning) and inner (feature dev)
#
# Safety features:
# - stop_hook_active check: prevents infinite loops per official Claude Code docs
# - Error detection: stops blocking on consecutive API errors
# - Velocity check: detects runaway iterations (too fast = something wrong)

set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Debug log
DEBUG_LOG="${HOME}/.claude/everything-loop-stop.log"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" >> "$DEBUG_LOG"
}

# Determine state directory
if [[ -n "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
  STATE_DIR="$CLAUDE_PLUGIN_ROOT/state"
else
  STATE_DIR="$(dirname "$(dirname "$0")")/state"
fi

# =============================================================================
# SAFETY CHECK 1: stop_hook_active (official Claude Code infinite loop prevention)
# When true, Claude is already continuing from a previous stop hook block.
# We must allow exit to break potential loops.
# =============================================================================
STOP_HOOK_ACTIVE=$(echo "$HOOK_INPUT" | jq -r '.stop_hook_active // false')
if [[ "$STOP_HOOK_ACTIVE" = "true" ]]; then
  log "stop_hook_active=true - allowing exit to prevent infinite loop"
  exit 0
fi

# Extract session_id from hook input
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
if [[ -z "$SESSION_ID" ]]; then
  log "No session_id - allowing exit"
  exit 0
fi

# Check if everything-loop is active for this session
PROJECT_STATE_FILE="$STATE_DIR/${SESSION_ID}-project.md"

if [[ ! -f "$PROJECT_STATE_FILE" ]]; then
  log "No active loop for session $SESSION_ID"
  exit 0
fi

log "Active loop found: $PROJECT_STATE_FILE"

# Parse YAML frontmatter helper function
parse_frontmatter() {
  local file="$1"
  sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$file"
}

# Get field from frontmatter
get_field() {
  local frontmatter="$1"
  local field="$2"
  echo "$frontmatter" | grep "^${field}:" | sed "s/^${field}: *//" | sed 's/^"\(.*\)"$/\1/'
}

# Parse project state
FRONTMATTER=$(parse_frontmatter "$PROJECT_STATE_FILE")
ITERATION=$(get_field "$FRONTMATTER" "iteration")
MAX_ITERATIONS=$(get_field "$FRONTMATTER" "max_iterations")
COMPLETION_PROMISE=$(get_field "$FRONTMATTER" "completion_promise")
PROJECT_TYPE=$(get_field "$FRONTMATTER" "project_type")
CURRENT_LOOP=$(get_field "$FRONTMATTER" "current_loop")
CURRENT_PHASE=$(get_field "$FRONTMATTER" "current_phase")
ACTIVE_FEATURE_ID=$(get_field "$FRONTMATTER" "active_feature_id")

log "State: iteration=$ITERATION max=$MAX_ITERATIONS loop=$CURRENT_LOOP phase=$CURRENT_PHASE"

# Validate numeric fields
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  echo "State file corrupted: invalid iteration '$ITERATION'" >&2
  rm "$PROJECT_STATE_FILE"
  exit 0
fi

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "State file corrupted: invalid max_iterations '$MAX_ITERATIONS'" >&2
  rm "$PROJECT_STATE_FILE"
  exit 0
fi

# Check max iterations
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "Max iterations ($MAX_ITERATIONS) reached. Everything loop complete."
  # Cleanup state and tracking files
  rm -f "$PROJECT_STATE_FILE"
  rm -f "$STATE_DIR/${SESSION_ID}-error-count" 2>/dev/null || true
  rm -f "$STATE_DIR/${SESSION_ID}-fast-count" 2>/dev/null || true
  rm -f "$STATE_DIR/${SESSION_ID}-last-iteration-ts" 2>/dev/null || true
  exit 0
fi

# Get transcript path and read last assistant output
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "Transcript not found" >&2
  rm "$PROJECT_STATE_FILE"
  exit 0
fi

# Extract last assistant message
if ! grep -q '"role":"assistant"' "$TRANSCRIPT_PATH"; then
  echo "No assistant messages found" >&2
  rm "$PROJECT_STATE_FILE"
  exit 0
fi

LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
  .message.content |
  map(select(.type == "text")) |
  map(.text) |
  join("\n")
' 2>/dev/null || echo "")

if [[ -z "$LAST_OUTPUT" ]]; then
  echo "No text content in last message" >&2
  rm "$PROJECT_STATE_FILE"
  exit 0
fi

# =============================================================================
# SAFETY CHECK 2: Error detection
# If the transcript contains recent API errors (like token limit), stop blocking
# to prevent runaway error loops.
# =============================================================================
ERROR_COUNT_FILE="$STATE_DIR/${SESSION_ID}-error-count"

# Check for common error patterns in recent transcript lines
RECENT_ERRORS=$(tail -20 "$TRANSCRIPT_PATH" 2>/dev/null | grep -c '"type":"error"\|prompt is too long\|context.*limit\|token.*exceed' || echo "0")

if [[ "$RECENT_ERRORS" -gt 0 ]]; then
  # Track consecutive errors
  PREV_ERROR_COUNT=0
  if [[ -f "$ERROR_COUNT_FILE" ]]; then
    PREV_ERROR_COUNT=$(cat "$ERROR_COUNT_FILE" 2>/dev/null || echo "0")
  fi
  NEW_ERROR_COUNT=$((PREV_ERROR_COUNT + 1))
  echo "$NEW_ERROR_COUNT" > "$ERROR_COUNT_FILE"

  log "Detected errors in transcript: recent=$RECENT_ERRORS consecutive=$NEW_ERROR_COUNT"

  # If we've seen 3+ consecutive error iterations, stop blocking
  if [[ "$NEW_ERROR_COUNT" -ge 3 ]]; then
    log "ERROR: $NEW_ERROR_COUNT consecutive error iterations - stopping loop to prevent runaway"
    echo "Too many consecutive errors detected. Stopping loop." >&2
    rm -f "$ERROR_COUNT_FILE"
    rm "$PROJECT_STATE_FILE"
    exit 0
  fi
else
  # Reset error count on successful iteration
  rm -f "$ERROR_COUNT_FILE" 2>/dev/null || true
fi

# =============================================================================
# SAFETY CHECK 3: Iteration velocity (runaway detection)
# If iterations are happening faster than 10 seconds apart, something is wrong.
# Normal iterations with tool use take 30+ seconds minimum.
# =============================================================================
TIMESTAMP_FILE="$STATE_DIR/${SESSION_ID}-last-iteration-ts"
CURRENT_TS=$(date +%s)

if [[ -f "$TIMESTAMP_FILE" ]]; then
  LAST_TS=$(cat "$TIMESTAMP_FILE" 2>/dev/null || echo "0")
  ELAPSED=$((CURRENT_TS - LAST_TS))

  if [[ "$ELAPSED" -lt 10 ]] && [[ "$ELAPSED" -ge 0 ]]; then
    # Track fast iterations
    FAST_COUNT_FILE="$STATE_DIR/${SESSION_ID}-fast-count"
    FAST_COUNT=0
    if [[ -f "$FAST_COUNT_FILE" ]]; then
      FAST_COUNT=$(cat "$FAST_COUNT_FILE" 2>/dev/null || echo "0")
    fi
    FAST_COUNT=$((FAST_COUNT + 1))
    echo "$FAST_COUNT" > "$FAST_COUNT_FILE"

    log "WARNING: Fast iteration detected: ${ELAPSED}s (count: $FAST_COUNT)"

    # 5 consecutive fast iterations = runaway
    if [[ "$FAST_COUNT" -ge 5 ]]; then
      log "ERROR: Runaway detected - $FAST_COUNT iterations in <10s each. Stopping loop."
      echo "Runaway iteration detected (too fast). Stopping loop." >&2
      rm -f "$FAST_COUNT_FILE" "$TIMESTAMP_FILE"
      rm "$PROJECT_STATE_FILE"
      exit 0
    fi
  else
    # Normal speed, reset fast count
    rm -f "$STATE_DIR/${SESSION_ID}-fast-count" 2>/dev/null || true
  fi
fi

# Update timestamp for next iteration
echo "$CURRENT_TS" > "$TIMESTAMP_FILE"

# Check for completion promise
if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")

  if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
    echo "Detected <promise>$COMPLETION_PROMISE</promise> - Everything loop complete!"
    # Cleanup state and tracking files
    rm -f "$PROJECT_STATE_FILE"
    rm -f "$STATE_DIR/${SESSION_ID}-error-count" 2>/dev/null || true
    rm -f "$STATE_DIR/${SESSION_ID}-fast-count" 2>/dev/null || true
    rm -f "$STATE_DIR/${SESSION_ID}-last-iteration-ts" 2>/dev/null || true
    exit 0
  fi
fi

# Check for ALL_FEATURES_DONE for fixed scope projects
if [[ "$PROJECT_TYPE" = "fixed" ]]; then
  if echo "$LAST_OUTPUT" | grep -q "<promise>ALL_FEATURES_DONE</promise>"; then
    echo "All features complete - Everything loop finished!"
    # Cleanup state and tracking files
    rm -f "$PROJECT_STATE_FILE"
    rm -f "$STATE_DIR/${SESSION_ID}-error-count" 2>/dev/null || true
    rm -f "$STATE_DIR/${SESSION_ID}-fast-count" 2>/dev/null || true
    rm -f "$STATE_DIR/${SESSION_ID}-last-iteration-ts" 2>/dev/null || true
    exit 0
  fi
fi

# Not complete - determine next prompt based on current state
NEXT_ITERATION=$((ITERATION + 1))

# Read backlog state if exists
BACKLOG_FILE="$STATE_DIR/${SESSION_ID}-backlog.md"
BACKLOG_STATUS=""
if [[ -f "$BACKLOG_FILE" ]]; then
  BACKLOG_FRONTMATTER=$(parse_frontmatter "$BACKLOG_FILE")
  TOTAL_FEATURES=$(get_field "$BACKLOG_FRONTMATTER" "total_features")
  COMPLETED_FEATURES=$(get_field "$BACKLOG_FRONTMATTER" "completed_features")
  BACKLOG_STATUS="Features: $COMPLETED_FEATURES/$TOTAL_FEATURES complete"
fi

# Generate next prompt based on loop and phase
generate_next_prompt() {
  local loop="$1"
  local phase="$2"

  if [[ "$loop" = "outer" ]]; then
    case "$phase" in
      planning)
        cat << 'PROMPT'
## Continue Everything Loop - PLANNING PHASE

Read the project state file and backlog to understand current status.

**Your task:**
1. Review the project description and requirements
2. If backlog is empty, break down requirements into features
3. Create feature entries in the backlog with clear descriptions
4. Once backlog is ready, update state to `current_phase: feature_selection`

**State files:**
- Project: state/${SESSION_ID}-project.md
- Backlog: state/${SESSION_ID}-backlog.md

Use TodoWrite to track progress. Be thorough but efficient.
PROMPT
        ;;
      feature_selection)
        cat << 'PROMPT'
## Continue Everything Loop - FEATURE SELECTION PHASE

**Your task:**
1. Read the backlog and identify the next feature to implement
2. Consider dependencies and priority
3. Create a feature state file for the selected feature
4. Update project state: `current_loop: inner`, `current_phase: discovery`, `active_feature_id: <feature_id>`

Select features that are "Ready" status first, then prioritize by impact.
PROMPT
        ;;
      *)
        cat << 'PROMPT'
## Continue Everything Loop - OUTER LOOP

Review project and backlog state, then continue with appropriate action.
Check if there are features to implement or if planning is needed.
PROMPT
        ;;
    esac
  else
    # Inner loop - feature development
    case "$phase" in
      discovery)
        cat << 'PROMPT'
## Continue Everything Loop - DISCOVERY PHASE

**Your task:**
1. Read the feature state file to understand what needs to be built
2. Parse and understand the feature requirements
3. Identify key questions and scope boundaries
4. Document your understanding in the feature state file
5. Update phase to `exploration`

Focus on understanding WHAT, not HOW yet.
PROMPT
        ;;
      exploration)
        cat << 'PROMPT'
## Continue Everything Loop - EXPLORATION PHASE

**Your task:**
1. Launch 2-3 code-explorer agents in parallel
2. Each agent should explore different aspects:
   - Similar features/patterns
   - Architecture and abstractions
   - Integration points
3. Collect lists of key files to read
4. Read identified files to build deep context
5. Update phase to `clarification`

Be thorough - understanding the codebase deeply prevents rework.
PROMPT
        ;;
      clarification)
        cat << 'PROMPT'
## Continue Everything Loop - CLARIFICATION PHASE (AUTONOMOUS)

**CRITICAL: Make ALL decisions autonomously. NO user questions.**

**Your task:**
1. Launch requirements-analyst agent to analyze ambiguities
2. For each underspecified aspect, make a decision and document rationale
3. Record all decisions in state/{SESSION_ID}-decisions.md with:
   - Decision made
   - Alternatives considered
   - Rationale (confidence 0-100)
4. Update phase to `architecture`

You are empowered to make reasonable decisions. Document everything.
PROMPT
        ;;
      architecture)
        cat << 'PROMPT'
## Continue Everything Loop - ARCHITECTURE PHASE

**Your task:**
1. Launch 2-3 code-architect agents in parallel with different focuses:
   - Minimal changes (smallest change, maximum reuse)
   - Clean architecture (maintainability, elegant abstractions)
   - Pragmatic balance (speed + quality)
2. Evaluate approaches and select the best fit
3. Document architecture decision with rationale
4. Create implementation plan with specific files and changes
5. Update phase to `implementation`

Make a decisive choice. Don't present options - pick one.
PROMPT
        ;;
      implementation)
        cat << 'PROMPT'
## Continue Everything Loop - IMPLEMENTATION PHASE (TDD)

**Your task:**
1. Launch test-architect agent to design test strategy
2. Write failing tests FIRST (unit, integration as needed)
3. Implement until tests pass
4. Verify coverage >= 80%
5. Update feature state with implementation status
6. When tests pass, update phase to `review`

TDD is mandatory. Red -> Green -> Refactor.
PROMPT
        ;;
      review)
        cat << 'PROMPT'
## Continue Everything Loop - REVIEW PHASE

**Your task:**
1. Launch ALL review agents IN PARALLEL:
   - code-reviewer (quality, bugs, conventions)
   - red-team-agent (security, adversarial scenarios)
2. Collect and prioritize findings (confidence >= 80 only)
3. Fix CRITICAL issues before proceeding
4. Document any deferred issues
5. When quality gates pass, update phase to `complete`

Quality gates: No critical issues, confidence >= 80 threshold.
PROMPT
        ;;
      complete)
        cat << 'PROMPT'
## Continue Everything Loop - FEATURE COMPLETE

**Your task:**
1. Update the backlog: mark feature as Completed
2. Document what was built in the feature state file
3. Return to outer loop: `current_loop: outer`, `current_phase: feature_selection`
4. Clear active_feature_id

If all features are done and project_type is "fixed", output:
<promise>ALL_FEATURES_DONE</promise>

Otherwise, continue to next feature.
PROMPT
        ;;
      *)
        cat << 'PROMPT'
## Continue Everything Loop - INNER LOOP

Review feature state and continue with appropriate phase.
Check current phase and proceed accordingly.
PROMPT
        ;;
    esac
  fi
}

NEXT_PROMPT=$(generate_next_prompt "$CURRENT_LOOP" "$CURRENT_PHASE")

# Replace ${SESSION_ID} placeholder in prompt
NEXT_PROMPT=$(echo "$NEXT_PROMPT" | sed "s/\${SESSION_ID}/$SESSION_ID/g")

# Update iteration in state file
TEMP_FILE="${PROJECT_STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$PROJECT_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$PROJECT_STATE_FILE"

# Build system message
if [[ -n "$COMPLETION_PROMISE" ]] && [[ "$COMPLETION_PROMISE" != "null" ]]; then
  SYSTEM_MSG="Everything Loop iteration $NEXT_ITERATION | Loop: $CURRENT_LOOP | Phase: $CURRENT_PHASE | $BACKLOG_STATUS | Exit: <promise>$COMPLETION_PROMISE</promise>"
else
  SYSTEM_MSG="Everything Loop iteration $NEXT_ITERATION | Loop: $CURRENT_LOOP | Phase: $CURRENT_PHASE | $BACKLOG_STATUS"
fi

log "Continuing: iteration=$NEXT_ITERATION prompt_length=${#NEXT_PROMPT} (safety checks passed)"

# Output JSON to block stop and re-inject prompt
jq -n \
  --arg prompt "$NEXT_PROMPT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $prompt,
    "systemMessage": $msg
  }'

exit 0

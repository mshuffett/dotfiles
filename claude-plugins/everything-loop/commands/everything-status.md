---
description: Check status of active Everything Loop
---

# Everything Loop Status

Check the current status of the active Everything Loop.

## Session ID

${CLAUDE_SESSION_ID}

## Your Task

1. **Check if loop is active** by looking for `state/${CLAUDE_SESSION_ID}-project.md`

2. If active, **read and report**:
   - Current iteration and max iterations
   - Project type (fixed/continuous)
   - Current loop (outer/inner) and phase
   - Active feature (if any)

3. **Read backlog** at `state/${CLAUDE_SESSION_ID}-backlog.md`:
   - Total features vs completed
   - Features in progress
   - Features ready
   - Features blocked

4. **Read decisions log** at `state/${CLAUDE_SESSION_ID}-decisions.md`:
   - Total autonomous decisions made
   - Recent decisions

5. If active feature, **read feature state** at `state/${CLAUDE_SESSION_ID}-feature-<id>.md`:
   - Current phase
   - TDD status
   - Implementation progress

## Output Format

```
Everything Loop Status
====================

Session: <session_id>
Status: ACTIVE | NOT ACTIVE

Iteration: <N> / <max>
Project Type: fixed | continuous
Current: <loop> loop → <phase> phase

Backlog Progress: <completed>/<total> features
  In Progress: <count>
  Ready: <count>
  Blocked: <count>

Active Feature: <feature_id or "none">
  Phase: <phase>
  TDD: tests_written=<bool> tests_passing=<bool>

Autonomous Decisions: <count>
  Recent: <last 3 decisions>
```

If no active loop, report:
```
Everything Loop Status
====================

No active Everything Loop for this session.

Start one with: /everything <description>
```

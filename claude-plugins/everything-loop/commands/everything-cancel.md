---
description: Cancel active Everything Loop and cleanup state
---

# Cancel Everything Loop

Cancel the active Everything Loop and clean up state files.

## Session ID

${CLAUDE_SESSION_ID}

## Your Task

1. **Check if loop is active** by looking for `state/${CLAUDE_SESSION_ID}-project.md`

2. If active:
   - **Read current state** to report final status
   - **List all state files** for this session
   - **Delete all state files**:
     - `state/${CLAUDE_SESSION_ID}-project.md`
     - `state/${CLAUDE_SESSION_ID}-backlog.md`
     - `state/${CLAUDE_SESSION_ID}-decisions.md`
     - `state/${CLAUDE_SESSION_ID}-feature-*.md` (all feature files)

3. **Report cancellation**:

```
Everything Loop Cancelled
========================

Session: <session_id>

Final Status:
  Iteration: <N> / <max>
  Features Completed: <N> / <total>
  Autonomous Decisions: <N>

Files Removed:
  - <list of deleted files>

The loop has been cancelled. You can start a new one with:
  /everything <description>
```

4. If no active loop:

```
Everything Loop Cancel
=====================

No active Everything Loop for this session.
Nothing to cancel.
```

## Important

- This action is immediate and cannot be undone
- Any in-progress work will be abandoned
- State files are permanently deleted
- The current Claude session will continue normally after cancellation

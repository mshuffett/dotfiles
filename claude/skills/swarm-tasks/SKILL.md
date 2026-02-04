---
description: Use when managing tasks for a swarm/team. TaskCreate writes to session list, not team list - use this skill to write tasks to the correct team directory.
---

# Swarm Task Management

## The Problem

When you create a team with `Teammate.spawnTeam`, tasks live in:
```
~/.claude/tasks/{team-name}/
```

But when YOU use `TaskCreate`, it writes to your session's task list:
```
~/.claude/tasks/{session-uuid}/
```

**Result**: Agents can't see tasks you create. You talk past each other.

## Solution: Write Tasks Directly to Team Directory

### Create a Task for Team

```bash
# Get next available ID
TEAM="your-team-name"
NEXT_ID=$(($(ls ~/.claude/tasks/$TEAM/*.json 2>/dev/null | wc -l) + 1))

# Write task
cat > ~/.claude/tasks/$TEAM/$NEXT_ID.json << 'EOF'
{
  "id": "N",
  "subject": "Task title",
  "description": "Detailed description of what needs to be done.",
  "status": "pending",
  "owner": "",
  "blocks": [],
  "blockedBy": ["1", "2"]
}
EOF
```

### Task JSON Schema

```json
{
  "id": "string (sequential number as string)",
  "subject": "string (brief title)",
  "description": "string (detailed requirements)",
  "status": "pending | in_progress | completed",
  "owner": "string (agent name or empty)",
  "activeForm": "string (present tense for spinner, optional)",
  "blocks": ["array of task IDs this blocks"],
  "blockedBy": ["array of task IDs blocking this"]
}
```

### Read Team Task Status

```bash
# List all tasks
ls ~/.claude/tasks/$TEAM/

# View a task
cat ~/.claude/tasks/$TEAM/1.json | jq

# Find incomplete tasks
for f in ~/.claude/tasks/$TEAM/*.json; do
  status=$(jq -r '.status' "$f")
  if [ "$status" != "completed" ]; then
    jq -r '"\(.id): \(.subject) [\(.status)]"' "$f"
  fi
done
```

### Update a Task

```bash
# Mark task complete
jq '.status = "completed" | .owner = "agent-name"' \
  ~/.claude/tasks/$TEAM/3.json > /tmp/task.json && \
  mv /tmp/task.json ~/.claude/tasks/$TEAM/3.json
```

## Best Practices from Experience

### Before Spawning Agents

1. **Create all tasks FIRST** - Agents check TaskList on startup
2. **Create tasks in team directory** - Not with TaskCreate
3. **Set up dependencies** - Use blockedBy to sequence work

### Spawning Agents

1. **Spawn critical-path agents first** - Wait for output before spawning blocked agents
2. **Don't spawn blocked agents** - They burn API calls waiting
3. **Include explicit paths in prompts**: "Create files in /path/to/project/"

### Agent Prompts Should Include

```
## Working Directory
All files go in: /full/path/to/project/

## Task Workflow
1. Run TaskList to see available tasks
2. Claim task: TaskUpdate with owner="your-name", status="in_progress"
3. Do the work
4. Complete: TaskUpdate with status="completed"
5. Check TaskList for next task

## Communication
- Message team-lead if blocked
- Only report work as DONE when files exist on disk
```

### Verifying Agent Work

Always verify claims:
```bash
# Check if files actually exist
ls /path/claimed/by/agent/

# Run tests
cargo test  # or npm test, etc.
```

Agents may report work as "done" before files are written or when files don't exist.

### Shutting Down Agents

Shutdown requests are graceful - agents may keep working. To force:
```bash
# Find agent's pane
tmux list-panes -a | grep agent-name

# Kill it
tmux kill-pane -t %PANE_ID
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Agents see empty TaskList | Tasks in wrong directory | Write to team directory |
| Agents report phantom work | Hallucination OR timing | Wait, then verify filesystem |
| Agents ask permission | Prompt too passive | Add "Act autonomously" |
| Blocked agents idle | Spawned too early | Spawn when work available |
| Agents can't see files | Wrong cwd or stale view | Use absolute paths in prompts |
| Cramped tmux on laptop | All agents in one window | Break into separate windows |

## Tmux Tips

### Separate Windows per Agent (better for laptops)
```bash
# Move agent panes to their own windows
tmux break-pane -s %PANE_ID -n agent-name

# Navigate between agents
Ctrl+b 3  # Go to window 3
Ctrl+b n  # Next window
Ctrl+b p  # Previous window
```

### Find Agent Panes
```bash
tmux list-panes -a | grep -E "(architect|core|verifier)"
```

## Patience with Verification

**Don't assume agents are hallucinating.** File operations take time.

If agent reports work but files don't exist:
1. Wait 30-60 seconds
2. Check again
3. If still missing, THEN follow up

The agent may be mid-write when you check.

## Acceptance Checks

- [ ] Tasks written to `~/.claude/tasks/{team-name}/` not session UUID
- [ ] Agents can see tasks when running TaskList
- [ ] Dependencies (blockedBy) set correctly
- [ ] Agent work verified with filesystem checks

---
name: swarm-orchestrator
description: >
  Orchestrate multi-agent swarms using native Claude Code team tools. Use when spawning teammates,
  coordinating parallel work, managing tasks across agents, or troubleshooting swarm communication.
  Automatically detects if you're the team lead or a teammate and provides role-specific guidance.
read_when:
  - About to spawn a team or teammates
  - Working with Teammate, SendMessage, or Task* tools
  - Coordinating multi-agent work
  - Debugging swarm communication issues
  - User mentions "swarm", "team", "agents", or "parallel work"
allowed_tools: Teammate(*), SendMessage(*), Task(*), Bash(tmux:*)
---

# Swarm Orchestration with Native Claude Code Tools

## Role Detection

Check your environment to understand your role:

```bash
# Are you in a team?
echo "Team: ${CLAUDE_CODE_TEAM_NAME:-not in team}"
echo "Agent ID: ${CLAUDE_CODE_AGENT_ID:-no ID}"
echo "Agent Type: ${CLAUDE_CODE_AGENT_TYPE:-no type}"
```

| Variable | Team Lead | Teammate |
|----------|-----------|----------|
| `CLAUDE_CODE_TEAM_NAME` | Set (you created it) | Set (assigned on join) |
| `CLAUDE_CODE_AGENT_ID` | Usually empty | Your assigned name |
| `CLAUDE_CODE_AGENT_TYPE` | `team-lead` or empty | `worker` or custom |

## Native Tools Overview

### Teammate Tool (Team Management)

```
Teammate.spawnTeam      Create a new team
Teammate.discoverTeams  List available teams to join
Teammate.requestJoin    Request to join a team
Teammate.approveJoin    Approve join request (leader only)
Teammate.rejectJoin     Reject join request (leader only)
Teammate.cleanup        Remove team resources when done
```

### SendMessage Tool (Communication)

```
SendMessage.message     Direct message to one teammate
SendMessage.broadcast   Message all teammates (use sparingly - expensive!)
SendMessage.request     Protocol requests (shutdown, plan_approval)
SendMessage.response    Respond to protocol requests
```

### Task Tools (Work Coordination)

```
TaskCreate   Create a task (writes to session list, not team list!)
TaskList     List tasks in current context
TaskGet      Get full task details
TaskUpdate   Update task status, owner, dependencies
```

## Team Lead Workflow

### 1. Create Team and Tasks

```json
// Create team
{
  "operation": "spawnTeam",
  "team_name": "my-feature",
  "description": "Implementing authentication feature"
}
```

**CRITICAL**: TaskCreate writes to YOUR session list, not the team list. See [references/patterns.md](references/patterns.md) for the workaround using direct file writes.

### 2. Spawn Teammates

Use the Task tool with `team_name` parameter:

```json
{
  "description": "Implement auth module",
  "prompt": "You are working on team 'my-feature'. Check TaskList for available work...",
  "subagent_type": "general-purpose",
  "team_name": "my-feature",
  "name": "auth-worker"
}
```

### 3. Monitor and Coordinate

- Teammates send idle notifications automatically when they finish
- Use `SendMessage.message` to give specific instructions
- Use `SendMessage.request` with `subtype: "shutdown"` to gracefully stop teammates

### 4. Cleanup

```json
{
  "operation": "cleanup"
}
```

**Note**: Cleanup fails if teammates are still active. Shut them down first.

## Teammate Workflow

### 1. Check Available Tasks

```
TaskList
```

### 2. Claim and Work

```json
// Claim task
{
  "taskId": "1",
  "status": "in_progress",
  "owner": "your-agent-id"
}
```

### 3. Complete and Report

```json
// Mark complete
{
  "taskId": "1",
  "status": "completed"
}
```

The system automatically notifies the team lead when you become idle.

### 4. Communicate When Needed

```json
// Message team lead
{
  "type": "message",
  "recipient": "team-lead",
  "content": "Blocked on task 3 - need API credentials"
}
```

## Critical Gotchas

### Task Directory Mismatch

TaskCreate writes to: `$CLAUDE_CONFIG_DIR/tasks/{session-uuid}/`
Team tasks live in: `$CLAUDE_CONFIG_DIR/tasks/{team-name}/`

(For claudesp variant: `~/.claude-sneakpeek/claudesp/config/tasks/`)

**Result**: Teammates won't see tasks you create with TaskCreate!

**Solution**: Write tasks directly to the team directory. See [references/patterns.md](references/patterns.md).

### Message Delivery

- Messages are automatically delivered - no need to poll
- Your text output is NOT visible to teammates - use SendMessage!
- Broadcast is expensive (sends N separate messages to N teammates)

### Shutdown Protocol

Shutdown requests are **graceful** - teammates can reject them. To force:

```bash
tmux kill-pane -t %PANE_ID
```

### Agent Hallucination

Agents may report work as "done" before files exist or when files don't exist. Always verify:

```bash
ls /path/claimed/by/agent/
```

## tmux Tips for Swarm Management

### Find Agent Panes

```bash
tmux list-panes -a -F "#{pane_id} #{pane_current_command}"
```

### Separate Windows per Agent (Better for Laptops)

```bash
# Move cramped agent panes to their own windows
tmux break-pane -s %PANE_ID -n agent-name

# Navigate
Ctrl+b n  # Next window
Ctrl+b p  # Previous window
Ctrl+b 3  # Window 3
```

### Watch Agent Output

```bash
# In a separate pane
tmux capture-pane -t %AGENT_PANE -p | tail -50
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Agents see empty TaskList | Tasks in session dir | Write to team directory |
| Messages not received | Using text instead of tool | Use SendMessage tool |
| Cleanup fails | Teammates still active | Send shutdown requests first |
| Agent reports phantom work | Hallucination or timing | Wait 30-60s, then verify filesystem |
| Agents ask for permission | Prompt too passive | Add "Act autonomously" to prompt |

## Quick Reference

### Start a Swarm

1. `Teammate.spawnTeam` - Create team
2. Write tasks to `$CLAUDE_CONFIG_DIR/tasks/{team}/` directly (not TaskCreate)
3. `Task tool` with `team_name` - Spawn teammates
4. Monitor via delivered messages

### End a Swarm

1. `SendMessage.request` (shutdown) to each teammate
2. Wait for `SendMessage.response` (approve)
3. `Teammate.cleanup`

## Deep-Dive References

| Reference | Description |
|-----------|-------------|
| [references/native-tools.md](references/native-tools.md) | Detailed tool schemas and examples |
| [references/patterns.md](references/patterns.md) | Orchestration philosophy, task decomposition, communication patterns |

## Acceptance Checks

- [ ] Understood role (lead vs teammate) from environment
- [ ] Using SendMessage for communication (not text output)
- [ ] Writing team tasks to correct directory
- [ ] Verifying agent work with filesystem checks
- [ ] Cleaning up team resources when done

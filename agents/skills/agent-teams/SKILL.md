---
name: agent-teams
description: >
  The canonical guide for Claude Code agent swarms (TeamCreate-based multi-agent coordination).
  Use when the user says "swarm", "agent team", "orchestrate agents", or when 3+ independent
  tasks should run in parallel with inter-agent messaging and coordination. Covers the full
  swarm lifecycle: planning tasks, spawning teammates, inter-agent communication via SendMessage,
  monitoring, verification, and cleanup. NOT for fire-and-forget subagents (use
  superpowers:dispatching-parallel-agents instead) or document planning (use plan-orchestrator).
allowed_tools: Teammate(*), SendMessage(*), Task(*), Bash(tmux:*)
---

# Agent Teams

Detailed reference: [agent-teams atom](../../knowledge/atoms/agent-teams.md)

## Prerequisites

Requires experimental flag:

```json
// settings.json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

## Quick Decision: Teams vs Subagents

Use **subagents** when workers report results back (lower tokens, simpler).
Use **teams** when workers need to message each other, share findings, and self-coordinate (higher tokens).

## Key Controls

- **Delegate mode** (`Shift+Tab`): Prevents lead from implementing — coordination only
- **Task sizing**: Aim for 5-6 tasks per teammate
- **File conflicts**: Assign non-overlapping files to each teammate
- **Plan approval**: Spawn with "require plan approval" for risky work
- **Permissions**: Pre-approve common operations before spawning to reduce friction

## Model Configuration

**Always pass an explicit `model` parameter** when spawning teammates via Task tool. Do NOT rely on `inherit` — model inheritance is buggy for tmux-spawned teammates (known issue, partially fixed through v2.1.47 but still unreliable).

- Use `model: "haiku"` for simple bash/checking tasks
- Use `model: "sonnet"` for research, code review, moderate complexity
- Use `model: "opus"` only for complex reasoning tasks

## Role Detection

Check your environment to understand your role:

```bash
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
{
  "operation": "spawnTeam",
  "team_name": "my-feature",
  "description": "Implementing authentication feature"
}
```

**CRITICAL**: TaskCreate writes to YOUR session list, not the team list. See [references/patterns.md](references/patterns.md) for the workaround.

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

Cleanup fails if teammates are still active. Shut them down first, then:

```json
{ "operation": "cleanup" }
```

## Teammate Workflow

1. **Check tasks**: `TaskList`
2. **Claim**: `TaskUpdate` with `status: "in_progress"` and `owner: "your-agent-id"`
3. **Complete**: `TaskUpdate` with `status: "completed"` (system auto-notifies lead)
4. **Communicate**: Use `SendMessage.message` when blocked or need coordination

## Critical Gotchas

### Task Directory Mismatch

TaskCreate writes to: `~/.claude/tasks/{session-uuid}/`
Team tasks live in: `~/.claude/tasks/{team-name}/`

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

Agents may report work as "done" before files exist. Always verify:

```bash
ls /path/claimed/by/agent/
```

## Keyboard Shortcuts (In-Process Mode)

| Shortcut | Action |
|----------|--------|
| `Shift+Up/Down` | Select teammate |
| `Enter` | View teammate's session |
| `Escape` | Interrupt teammate's turn |
| `Ctrl+T` | Toggle task list |
| `Shift+Tab` | Delegate mode |

## Quality Gate Hooks

- **TeammateIdle**: Exit code 2 = send feedback, keep working
- **TaskCompleted**: Exit code 2 = prevent completion, send feedback

## tmux Tips

```bash
# Find agent panes
tmux list-panes -a -F "#{pane_id} #{pane_current_command}"

# Move cramped panes to own windows
tmux break-pane -s %PANE_ID -n agent-name

# Watch agent output
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

## Known Limitations

- No session resumption for in-process teammates
- One team per session; no nested teams
- Lead is fixed (can't promote)
- Split panes don't work in VS Code terminal, Windows Terminal, Ghostty

## Quick Reference

### Start a Team

1. `Teammate.spawnTeam` - Create team
2. Write tasks to `~/.claude/tasks/{team}/` directly (not TaskCreate)
3. `Task tool` with `team_name` - Spawn teammates
4. Monitor via delivered messages

### End a Team

1. `SendMessage.request` (shutdown) to each teammate
2. Wait for `SendMessage.response` (approve)
3. `Teammate.cleanup`

## Deep-Dive References

| Reference | Description |
|-----------|-------------|
| [references/native-tools.md](references/native-tools.md) | Detailed tool schemas and examples |
| [references/patterns.md](references/patterns.md) | Orchestration philosophy, task decomposition, communication patterns |

## Acceptance Checks

- [ ] `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` enabled
- [ ] Display mode appropriate to terminal
- [ ] Tasks sized ~5-6 per teammate
- [ ] Non-overlapping file assignments
- [ ] Explicit `model` set on each teammate (not `inherit`)
- [ ] Using SendMessage for communication (not text output)
- [ ] Writing team tasks to correct directory
- [ ] Verifying agent work with filesystem checks
- [ ] Team cleaned up via lead when done

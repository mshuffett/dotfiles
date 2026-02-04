# Native Swarm Tools Reference

Detailed schemas and examples for Claude Code's native multi-agent tools.

## Teammate Tool

### spawnTeam - Create a Team

Creates a team file at `~/.claude/teams/{team-name}.json` and corresponding task directory.

```json
{
  "operation": "spawnTeam",
  "team_name": "feature-auth",
  "description": "Authentication feature implementation"
}
```

### discoverTeams - Find Available Teams

Lists teams from `~/.claude/teams/` that you're not already a member of.

```json
{
  "operation": "discoverTeams"
}
```

Returns:
```json
[
  {
    "name": "feature-auth",
    "description": "Authentication feature implementation",
    "leadAgentId": "abc-123",
    "memberCount": 3
  }
]
```

### requestJoin - Request Team Membership

```json
{
  "operation": "requestJoin",
  "team_name": "feature-auth",
  "proposed_name": "api-worker",
  "capabilities": "I can help with API endpoints and validation"
}
```

The leader receives a `join_request` message and can approve/reject.

### approveJoin - Accept a Join Request (Leader Only)

When you receive a join request message like:
```json
{
  "type": "join_request",
  "proposedName": "api-worker",
  "requestId": "join-abc-123",
  "capabilities": "..."
}
```

Approve with:
```json
{
  "operation": "approveJoin",
  "target_agent_id": "api-worker",
  "request_id": "join-abc-123"
}
```

### rejectJoin - Decline a Join Request (Leader Only)

```json
{
  "operation": "rejectJoin",
  "target_agent_id": "api-worker",
  "request_id": "join-abc-123",
  "reason": "Team is at capacity for this sprint"
}
```

### cleanup - Remove Team Resources

Removes team directory and task directory. **Fails if teammates are still active.**

```json
{
  "operation": "cleanup"
}
```

Team name is automatically determined from `CLAUDE_CODE_TEAM_NAME`.

---

## SendMessage Tool

### type: "message" - Direct Message

Send to **one specific teammate**. Your text output is NOT visible to others!

```json
{
  "type": "message",
  "recipient": "api-worker",
  "content": "Please prioritize the /users endpoint first"
}
```

### type: "broadcast" - Message All Teammates

**WARNING: Expensive!** Sends N separate messages to N teammates.

```json
{
  "type": "broadcast",
  "content": "Pausing all work - critical bug found in auth module"
}
```

Only use for truly team-wide announcements.

### type: "request" - Protocol Requests

#### Shutdown Request

Ask a teammate to gracefully shut down:

```json
{
  "type": "request",
  "subtype": "shutdown",
  "recipient": "api-worker",
  "content": "Task complete, wrapping up the session"
}
```

Teammate can approve (exits) or reject (continues working).

### type: "response" - Protocol Responses

#### Approve Shutdown

When you receive:
```json
{
  "type": "shutdown_request",
  "requestId": "shutdown-xyz-789"
}
```

Respond with:
```json
{
  "type": "response",
  "subtype": "shutdown",
  "request_id": "shutdown-xyz-789",
  "approve": true
}
```

This sends confirmation and terminates your process.

#### Reject Shutdown

```json
{
  "type": "response",
  "subtype": "shutdown",
  "request_id": "shutdown-xyz-789",
  "approve": false,
  "content": "Still working on task #3, need 5 more minutes"
}
```

#### Approve/Reject Plan

When a teammate with `plan_mode_required` calls ExitPlanMode:

```json
{
  "type": "response",
  "subtype": "plan_approval",
  "request_id": "plan-abc-123",
  "recipient": "api-worker",
  "approve": true
}
```

Or reject with feedback:
```json
{
  "type": "response",
  "subtype": "plan_approval",
  "request_id": "plan-abc-123",
  "recipient": "api-worker",
  "approve": false,
  "content": "Please add error handling for the API calls"
}
```

---

## Task Tools

### TaskCreate

Creates a task in your **session's** task list (NOT the team's list!).

```json
{
  "subject": "Implement user authentication",
  "description": "Create login/logout endpoints with JWT tokens",
  "activeForm": "Implementing user authentication"
}
```

**Important**: For team tasks, write directly to `~/.claude/tasks/{team-name}/`. See patterns.md.

### TaskList

Lists tasks in your current context.

Returns:
```json
[
  {
    "id": "1",
    "subject": "Implement auth endpoints",
    "status": "in_progress",
    "owner": "api-worker",
    "blockedBy": []
  },
  {
    "id": "2",
    "subject": "Write auth tests",
    "status": "pending",
    "owner": "",
    "blockedBy": ["1"]
  }
]
```

### TaskGet

Get full task details including description:

```json
{
  "taskId": "1"
}
```

### TaskUpdate

Update task status, owner, or dependencies:

```json
{
  "taskId": "1",
  "status": "completed"
}
```

```json
{
  "taskId": "2",
  "status": "in_progress",
  "owner": "test-worker"
}
```

```json
{
  "taskId": "3",
  "addBlockedBy": ["1", "2"]
}
```

Valid statuses: `pending`, `in_progress`, `completed`, `deleted`

---

## Task JSON Schema (for direct file writes)

When writing tasks directly to `~/.claude/tasks/{team-name}/`:

```json
{
  "id": "1",
  "subject": "Brief task title",
  "description": "Detailed description of what needs to be done.",
  "status": "pending",
  "owner": "",
  "activeForm": "Implementing feature",
  "blocks": [],
  "blockedBy": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Sequential number as string ("1", "2", etc.) |
| `subject` | string | Brief, imperative title |
| `description` | string | Full requirements and context |
| `status` | string | `pending`, `in_progress`, `completed` |
| `owner` | string | Agent name or empty string |
| `activeForm` | string | Present tense for spinner ("Implementing...") |
| `blocks` | string[] | Task IDs this task blocks |
| `blockedBy` | string[] | Task IDs blocking this task |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_TEAM_MODE` | Enables team mode |
| `CLAUDE_CODE_TEAM_NAME` | Current team name |
| `CLAUDE_CODE_AGENT_ID` | Your unique agent identifier |
| `CLAUDE_CODE_AGENT_TYPE` | Your role: `team-lead` or `worker` |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | If "true", must enter plan mode before implementing |

---

## Reading Team Config

Discover other team members:

```bash
cat ~/.claude/teams/{team-name}/config.json | jq '.members'
```

Returns:
```json
[
  {
    "name": "team-lead",
    "agentId": "uuid-1",
    "agentType": "team-lead"
  },
  {
    "name": "api-worker",
    "agentId": "uuid-2",
    "agentType": "worker"
  }
]
```

**Always use `name` for messaging and task assignment**, not `agentId`.

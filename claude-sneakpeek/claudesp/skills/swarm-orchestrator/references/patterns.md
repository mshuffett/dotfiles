# Swarm Orchestration Patterns

Philosophy, decomposition strategies, and communication patterns for effective multi-agent coordination.

## Orchestration Philosophy

### 1. Plan Before Spawning

Bad:
```
1. Spawn 5 agents
2. Figure out tasks
3. Assign work
```

Good:
```
1. Analyze the problem
2. Decompose into independent work units
3. Identify dependencies
4. Create tasks with clear acceptance criteria
5. THEN spawn agents for parallel work
```

### 2. Minimize Coordination Overhead

Every message between agents has cost:
- API calls
- Context consumption
- Potential misunderstanding

Design work units that are **self-contained**:
- Clear inputs and outputs
- Minimal inter-agent dependencies
- Can be verified independently

### 3. Trust But Verify

Agents may:
- Report work as done before files exist
- Hallucinate file paths or content
- Misunderstand requirements

Always verify with filesystem checks before considering work complete.

---

## Task Decomposition Strategies

### Independent Parallelism

Best for: Work that can be done simultaneously with no dependencies.

```
Task 1: Implement /users endpoint      [no dependencies]
Task 2: Implement /products endpoint   [no dependencies]
Task 3: Implement /orders endpoint     [no dependencies]
```

Spawn 3 agents, they work in parallel, merge results.

### Pipeline Pattern

Best for: Work where outputs feed into inputs.

```
Task 1: Design database schema         [no dependencies]
Task 2: Implement data models          [blocked by 1]
Task 3: Implement API endpoints        [blocked by 2]
Task 4: Write integration tests        [blocked by 3]
```

Spawn agents as blockers complete, or use a single agent for the pipeline.

### Fan-Out / Fan-In

Best for: Analysis or research tasks.

```
Task 1: Research auth patterns         [no dependencies]
Task 2: Research caching strategies    [no dependencies]
Task 3: Research API design            [no dependencies]
Task 4: Synthesize findings            [blocked by 1, 2, 3]
```

Three research agents work in parallel, one synthesis agent waits.

### Critical Path First

Identify which tasks block the most other work and prioritize those.

```
Task 1: Core data structures           [blocks 2, 3, 4, 5]  <- DO THIS FIRST
Task 2: Feature A                      [blocked by 1]
Task 3: Feature B                      [blocked by 1]
Task 4: Feature C                      [blocked by 1]
Task 5: Feature D                      [blocked by 1]
```

---

## The Task Directory Problem

### The Problem

When you use `TaskCreate`, tasks go to:
```
$CLAUDE_CONFIG_DIR/tasks/{your-session-uuid}/
```

But team members look for tasks in:
```
$CLAUDE_CONFIG_DIR/tasks/{team-name}/
```

For claudesp variant, `CLAUDE_CONFIG_DIR=~/.claude-sneakpeek/claudesp/config`

**Result**: Agents see empty task lists.

### The Solution: Direct File Writes

Write tasks directly to the team directory:

```bash
TEAM="my-feature"
TASK_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/tasks"

# Get next available ID
NEXT_ID=$(($(ls $TASK_DIR/$TEAM/*.json 2>/dev/null | wc -l) + 1))

# Create task file
cat > $TASK_DIR/$TEAM/$NEXT_ID.json << 'EOF'
{
  "id": "1",
  "subject": "Implement user authentication",
  "description": "Create JWT-based auth with login/logout endpoints.\n\nRequirements:\n- POST /auth/login accepts email/password\n- POST /auth/logout invalidates token\n- Tokens expire after 24 hours",
  "status": "pending",
  "owner": "",
  "blocks": ["2", "3"],
  "blockedBy": []
}
EOF
```

### Bulk Task Creation

```bash
TEAM="my-feature"
TASK_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/tasks"
mkdir -p "$TASK_DIR/$TEAM"

# Task 1
cat > $TASK_DIR/$TEAM/1.json << 'EOF'
{
  "id": "1",
  "subject": "Set up project structure",
  "description": "Initialize project with TypeScript, ESLint, and test framework.",
  "status": "pending",
  "owner": "",
  "blocks": ["2", "3", "4"],
  "blockedBy": []
}
EOF

# Task 2
cat > $TASK_DIR/$TEAM/2.json << 'EOF'
{
  "id": "2",
  "subject": "Implement data models",
  "description": "Create User, Product, Order models with validation.",
  "status": "pending",
  "owner": "",
  "blocks": [],
  "blockedBy": ["1"]
}
EOF

# Continue for other tasks...
```

### Reading Team Tasks

```bash
TASK_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/tasks"

# List all tasks
for f in $TASK_DIR/$TEAM/*.json; do
  jq -r '"\(.id): \(.subject) [\(.status)] owner=\(.owner)"' "$f"
done

# Find unclaimed, unblocked tasks
for f in $TASK_DIR/$TEAM/*.json; do
  status=$(jq -r '.status' "$f")
  owner=$(jq -r '.owner' "$f")
  blocked=$(jq -r '.blockedBy | length' "$f")
  if [ "$status" = "pending" ] && [ "$owner" = "" ] && [ "$blocked" = "0" ]; then
    jq -r '"\(.id): \(.subject)"' "$f"
  fi
done
```

---

## Communication Patterns

### Leader → Teammate: Assignment

```json
{
  "type": "message",
  "recipient": "api-worker",
  "content": "Please claim task #3 (implement /orders endpoint). Use the existing auth middleware from task #1."
}
```

### Teammate → Leader: Status Update

```json
{
  "type": "message",
  "recipient": "team-lead",
  "content": "Task #3 complete. Created:\n- src/routes/orders.ts\n- src/services/orderService.ts\n- test/orders.test.ts\nAll tests passing."
}
```

### Teammate → Leader: Blocked

```json
{
  "type": "message",
  "recipient": "team-lead",
  "content": "Blocked on task #4. Need database credentials to run migrations. Where should I find them?"
}
```

### Leader: Graceful Shutdown

```json
{
  "type": "request",
  "subtype": "shutdown",
  "recipient": "api-worker",
  "content": "All work complete. Please shut down."
}
```

---

## Agent Prompt Best Practices

### Include Explicit Paths

Bad:
```
Create the auth module.
```

Good:
```
Create the auth module in /Users/michael/projects/my-app/src/auth/

Files to create:
- /Users/michael/projects/my-app/src/auth/index.ts
- /Users/michael/projects/my-app/src/auth/jwt.ts
- /Users/michael/projects/my-app/src/auth/middleware.ts
```

### Include Task Workflow

```
## Task Workflow
1. Run TaskList to see available tasks
2. Claim task: TaskUpdate with owner="your-name", status="in_progress"
3. Do the work
4. Complete: TaskUpdate with status="completed"
5. Check TaskList for next task
6. Message team-lead when idle or blocked
```

### Enable Autonomy

Bad:
```
Ask for approval before making changes.
```

Good:
```
Act autonomously. Make reasonable decisions without asking.
Only message the team lead if genuinely blocked on missing information.
```

### Specify Communication Expectations

```
## Communication
- Message team-lead only when:
  - Blocked on missing information
  - Task requirements are ambiguous
  - Discovered a problem affecting other tasks
- Do NOT message for routine progress updates
- Do NOT ask permission for implementation decisions
```

---

## Verification Patterns

### Verify File Existence

```bash
# Check claimed files exist
for file in src/auth/index.ts src/auth/jwt.ts; do
  if [ -f "$file" ]; then
    echo "✓ $file exists"
  else
    echo "✗ $file MISSING"
  fi
done
```

### Verify Tests Pass

```bash
npm test -- --grep "auth"
```

### Verify Build Succeeds

```bash
npm run build
```

### Diff Before/After

```bash
# Before spawning agents
git status > /tmp/before.txt

# After work completes
git status > /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt
```

---

## Anti-Patterns to Avoid

### Over-Communication

Bad: Agents messaging after every small action.

Good: Agents work autonomously, message only when blocked or complete.

### Under-Specification

Bad: "Implement the feature"

Good: "Implement JWT auth with these specific endpoints, using these specific libraries, outputting these specific files"

### Premature Spawning

Bad: Spawn 10 agents, then figure out what they should do.

Good: Create all tasks first, then spawn agents as needed.

### Ignoring Dependencies

Bad: Spawn all agents at once, let them figure out order.

Good: Spawn blocked agents only after blockers complete.

### No Verification

Bad: Agent says "done", mark task complete.

Good: Agent says "done", verify filesystem, run tests, THEN mark complete.

---

## Swarm Lifecycle

```
1. PLAN
   - Analyze problem
   - Decompose into tasks
   - Identify dependencies
   - Write tasks to team directory

2. SPAWN
   - Create team (Teammate.spawnTeam)
   - Spawn agents for unblocked tasks
   - Provide detailed prompts with paths and workflow

3. MONITOR
   - Receive automatic idle notifications
   - Handle blocked requests
   - Spawn more agents as tasks unblock

4. VERIFY
   - Check filesystem for claimed files
   - Run tests
   - Verify build succeeds

5. CLEANUP
   - Send shutdown requests
   - Wait for confirmations
   - Call Teammate.cleanup
```

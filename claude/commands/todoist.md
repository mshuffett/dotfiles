---
description: Todoist task management via REST API v2. Use when user asks to create tasks, work with Todoist, or process task lists. Includes API patterns, priority mapping, project IDs, and task creation examples.
---

# Todoist Task Management

## When to Use This Command
- User explicitly asks to create a Todoist task
- User requests help with Todoist task processing or organization
- User mentions working with their task list or inbox
- **DO NOT** create tasks proactively without user request

## Maintaining This Command

**When you learn something new about Todoist workflow:**
- **ADD** new patterns, examples, or best practices to this file
- **ENHANCE** existing sections with additional context
- **DO NOT REMOVE** existing content (might cause regressions)
- **COMMIT** changes to dotfiles immediately after updates
- Document the learning in context (why it matters, when to use)

## Creating Tasks (REST API v2)

### Basic Task Creation
```bash
curl -X POST "https://api.todoist.com/rest/v2/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Task title",
    "description": "Longer description with markdown support",
    "priority": 4,
    "project_id": "377445380"
  }'
```

### Priority Levels
- `4` = P1 (highest priority - red)
- `3` = P2 (orange)
- `2` = P3 (yellow)
- `1` = P4 (normal, default - white)

### Common Parameters
- `content` (required) - Task title
- `description` - Longer description with markdown support
- `project_id` - Default: 377445380 (Inbox)
- `due_string` - Natural language: "tomorrow", "next Monday", "Oct 15"
- `due_date` - ISO format: "2025-10-15"
- `labels` - Array of label IDs

### Environment Variable
The `TODOIST_API_TOKEN` environment variable is already configured in ~/.zshrc.
No additional setup needed - just use `$TODOIST_API_TOKEN` in commands.

## Project IDs (Quick Reference)

### PARA Structure Parents
- **1-Projects**: 2359994569
- **2-Areas**: 2359994572
- **3-Resources**: 2359995015

### Active Projects (under 1-Projects)
- **🚢🏖️ Ship to Beach Dashboard**: 2360927142 (repo maintenance & improvements)
- **🚢🏖️ Sprint Execution**: 2360927149 (actual sprint shipping work)

### Default Project
- **Inbox**: 377445380

## API Patterns & Limitations

### Python API Helper (Recommended for Scripting)
**Use Python instead of curl + jq for complex operations:**

```python
import os
import json
import urllib.request

token = os.environ.get('TODOIST_API_TOKEN')
headers = {'Authorization': f'Bearer {token}'}

def get_tasks(filter_str=None):
    """Fetch tasks with optional filter"""
    url = 'https://api.todoist.com/rest/v2/tasks'
    if filter_str:
        url += f'?filter={filter_str}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def update_task(task_id, **kwargs):
    """Update task with any parameters"""
    url = f'https://api.todoist.com/rest/v2/tasks/{task_id}'
    data = json.dumps(kwargs).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

# Examples:
tasks_today = get_tasks('today')
tasks_tomorrow = get_tasks('tomorrow')
all_tasks = get_tasks()

# Filter in Python (more reliable than API filters)
inbox_no_date = [t for t in all_tasks if t['project_id'] == '377445380' and t.get('due') is None]
```

**Why Python over curl + jq:**
- jq has parsing issues with some Todoist API responses
- Python's json library is more reliable
- Easier to filter and process task data
- No shell quoting/escaping headaches

### Moving Tasks (Use Sync API v9, NOT REST v2)
REST API v2 CANNOT move tasks between projects. Use Sync API:

```bash
curl -X POST "https://api.todoist.com/sync/v9/sync" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sync_token": "*",
    "commands": [{
      "type": "item_move",
      "uuid": "'$(uuidgen)'",
      "args": {
        "id": "TASK_ID",
        "project_id": "NEW_PROJECT_ID"
      }
    }]
  }'
```

**Python version (preferred):**
```python
def move_task(task_id, project_id):
    """Move task to different project using Sync API"""
    import uuid
    url = 'https://api.todoist.com/sync/v9/sync'
    data = json.dumps({
        "sync_token": "*",
        "commands": [{
            "type": "item_move",
            "uuid": str(uuid.uuid4()),
            "args": {
                "id": task_id,
                "project_id": project_id
            }
        }]
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())
```

### Removing Due Dates
Use string `"no date"` (NOT null or empty):
```bash
curl -X POST "https://api.todoist.com/rest/v2/tasks/TASK_ID" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -d '{"due_string": "no date"}'
```

**Python version:**
```python
update_task(task_id, due_string="no date")
```

## Bulk Operations & Scripts

For bulk operations, see scripts in:
`~/ws/everything-monorepo/notes/5-Tools/Todoist/scripts/`

- `check_inbox.sh` - Quick inbox status
- `move_tasks.sh` - Bulk move between projects
- `remove_dates.sh` - Bulk date removal

## Task Processing Guidelines

### Daily Task Limits
- **Maximum 5-7 tasks per day** for optimal productivity
- Tomorrow often gets overloaded (40-60 tasks) - need to triage

### Task Categories
1. **Wisdom/Philosophy** → Remove dates (timeless content)
2. **Ideas** → Move to Ideas Backlog or Fun List
3. **Delegated tasks** → Check assignee before processing
4. **Vague reflections** → Often can be deleted

## Reference Documentation
Full workflow guides and learnings:
- `~/ws/everything-monorepo/notes/5-Tools/Todoist/TODOIST_LEARNINGS.md`
- `~/ws/everything-monorepo/notes/5-Tools/Todoist/workflow_guide.md`
- `~/ws/everything-monorepo/notes/2-Areas/System/📋 Comprehensive Todoist Management Guidelines.md`

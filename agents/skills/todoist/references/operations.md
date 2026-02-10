# Todoist Operations (Reference)

This is a deep-dive reference linked from the Todoist entrypoint skill.

**CRITICAL**: Do NOT create tasks proactively without user request.

## Core Rules

### Process ALL Tasks at Once

When user asks to "process my tasks" or "help with my todoist":
1. Fetch ALL tasks (overdue, today, inbox, etc.)
2. Present ALL tasks with numbered IDs
3. Get user instructions for ALL tasks in one interaction
4. Process ALL tasks based on those instructions
5. Do NOT stop after processing a subset

### Always Read Comments Before Processing

Comments contain critical context - links, images, detailed notes:

```python
# ALWAYS get comments before processing
task = get_task(task_id)
comments = get_comments(task_id)

# CRITICAL: Images may have empty content field - check attachment separately!
attachments = extract_attachments_from_comments(comments)

# Add link before completing
add_comment(task_id, f"cc: Moved to: {obsidian_link}")
complete_task(task_id)
```

### Task Assignment Filtering

When a task has `assignee_id` != user's ID, it's already hidden from their view. Don't suggest "hiding" or "reassigning" - it's properly delegated.

## API Reference

### Environment
`TODOIST_API_TOKEN` is configured in `~/.env.zsh`.

### Priority Levels
- `4` = P1 (red, highest)
- `3` = P2 (orange)
- `2` = P3 (yellow)
- `1` = P4 (white, default)

### Project IDs

**PARA Structure:**
- 1-Projects: `2359994569`
- 2-Areas: `2359994572`
- 3-Resources: `2359995015`

**Active Projects:**
- Ship to Beach Dashboard: `2360927142`
- Sprint Execution: `2360927149`
- Inbox: `377445380`
- Daily Briefing: `6cvj7XgXH4w93WgX`
- Ideas Backlog: `2263875911`
- Everything AI Backlog: `2352252927`
- Admin: `2331010777`

**User IDs:**
- Michael: `486423`
- Michelle (assistant): `42258732`

### Python API Helper (Preferred)

```python
import os
import json
import urllib.request

token = os.environ.get('TODOIST_API_TOKEN')
headers = {'Authorization': f'Bearer {token}'}

def get_tasks(filter_str=None):
    url = 'https://api.todoist.com/rest/v2/tasks'
    if filter_str:
        url += f'?filter={filter_str}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def get_comments(task_id):
    url = f'https://api.todoist.com/rest/v2/comments?task_id={task_id}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def extract_attachments_from_comments(comments):
    """Extract attachments - images may have empty content field!"""
    attachments = []
    for comment in comments:
        if comment.get('attachment'):
            att = comment['attachment']
            attachments.append({
                'type': att.get('resource_type', 'unknown'),
                'url': att.get('file_url') or att.get('image') or att.get('url'),
                'filename': att.get('file_name'),
                'dimensions': f"{att.get('image_width')}x{att.get('image_height')}" if att.get('image_width') else None
            })
    return attachments

def add_comment(task_id, content, prefix="cc: "):
    """Add comment with 'cc:' prefix (marks as automated)"""
    url = 'https://api.todoist.com/rest/v2/comments'
    if prefix and not content.startswith(prefix):
        content = prefix + content
    data = json.dumps({'task_id': task_id, 'content': content}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def update_task(task_id, **kwargs):
    url = f'https://api.todoist.com/rest/v2/tasks/{task_id}'
    data = json.dumps(kwargs).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())
```

### Moving Tasks (Sync API v9 Required)

REST API v2 cannot move tasks between projects. Use Sync API:

```python
import uuid

def move_task(task_id, project_id):
    url = 'https://api.todoist.com/sync/v9/sync'
    data = json.dumps({
        "sync_token": "*",
        "commands": [{
            "type": "item_move",
            "uuid": str(uuid.uuid4()),
            "args": {"id": task_id, "project_id": project_id}
        }]
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())
```

### Removing Due Dates

Use string `"no date"` (NOT null):

```python
update_task(task_id, due_string="no date")
```

### Create Task (curl)

```bash
curl -X POST "https://api.todoist.com/rest/v2/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Task title", "description": "Details", "priority": 4, "project_id": "377445380"}'
```

## GTD Workflow (Ship to Beach Alignment)

### Core Principles

1. **Default No** - Only yes to highest-leverage moves toward the goal
2. **Finishing Over Starting** - 80% complete = $0; 100% = $X. Prioritize final 20%
3. **5-7 Tasks Per Day Maximum** - If overloaded, triage to future dates or remove dates

### Task Categories

| Category | Action |
|----------|--------|
| Sprint Work (clear "done" state) | Keep due date, prioritize |
| Wisdom/Philosophy | Remove date, keep in backlog |
| Ideas & Experiments | Move to Ideas project, remove date |
| Delegated (has assignee) | Verify assignment, skip |
| Vague/Unclear | Clarify or delete |
| Admin/Drudgery | Batch, delegate, or delete |

### Content Destinations

- **Articles/References** -> Clip to `3-Resources/Articles/` in Obsidian
- **Ideas** -> `3-Resources/Raw Ideas/` with full context
- **Journal/Reflections** -> `2-Areas/Journal/`
- **Grouped tasks** -> Create Obsidian project + Todoist project

### Processing Output Format

```text
| # | Task | Due | Action | Project | Reasoning | Conf |
|---|------|-----|--------|---------|-----------|------|
| 1 | Ship snapshot | Oct 3 | Keep | Current | Sprint work, final 20% | 95% |
| 2 | Read philosophy | Oct 3 | Remove date | Inbox | Timeless | 90% |
```

**Confidence:**
- 90%+ = Execute without asking
- 70-90% = Show for quick review
- <70% = Ask for guidance

### Collaboration Protocol

1. ALWAYS read comments before categorizing
2. Check for attachments (images may have empty content)
3. Propose categories for each batch
4. Get user confirmation before executing
5. Add Todoist URL to Obsidian notes: `todoist:` field in frontmatter
6. Comment on tasks with destination links before completing

**Todoist URL Format**: `https://app.todoist.com/app/task/{task_id}`

## Comment Convention

Always prefix automated comments with `cc:` to distinguish from human comments:

```python
add_comment(task_id, "cc: Moved to Raw Ideas project")  # Correct
add_comment(task_id, "Moved to Raw Ideas project")      # Wrong
```

## Reference Documentation

- `~/ws/everything-monorepo/notes/5-Tools/Todoist/TODOIST_LEARNINGS.md`
- `~/ws/everything-monorepo/notes/5-Tools/Todoist/workflow_guide.md`
- `~/ws/everything-monorepo/notes/5-Tools/Todoist/scripts/` (bulk operation scripts)

## Related Notes (Deep Dives)

- `agents/skills/todoist/references/triage.md`

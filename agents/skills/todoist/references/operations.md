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

**API v1** (as of Feb 2026 — REST v2 and Sync v9 are dead, returning 410 Gone).

Base URL: `https://api.todoist.com/api/v1`

v1 responses wrap lists in `{"results": [...], "next_cursor": "..."}`. Always paginate with `cursor` param.

```python
import os
import json
import urllib.request

token = os.environ.get('TODOIST_API_TOKEN')
headers = {'Authorization': f'Bearer {token}'}
BASE = 'https://api.todoist.com/api/v1'

def _request(url, data=None, method=None):
    """Make API request, handle paginated responses with control chars."""
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'} if data else headers)
    if method:
        req.method = method
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read(), strict=False)

def get_tasks(cursor=None):
    """Get a page of tasks (50 per page). Use cursor for pagination."""
    url = f'{BASE}/tasks'
    if cursor:
        url += f'?cursor={cursor}'
    return _request(url)  # returns {"results": [...], "next_cursor": "..."|null}

def get_all_tasks():
    """Paginate through ALL tasks."""
    all_tasks = []
    cursor = None
    while True:
        data = get_tasks(cursor)
        all_tasks.extend(data.get('results', []))
        cursor = data.get('next_cursor')
        if not cursor:
            break
    return all_tasks

def get_task(task_id):
    return _request(f'{BASE}/tasks/{task_id}')

def get_comments(task_id):
    return _request(f'{BASE}/comments?task_id={task_id}')

def extract_attachments_from_comments(comments):
    """Extract attachments - images may have empty content field!"""
    items = comments.get('results', comments) if isinstance(comments, dict) else comments
    attachments = []
    for comment in (items if isinstance(items, list) else []):
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
    if prefix and not content.startswith(prefix):
        content = prefix + content
    data = json.dumps({'task_id': task_id, 'content': content}).encode('utf-8')
    return _request(f'{BASE}/comments', data=data)

def update_task(task_id, **kwargs):
    data = json.dumps(kwargs).encode('utf-8')
    return _request(f'{BASE}/tasks/{task_id}', data=data, method='POST')

def close_task(task_id):
    return _request(f'{BASE}/tasks/{task_id}/close', data=b'{}', method='POST')

def move_task(task_id, project_id):
    """Move task to a different project (v1 has native move endpoint)."""
    data = json.dumps({'project_id': project_id}).encode('utf-8')
    return _request(f'{BASE}/tasks/{task_id}/move', data=data, method='POST')
```

### Removing Due Dates

Use string `"no date"` (NOT null):

```python
update_task(task_id, due_string="no date")
```

### Create Task (curl)

```bash
curl -X POST "https://api.todoist.com/api/v1/tasks" \
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

## Task Display Requirements

When showing tasks to the user, ALWAYS include:
- **Labels with emojis** (e.g., 🎯 Everything AI, ⚠️ Decision, ✅ Approval, 📨 Awaiting)
- **Comment count** if available (e.g., 💬 3 comments)
- **For Decision/Approval labels**: Suggest reassigning to task creator
- **Format in table**: Use nice tables for readability

## Default Task Filtering

- **v1 API does not support server-side filter params on `GET /tasks`** — fetch all tasks via pagination and filter client-side
- **DEFAULT: Filter to tasks for me** — exclude tasks assigned to others unless explicitly requested
  - Include: No `responsible_uid` OR `responsible_uid` == `"486423"` (Michael)
  - Exclude: Tasks with `responsible_uid` == `"42258732"` (Michelle) or others unless user asks for "all tasks"
- **Today view includes**: Tasks with today's date + overdue + manually moved to Today (no date)
- Use `get_all_tasks()` and filter in Python by `task.get('due', {}).get('date', '')` for date-based filtering

## Known API Limitations (v1)

- `GET /api/v1/tasks` returns 50 results per page with cursor-based pagination
- No server-side `filter=` query param on the tasks list endpoint (use `GET /api/v1/tasks/by_filter` but param format may differ)
- Responses may contain control characters in description fields — always use `json.loads(data, strict=False)`
- Shared projects (31 total) use same token but may have visibility differences

## Notes Repo Scripts & Templates

When working in `~/ws/notes`:
- **Bulk Operations:** `5-Tools/Todoist/scripts/` — `check_inbox.sh`, `move_tasks.sh`, `remove_dates.sh`
- **Processing Templates:** `5-Tools/Todoist/templates/` — `inbox_cleanup_template.md`, `idea_review_process.md`
- **Full Today view script:** `5-Tools/Todoist/scripts/fetch_today_complete.py`
- **API Reference:** `5-Tools/Todoist/TODOIST_LEARNINGS.md`

## Related Notes (Deep Dives)

- `agents/skills/todoist/references/triage.md`

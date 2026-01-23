---
name: Todoist
description: Use when user asks to create tasks, work with Todoist, process task lists, clean up inbox, triage tasks, or mentions "my tasks", "my todoist", "task management". Provides API patterns, priority mapping, project IDs, and task processing workflows.
---

# Todoist Task Management

## When This Skill Activates
- User explicitly asks to create a Todoist task
- User requests help with Todoist task processing or organization
- User mentions working with their task list or inbox
- User says "process my tasks", "clean up my todoist", "triage tasks"
- **DO NOT** create tasks proactively without user request

## CRITICAL RULE: Process ALL Tasks at Once

**NEVER stop partway through task processing**

When the user asks to "process my tasks" or "help with my todoist":
1. **Fetch ALL tasks** (overdue, today, inbox, etc.)
2. **Present ALL tasks** with numbered IDs for easy reference
3. **Get user instructions** for ALL tasks in one interaction
4. **Process ALL tasks** based on those instructions
5. **Do NOT stop after processing a subset** - complete the full list

**Why this matters:**
- User expects all tasks to be processed in one session
- Stopping partway creates confusion and extra work
- Forces user to ask "why didn't you finish?"
- Breaks workflow momentum

**Example of WRONG behavior:**
- Process T1-T7, stop, ask "what about the rest?"

**Example of CORRECT behavior:**
- Fetch all tasks -> Get instructions for all -> Process all -> Report completion

## CRITICAL RULE: Always Read Comments

**ALWAYS READ TASK COMMENTS BEFORE PROCESSING**

When processing tasks (inbox cleanup, moving tasks, categorizing, etc.):
1. **ALWAYS fetch and read comments** for each task before making decisions
2. **Comments contain critical context** - links, images, detailed notes, follow-up info
3. **Never process tasks without checking comments first**
4. **When creating idea notes or moving content, capture ALL comment content**
5. **Before completing a task, add a comment** with link to where content was moved (Obsidian URL, etc.)

**Example workflow:**
```python
# Get task
task = get_task(task_id)

# ALWAYS get comments
comments = get_comments(task_id)

# Process with full context from both task description AND comments
process_task_with_context(task, comments)

# Add link before completing
add_comment(task_id, f"Moved to: {obsidian_link}")
complete_task(task_id)
```

**Why this matters:**
- User stores rich content in comments (ChatGPT conversations, Claude artifacts, images, detailed notes)
- Processing without comments = losing critical context
- **IMAGES can have empty content field** - must check comment['attachment'] separately!
- Example: "nice orb for waycraft" had 12 comments with 6 PNG images + multiple links to artifacts and conversations
- Missing images = losing visual design references and generated content

## Task Assignment & Filtering

**ASSIGNED TASKS ARE AUTOMATICALLY FILTERED FROM ASSIGNER'S VIEW**

When you assign a task to someone else in Todoist:
- The task **automatically disappears from your default views** (Today, Overdue, etc.)
- The API will still return these tasks when you fetch all tasks
- **Don't treat assigned tasks as "clutter" that needs action** - they're already filtered

**Key points:**
- `assignee_id`: Who the task is assigned to (who needs to do it)
- `assigner_id`: Who assigned it (usually the user)
- **If `assignee_id` != user's ID, the task is already hidden from their view**

**Example:**
```python
# This task is assigned to Michelle (42258732)
task = {
  "id": "9490997987",
  "assignee_id": "42258732",  # Michelle
  "assigner_id": "486423",    # Michael
  "content": "File R&D docs"
}

# Michael CANNOT see this in his Today/Overdue views (already filtered)
# Only shows in Michelle's views
# No action needed - it's already delegated properly
```

**When processing tasks:**
- **DON'T** suggest "hiding" or "reassigning" tasks that are already assigned to others
- **DO** recognize these as properly delegated (no action needed)
- **DO** understand the API returns ALL tasks, but the user's view is already filtered

## Maintaining This Skill

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
The `TODOIST_API_TOKEN` environment variable is configured in `~/.env.zsh`.
No additional setup needed - just use `$TODOIST_API_TOKEN` in commands.

## Project IDs (Quick Reference)

### PARA Structure Parents
- **1-Projects**: 2359994569
- **2-Areas**: 2359994572
- **3-Resources**: 2359995015

### Active Projects (under 1-Projects)
- **Ship to Beach Dashboard**: 2360927142 (repo maintenance & improvements)
- **Sprint Execution**: 2360927149 (actual sprint shipping work)

### Default Projects
- **Inbox**: 377445380
- **Daily Briefing**: 6cvj7XgXH4w93WgX - Use for one-off tasks, delegation to Michelle, and items that don't fit elsewhere
  - URL: https://app.todoist.com/app/project/daily-briefing-6cvj7XgXH4w93WgX

### User IDs
- **Michael (you)**: 486423
- **Michelle (assistant)**: 42258732

## Comment Prefix Convention

**ALWAYS PREFIX AUTOMATED COMMENTS WITH "cc:"**

When adding comments to tasks from Claude Code, always prefix with `cc:` to make it obvious the comment is automated:

```python
# CORRECT
add_comment(task_id, "cc: Moved to Raw Ideas project")
add_comment(task_id, "cc: Completed during inbox processing")

# WRONG
add_comment(task_id, "Moved to Raw Ideas project")
```

**Why this matters:**
- Makes it immediately clear which comments are from Claude vs human
- Helps with audit trails and debugging
- Prevents confusion about who did what
- Standard convention across all automation

**The `cc:` prefix is the default** in all CLI tools and should be used in all Python scripts.

## Todoist CLI Toolkit (In Development)

**Requirements Document:** `~/ws/everything-monorepo/notes/+Inbox/Todoist-CLI-Toolkit-Requirements.md`

A Unix-philosophy CLI toolkit is being designed to replace repetitive custom Python scripts:

**Vision:**
- Composable commands (`td-tasks`, `td-complete`, `td-move`, etc.)
- Pipeable like standard Unix tools
- Works with `jq`, `grep`, `fzf`, `xargs`
- Consistent `cc:` prefix handling
- Well-documented with man pages

**Example usage (future):**
```bash
# Query and pipe
td-tasks --inbox | td-filter --has-label "idea" | td-move --to-project "Raw Ideas"

# Complete with comment
td-tasks --overdue | td-complete --from-json --comment "cc: Batch completed"

# Integration with fzf
td-tasks --today | td-format table | fzf | td-complete
```

**Current approach until CLI is ready:**
- Use custom Python scripts (see patterns below)
- Follow "cc:" prefix convention manually
- Document learnings in this file
- Reuse patterns when possible

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

def get_comments(task_id):
    """Fetch all comments for a task - ALWAYS use this before processing"""
    url = f'https://api.todoist.com/rest/v2/comments?task_id={task_id}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def extract_attachments_from_comments(comments):
    """Extract all attachments (images, files) from comments

    Returns list of attachments with type, url, and metadata
    CRITICAL: Always check comment['attachment'] - images may have empty content!
    """
    attachments = []
    for comment in comments:
        if comment.get('attachment'):
            att = comment['attachment']
            attachments.append({
                'type': att.get('resource_type', 'unknown'),
                'url': att.get('file_url') or att.get('image') or att.get('url'),
                'filename': att.get('file_name'),
                'size': att.get('file_size'),
                'dimensions': f"{att.get('image_width')}x{att.get('image_height')}" if att.get('image_width') else None,
                'title': att.get('title'),
                'description': att.get('description')
            })
    return attachments

def add_comment(task_id, content, prefix="cc: "):
    """Add comment to task with 'cc:' prefix by default

    Args:
        task_id: Task ID to add comment to
        content: Comment text
        prefix: Prefix for comment (default: "cc: ")
    """
    url = 'https://api.todoist.com/rest/v2/comments'
    # Add prefix if content doesn't already start with it
    if prefix and not content.startswith(prefix):
        content = prefix + content
    data = json.dumps({
        'task_id': task_id,
        'content': content
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'}, method='POST')
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
1. **Wisdom/Philosophy** -> Remove dates (timeless content)
2. **Ideas** -> Move to Ideas Backlog or Fun List
3. **Delegated tasks** -> Check assignee before processing
4. **Vague reflections** -> Often can be deleted

### Task Categorization Workflow (Collaborative Process)

**CRITICAL**: Always collaborate with user before executing bulk changes. This is a learning process.

#### Category Framework

**Articles & References:**
- Links to read -> Clip to `3-Resources/Articles/` in Obsidian
- Books to read -> Add to `3-Resources/Reading List.md`
- Videos to watch -> Note reference or clip transcript if valuable

**Ideas (Future Work):**
- Product ideas -> `3-Resources/Raw Ideas/` with full context
- Business opportunities -> Raw Ideas
- Feature requests -> Raw Ideas
- "What if..." -> Raw Ideas
- "It would be cool..." -> Raw Ideas

**Journal (Self/Feelings):**
- Personal reflections -> `2-Areas/Journal/`
- How I'm feeling/working -> Journal
- Processing emotions -> Journal
- Life philosophy -> Journal

**Projects:**
- Grouped related tasks -> Create Obsidian project folder + Todoist project
- Financial planning -> Combine into single planning note
- Event planning -> Dedicated project space

**Completable Tasks:**
- Recurring habits -> Just complete them
- Link-only tasks (e.g., "NOW sprint") -> Complete
- Already done items -> Complete
- Review completed -> Complete

#### Collaboration Protocol

1. **ALWAYS read comments** for each task before categorizing (see CRITICAL RULE above)
2. **Check for attachments** - images/files may have empty content (use extract_attachments_from_comments())
3. **Propose categories** for each batch of tasks with full context from descriptions AND comments
4. **Get user confirmation** before executing
5. **Process in batches** for efficiency
6. **Add Todoist URLs to Obsidian notes** - Include `todoist:` field in frontmatter with task URL
7. **Comment on tasks** with links to where content was moved (before completing)
8. **Track progress** with TodoWrite
9. **Document learnings** in this skill file

**Todoist URL Format**: `https://app.todoist.com/app/task/{task_id}`

**Why include Todoist URLs in Obsidian:**
- Creates bidirectional links between systems
- Easy access to original task context and comments
- Maintains audit trail of where ideas came from
- Allows checking task history and discussion

#### Decision Criteria

**Ideas vs Journal:**
- Ideas = new things to work on
- Journal = about self, how you're working/feeling

**Keep vs Complete:**
- Has future value = Keep (maybe move/defer)
- Already done/outdated = Complete
- Vague with no context = Ask user

**Assign to Assistant:**
- Admin tasks (e.g., researching deals, comparing options)
- Add context in comments
- Move to A/Admin project (2331010777)

#### Common Patterns

**Financial tasks** -> Group into project with combined note
**Event ideas** -> Project folder with planning note
**Links without context** -> Clip to Articles or complete
**Reflections** -> Journal or delete if processed
**Questions** -> Usually Ideas or complete if answered

**Remember**: Build confidence through iteration. Start collaborative, become more autonomous as patterns are confirmed.

## Reference Documentation
Full workflow guides and learnings:
- `~/ws/everything-monorepo/notes/5-Tools/Todoist/TODOIST_LEARNINGS.md`
- `~/ws/everything-monorepo/notes/5-Tools/Todoist/workflow_guide.md`
- `~/ws/everything-monorepo/notes/2-Areas/System/Comprehensive Todoist Management Guidelines.md`

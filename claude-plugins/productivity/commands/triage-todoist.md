---
description: Triage Todoist tasks to Notion with proper formatting and filtering
allowed-tools:
  - Bash
  - Read
  - Write
  - Task
  - mcp__notion__*
---

# Todoist Triage Command

Triage Todoist tasks to a Notion page for review.

## Prerequisites

- `TODOIST_API_TOKEN` environment variable set
- Notion MCP server connected

## Usage

```
/triage-todoist [target_page_url]
```

If no target page URL provided, creates a new page under the PPV Action Items.

## Process

### Step 1: Load the Triage Skill

First, read the triage skill for formatting rules:
- `~/.dotfiles/claude-plugins/productivity/skills/todoist-triage/SKILL.md`

### Step 2: Export Tasks from Todoist

```bash
# Get all tasks
curl -s "https://api.todoist.com/rest/v2/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" > /tmp/todoist_tasks.json

# Get collaborators for filtering
curl -s "https://api.todoist.com/sync/v9/sync" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -d "sync_token=*" \
  -d "resource_types=[\"collaborators\", \"user\"]" > /tmp/todoist_collaborators.json

# Get projects for names
curl -s "https://api.todoist.com/rest/v2/projects" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" > /tmp/todoist_projects.json
```

### Step 3: Identify Current User and Filter

```bash
# Get user ID
USER_ID=$(jq -r '.user.id' /tmp/todoist_collaborators.json)

# Filter to user's tasks only
jq --arg uid "$USER_ID" '[.[] | select(.assignee_id == null or .assignee_id == $uid)]' \
  /tmp/todoist_tasks.json > /tmp/todoist_filtered.json
```

### Step 4: Enrich with Comments

For each task that needs comments:
```bash
curl -s "https://api.todoist.com/rest/v2/comments?task_id={TASK_ID}" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN"
```

### Step 5: Categorize Tasks

Group into sections:
- **Overdue**: `due.date` < today
- **Inbox**: project is Inbox or no project
- **#Review**: has "Review" or "review" in labels
- **Other**: remaining tasks

### Step 6: Format for Notion

Follow the formatting rules in the skill file:
- Wrap each task in appropriate callout
- Include descriptions
- Format comments as collapsible toggles
- Use proper indentation

### Step 7: Create/Update Notion Page

Use `mcp__notion__notion-create-pages` or `mcp__notion__notion-update-page` to write the formatted content.

## Validation

After triage, verify:
- [ ] No tasks assigned to others appear
- [ ] Descriptions are included
- [ ] Comments are properly nested in toggles
- [ ] Section counts are accurate
- [ ] No formatting artifacts

## Test Mode

To test against fixtures:
```
/triage-todoist --test
```

This will:
1. Use `fixtures/sample-export.json` as input
2. Compare output against `fixtures/expected-output.md`
3. Report any discrepancies

## Output Location

Saves triage results to:
- `/tmp/todoist_triage_output.md` - Raw markdown
- `/tmp/todoist_triage_input.json` - Input data used
- Notion page at specified URL

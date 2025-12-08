---
name: Notion PPV Interaction
description: Use when interacting with Notion PPV system, creating projects, updating goals, doing quarterly reviews, or working with PPV databases. Provides MCP tool patterns and key database IDs.
version: 0.8.0
---

# Notion PPV Interaction Guide

Patterns for interacting with Michael's PPV (Pillars, Pipelines, Vaults) system in Notion via MCP tools.

## PPV Hierarchy

**Vertical hierarchy (parent → child):**
```
Value Goals → Outcome Goals → Projects → Tasks
```

**Pillars are ORTHOGONAL (tagging, not hierarchy):**
```
Pillar Groups: Growth | Business | Home & Social
    └── Pillars: Career, Family, Finances, Health, Spirituality, etc.
```
- Pillars categorize/tag Value Goals, they don't contain them hierarchically
- A Value Goal can be linked to one or more Pillars

**Level guidance:**
- **Value Goals** = Enduring aspirations ("What life area am I investing in?")
- **Outcome Goals** = Measurable milestones with timeframes ("What result by when?")
- **Projects** = Work packages to achieve outcomes
- **Tasks** = Individual action items

## Status Options

| Entity | Statuses |
|--------|----------|
| Value Goals | Underway, Paused, Waiting, Off Track, Complete |
| Outcome Goals | Active, Next Up, Future 1/2/3, Closed |
| Projects | Active, Next Up, Waiting, Paused, Complete |

**Note:** No "Dropped" status exists. To discontinue a Value Goal:
1. Set status to "Paused"
2. Add a note in content: "**Status: Discontinued (Q4 2025 Review)** - [reason]"

## MCP vs Direct API Usage

**READING**: Always use MCP tools (`notion-fetch`, `notion-search`)
**CREATING/UPDATING**: Use MCP for simple operations, direct API when templates needed

| Operation | Tool |
|-----------|------|
| Read/fetch pages | MCP `notion-fetch` |
| Search | MCP `notion-search` |
| Update properties/content | MCP `notion-update-page` |
| Create simple pages | MCP `notion-create-pages` |
| Create pages with templates | **Direct API with template_id** |

## MCP Tools Available

- `mcp__notion__notion-search` - Search pages/databases
- `mcp__notion__notion-fetch` - Get page/database content and schema
- `mcp__notion__notion-create-pages` - Create new pages (no template support)
- `mcp__notion__notion-update-page` - Update page properties or content
- `mcp__notion__notion-duplicate-page` - ⚠️ Creates templates, not regular pages

## Key PPV Database IDs

| Database | Data Source ID | Database Page ID | Template ID |
|----------|----------------|------------------|-------------|
| Projects | `17e577f8-2e28-81cb-8e3d-000bc55b9945` | `17e577f82e2881edae33e18b1dcfeae5` | `17e577f8-2e28-81ef-ad01-d9e271fd6b68` |
| Outcome Goals | `17e577f8-2e28-8149-be9c-000b4fe59e54` | `17e577f82e288133bfeecdc469747b60` | `17e577f8-2e28-8117-9e8d-d887c960d289` |
| Value Goals | `17e577f8-2e28-8184-88a1-000bf4c9f064` | `17e577f82e288119afd1c845cec1bef3` | `17e577f8-2e28-8184-8452-fbab029ec9a0` |
| Accomplishments | `17e577f8-2e28-8138-a7c5-000bdd245764` | | - |
| Disappointments | `17e577f8-2e28-81da-a2ef-000b4a08f006` | | - |
| Quarters | `17e577f8-2e28-8198-ab3e-000b64c1b87d` | | - |
| Action Items | `17e577f8-2e28-81cf-9d6b-000bc2cf0d50` | `17e577f8-2e28-8181-aa14-e20e6759705a` | `17f577f8-2e28-8063-8b2b-d3a52819591a` |

## Key Page IDs

| Page | ID |
|------|-----|
| Q3 2025 | `2c2577f8-2e28-80a5-b2f9-e9eabfc36dad` |
| Q4 2025 | `28d577f8-2e28-80f7-89c9-cf447c8d2a58` |
| 2024 Annual Reflection | `16b577f82e28806ea3ccdc2ded3713ee` |

### Key Value Goals (Active)
| Value Goal | ID | Owner | Priority |
|------------|-----|-------|----------|
| Create Transformational AI with a World-Class Team | `17e577f8-2e28-8049-9a23-ff34b7d0c675` | Michael | 1st |
| Build & Master Financial Security | `2c3577f8-2e28-81ab-99a6-ee3a8b285907` | Michael | 2nd |
| Become a Recognized AI Thought Leader | `2c3577f8-2e28-81b9-a6c5-c046f1f9f46f` | Michael | 3rd |
| Craft a Healthy Body | `17e577f8-2e28-80c9-93ee-f770b17d6002` | Evelisa | - |

### Key Outcome Goals
| Outcome Goal | Parent Value Goal | ID |
|--------------|-------------------|-----|
| Raise $10M | Transformational AI | `2c3577f8-2e28-81ce-9e6c-fc90b3f9e76c` |
| Establish Stable Financial Foundation | Financial Security | `2c3577f8-2e28-81b1-82bf-e82d3e4fac61` |
| Own and Lead Father's Estate Planning | Financial Security | `2c3577f8-2e28-8136-a2f6-d4cde9416adc` |
| Achieve Physical Fitness Routine | Healthy Body | `2c3577f8-2e28-81c1-b071-d7697d7394a9` |

## Creating a New Project (CRITICAL)

The MCP tool does NOT support the `template` parameter. You must use the **direct Notion API** with xh/curl.

### Correct Pattern: Direct API with template_id

```bash
xh --ignore-stdin --raw '{
  "parent": {
    "type": "database_id",
    "database_id": "17e577f82e2881edae33e18b1dcfeae5"
  },
  "properties": {
    "Project": {
      "title": [{"text": {"content": "Project Name"}}]
    },
    "Status": {
      "select": {"name": "Active"}
    },
    "Priority": {
      "select": {"name": "1st Priority"}
    }
  },
  "template": {
    "type": "template_id",
    "template_id": "17e577f8-2e28-81ef-ad01-d9e271fd6b68"
  }
}' POST 'https://api.notion.com/v1/pages' \
  "Authorization: Bearer $NOTION_API_KEY" \
  'Notion-Version: 2022-06-28'
```

### After Creation: Set Relations via MCP

```javascript
mcp__notion__notion-update-page({
  page_id: "<new_page_id>",
  command: "update_properties",
  properties: {
    "Quarter": "[\"https://www.notion.so/<quarter_page_id>\"]",
    "Outcome Goals": "[\"https://www.notion.so/<goal_page_id>\"]"
  }
})
```

### Why This Pattern?

| Approach | Result |
|----------|--------|
| `duplicate-page` | Creates a NEW TEMPLATE, not a regular page |
| `create-pages` without content | Blank page (API bypasses default template) |
| `create-pages` with content | Missing linked database views |
| **Direct API with template_id** | ✅ Full template with linked databases |

## Creating Accomplishments/Disappointments

Simple `create-pages` works - no complex template needed:

```javascript
mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "17e577f8-2e28-8138-a7c5-000bdd245764"},
  pages: [{
    properties: {
      "Accomplishment": "What you accomplished",
      "Quarter": "[\"https://www.notion.so/<quarter_page_id>\"]"
    }
  }]
})
```

## Creating Action Items (Tasks)

Like Projects, Action Items use templates. Use the **direct Notion API** with template_id.

### Correct Pattern: Direct API with template_id

```bash
xh --ignore-stdin --raw '{
  "parent": {
    "type": "database_id",
    "database_id": "17e577f8-2e28-8181-aa14-e20e6759705a"
  },
  "properties": {
    "Action Item": {
      "title": [{"text": {"content": "Task description"}}]
    },
    "Priority": {
      "select": {"name": "2nd Priority"}
    },
    "Status": {
      "select": {"name": "Active"}
    },
    "Do Date": {
      "date": {"start": "2025-12-08"}
    },
    "Owner": {
      "people": [{"id": "5923a1d0-4c9c-4376-b7d7-3c50704758c1"}]
    }
  },
  "template": {
    "type": "template_id",
    "template_id": "17f577f8-2e28-8063-8b2b-d3a52819591a"
  }
}' POST 'https://api.notion.com/v1/pages' \
  "Authorization: Bearer $NOTION_API_KEY" \
  'Notion-Version: 2022-06-28'
```

### After Creation: Set Relations via MCP

```javascript
mcp__notion__notion-update-page({
  page_id: "<new_task_id>",
  command: "update_properties",
  properties: {
    "Projects (DB)": "[\"https://www.notion.so/<project_page_id>\"]"
  }
})
```

### Priority Options
`Immediate 🔥`, `Quick ⚡`, `Scheduled 📅`, `1st Priority 🚀`, `2nd Priority`, `3rd Priority`, `4th Priority`, `5th Priority`, `Errand 🚘`, `Remember 💭`, `‼️ Repeat`

### Status Options
`Active`, `Waiting`, `Next Up`, `Paused`, `Future 1`, `Future 2`, `Future 3`

**Michael's User ID**: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`

## Creating Outcome Goals

```javascript
mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "17e577f8-2e28-8149-be9c-000b4fe59e54"},
  pages: [{
    properties: {
      "Outcome Goals": "Goal name",
      "Status": "Active",
      "Success Threshold": "How to measure success",
      "date:Target Completion Date:start": "2026-03-31",
      "date:Target Completion Date:is_datetime": 0
    }
  }]
})
```

## Updating Page Content

Use `replace_content_range` with unique selection patterns:

```javascript
mcp__notion__notion-update-page({
  page_id: "<id>",
  command: "replace_content_range",
  selection_with_ellipsis: "### **Thoughts & Reminders**...<empty-block/>",
  new_str: "### **Thoughts & Reminders**\n- New content\n<empty-block/>"
})
```

## Relation Fields

Relations require JSON array of page URLs:
```
"Quarter": "[\"https://www.notion.so/<page_id>\"]"
"Outcome Goals": "[\"https://www.notion.so/<goal_page_id>\"]"
```

## Quarterly Review Structure

1. **Debrief** - Accomplishments, Disappointments, Am I on track?
2. **Process & Update** - Review Quarters, Goals, Projects
3. **Someday/Maybe** - Activate waiting items

## Periodic Review Tracking

**State file**: `~/.claude/productivity.local.md`

At session start, check if any reviews are overdue:
```yaml
reviews:
  annual:
    last_completed: "2024-12-XX"
    next_due: "2025-12-31"
  quarterly:
    last_completed: "2025-12-08"
    next_due: "2026-03-31"
  monthly:
    last_completed: null
    next_due: "2025-12-31"
  weekly:
    last_completed: null
    next_due: "2025-12-15"
```

**Trigger behavior**: If `next_due` is in the past, prompt user: "Your [X] review is due. Would you like to do it now?"

**After completing a review**: Update both `last_completed` and `next_due` in the state file.

| Review | Cadence | Next Due Calculation |
|--------|---------|---------------------|
| Annual | Dec/Jan | End of next year |
| Quarterly | End of quarter | +3 months |
| Monthly | Last week of month | End of next month |
| Weekly | Sunday/Monday | +7 days |

## Best Practices

1. **Projects require direct API** - MCP doesn't support template parameter
2. **Use MCP for updates** - Works well for properties and content
3. **Fetch before update** - See current schema and unique patterns
4. **Relations are URL arrays** - JSON format required
5. **Date fields expanded** - `date:Field:start`, `date:Field:is_datetime`

## Do Date Workflow (Task Scheduling)

**Do Date (D-O) ≠ Due Date** - Do Date is when you're scheduled to DO the task, not its deadline.

### Daily Task Limits
- **1st Priority**: Only 1 task
- **2nd Priority**: Only 1 task
- **3rd Priority**: Only 1 task
- **Quick/Immediate/Reminder**: A few additional tasks
- **Target**: 3-5 tasks per day (10 = too many)

### Rules
1. **Past Do Dates must be rescheduled** - Never leave tasks with past Do Dates
2. **Every active project needs ≥1 task** with a future Do Date (or Waiting status)
3. **Morning planning**: Check today's tasks, ensure nothing overdue

### Project Health Check
A project is "healthy" if it has at least one of:
- Active task with future Do Date
- Task in Waiting status (blocked on someone/something)

If a project has no active tasks, either:
- Define a next action and schedule it
- Set project status to Paused/Waiting with a note why

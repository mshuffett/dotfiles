---
description: Morning planning routine - start your day with PPV integration
---

# Morning Routine (PPV-Integrated)

Start the day with clarity by connecting to your PPV system.

## Steps

### 1. Create or Find Today's Daily Tracking Entry

Check if a daily tracking entry exists for today. If not, create one:

**Database ID**: `17e577f8-2e28-8181-aa14-e20e6759705a` (Action Items DB page, Daily Tracking is a view)
**Data Source ID**: `1be577f8-2e28-8096-bb0b-000b5a462ab3`

Search for today's date in Daily Tracking. If not found, create using direct API:

```bash
xh --ignore-stdin --raw '{
  "parent": {
    "type": "database_id",
    "database_id": "1be577f82e2880968b30c5e7b98a1baf"
  },
  "properties": {
    "Date Title": {
      "title": [{"text": {"content": "YYYY-MM-DD"}}]
    },
    "Date": {
      "date": {"start": "YYYY-MM-DD"}
    },
    "Owner": {
      "people": [{"id": "5923a1d0-4c9c-4376-b7d7-3c50704758c1"}]
    }
  }
}' POST 'https://api.notion.com/v1/pages' \
  "Authorization: Bearer $NOTION_API_KEY" \
  'Notion-Version: 2022-06-28'
```

Link to current week if available.

### 2. Show Today's Action Items

Query Action Items with Do Date <= today and Status = Active:

```bash
# Use MCP notion-search with query for today's tasks
mcp__notion__notion-list-issues or search Action Items
```

Display tasks grouped by priority:
- 1st Priority (limit 1)
- 2nd Priority (limit 1)
- 3rd Priority (limit 1)
- Quick/Immediate items

### 3. Morning Questions

Ask the user:
1. How are you feeling this morning? (1-10 energy level)
2. What's the ONE thing that would make today a success?
3. Any time-sensitive items or meetings?
4. Any blockers to address first?

### 4. Set Intentions

Based on responses:
- Confirm top 3 tasks for the day
- Identify first task to start with
- Note any items to reschedule if overloaded

### 5. Update Daily Tracking (Optional)

If user provides morning data, update the daily entry:
- Energy level
- Morning intentions/notes

## Key Database IDs

| Database | Data Source ID |
|----------|----------------|
| Action Items | `17e577f8-2e28-81cf-9d6b-000bc2cf0d50` |
| Daily Tracking | `1be577f8-2e28-8096-bb0b-000b5a462ab3` |
| Weeks | `17e577f8-2e28-8186-b8d7-000b3ee8cfa3` |

**Michael's User ID**: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`

## Quick Flow

1. Find/create daily entry
2. Show today's tasks (Do Date <= today, Active)
3. Ask morning questions
4. Confirm top 3 priorities
5. Start first task

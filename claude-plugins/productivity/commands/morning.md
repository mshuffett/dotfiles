---
description: Morning planning routine - start your day with PPV integration
---

# Morning Routine (PPV-Integrated)

Start Michael's day with clarity by connecting to his PPV system, calendar, and Todoist.

## Steps

### 1. Check Today's Calendar

**First, show what's scheduled:**
- Use `icalBuddy -f eventsToday` or calendar MCP to show today's meetings
- Highlight any conflicts or back-to-back meetings
- Note prep needed for important meetings

Display format:
```
📅 TODAY'S CALENDAR
─────────────────────
9:00 AM - Team standup (30 min)
11:00 AM - Investor call - Foundation Capital (1 hr) ⚠️ PREP NEEDED
2:00 PM - Focus block (2 hr)
```

### 2. Create or Find Today's Daily Tracking Entry

Check if a daily tracking entry exists for today. If not, create one:

**Data Source ID**: `17e577f8-2e28-8183-9177-000bbb7d847f`

Search for today's date in Daily Tracking. If not found, create:

```javascript
mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "17e577f8-2e28-8183-9177-000bbb7d847f"},
  pages: [{
    properties: {
      "Date Title": "Michael @[Month Day, Year]",
      "date:Date:start": "YYYY-MM-DD",
      "date:Date:is_datetime": 0,
      "Owner": "[\"5923a1d0-4c9c-4376-b7d7-3c50704758c1\"]",
      "Week": "[\"https://www.notion.so/<current_week_id>\"]"
    }
  }]
})
```

### 3. Show Today's Todoist Tasks

Fetch Todoist tasks for today using filter `today|overdue`:
- Show tasks from the weekly priority project first
- Then show other today tasks
- Flag any overdue items that need attention

```bash
# Quick Todoist check
source ~/.env.zsh && curl -s "https://api.todoist.com/rest/v2/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" | \
  python3 -c "import json,sys; tasks=json.load(sys.stdin); today=[t for t in tasks if t.get('due') and 'today' in str(t.get('due',{})).lower()]; print(f'📋 {len(today)} tasks for today')"
```

### 4. Show PPV Action Items

Query Action Items with Do Date <= today and Status = Active:

Display tasks grouped by priority:
- **1st Priority** (only 1 allowed)
- **2nd Priority** (only 1 allowed)
- **3rd Priority** (only 1 allowed)
- **Quick/Immediate** items

### 5. Morning Questions

Ask Michael:
1. How are you feeling this morning? (1-10 energy level)
2. Any meetings needing prep?
3. What's the ONE thing that would make today a success?
4. Any blockers to address first?

### 6. Set Today's Focus

Based on calendar + tasks + energy:
- Confirm top 3 tasks for the day
- Identify first task to start with
- Note any items to reschedule if overloaded (>5 tasks = too many)
- Block focus time on calendar if needed

### 7. Update Daily Tracking (Optional Morning Fields)

If Michael provides morning data, update the daily entry:

```javascript
mcp__notion__notion-update-page({
  page_id: "<daily_entry_id>",
  command: "update_properties",
  properties: {
    "Bullet Planner": "__YES__"  // If morning planning done
  }
})
```

## Daily Tracking Fields Reference

**Core:**
- `Date Title` (title) - Format: "Michael @December 8, 2025"
- `Date` (date)
- `Owner` (person) - Michael's ID: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`
- `Week` (relation)

**Habits (checkboxes):**
| Field | Description |
|-------|-------------|
| `Meditate` | Morning meditation done |
| `Mindset` | Mindset practice done |
| `Visualization` | Visualization practice done |
| `Read` | Reading done |
| `Workout` | Exercise done |
| `Logged Food` | Food logging done |
| `Bullet Planner` | Morning planning done |
| `Schedule Tomorrow` | Evening planning done |

**Sleep:**
- `Bedtime` (date) - Previous night's bedtime
- `Wakeup Time` (date) - This morning's wakeup

**Reflection:**
- `Blue Sky/Twitter Reflection` (text)
- `Improvements` (text)

**Reviews Done (multi-select):**
- Options: `Weekly`, `Monthly`, `Quarterly`

## Key Database IDs

| Database | Data Source ID |
|----------|----------------|
| Action Items | `17e577f8-2e28-81cf-9d6b-000bc2cf0d50` |
| Daily Tracking | `17e577f8-2e28-8183-9177-000bbb7d847f` |
| Weeks | `17e577f8-2e28-8186-b8d7-000b3ee8cfa3` |

**Michael's User ID**: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`

## Quick Flow

1. **Calendar first** - Show today's schedule
2. **Todoist** - Show today's tasks
3. **PPV** - Find/create daily entry, show action items
4. Ask morning questions
5. Confirm top 3 priorities aligned with calendar
6. Mark "Bullet Planner" if planning done
7. Start first task

---
description: Morning planning routine - start your day with PPV integration
---

# Morning Routine (PPV-Integrated)

Start Michael's day with clarity by connecting to his PPV system.

## Steps

### 1. Create or Find Today's Daily Tracking Entry

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

### 2. Show Today's Action Items

Query Action Items with Do Date <= today and Status = Active:

Display tasks grouped by priority:
- **1st Priority** (only 1 allowed)
- **2nd Priority** (only 1 allowed)
- **3rd Priority** (only 1 allowed)
- **Quick/Immediate** items

### 3. Morning Questions

Ask Michael:
1. How are you feeling this morning? (1-10 energy level)
2. What's the ONE thing that would make today a success?
3. Any time-sensitive items or meetings?
4. Any blockers to address first?

### 4. Set Intentions

Based on responses:
- Confirm top 3 tasks for the day
- Identify first task to start with
- Note any items to reschedule if overloaded (>5 tasks = too many)

### 5. Update Daily Tracking (Optional Morning Fields)

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

1. Find/create daily entry (link to current week)
2. Show today's tasks (Do Date <= today, Active)
3. Ask morning questions
4. Confirm top 3 priorities
5. Mark "Bullet Planner" if planning done
6. Start first task

---
description: Evening shutdown routine - end your day with PPV integration
---

# Evening Shutdown (PPV-Integrated)

Close out Michael's day by updating his PPV system and preparing for tomorrow.

## Steps

### 1. Find Today's Daily Tracking Entry

Search for today's date in Daily Tracking:

```javascript
mcp__notion__notion-search({
  query: "Michael @[today's date]",
  data_source_url: "collection://17e577f8-2e28-8183-9177-000bbb7d847f"
})
```

### 2. Review Today's Tasks

Fetch Action Items with Do Date = today:
- Show completed tasks (celebrate wins!)
- Show incomplete tasks (need rescheduling)

Ask: "Which tasks did you complete today?"
Mark completed tasks as done in Notion.

### 3. Handle Incomplete Tasks

For any tasks not completed:
- Reschedule to tomorrow or later date
- Update Do Date in Notion
- **Rule**: Past Do Dates should never remain - always reschedule

### 4. Evening Questions

Ask Michael:
1. **Wins**: What are 1-3 wins from today? (big or small)
2. **Gratitude**: What are you grateful for today?
3. **Improvements**: What could you improve tomorrow?
4. **Tomorrow's First Task**: What's the first thing to tackle tomorrow?

### 5. Update Daily Tracking Entry

Update today's daily tracking with habits and reflections:

```javascript
mcp__notion__notion-update-page({
  page_id: "<daily_entry_id>",
  command: "update_properties",
  properties: {
    // Habits
    "Meditate": "__YES__",
    "Mindset": "__YES__",
    "Visualization": "__NO__",
    "Read": "__YES__",
    "Workout": "__YES__",
    "Logged Food": "__NO__",
    "Schedule Tomorrow": "__YES__",

    // Sleep (from last night)
    "date:Bedtime:start": "2025-12-07T23:00:00",
    "date:Bedtime:is_datetime": 1,
    "date:Wakeup Time:start": "2025-12-08T07:00:00",
    "date:Wakeup Time:is_datetime": 1,

    // Reflection
    "Improvements": "Focus on one thing at a time",
    "Blue Sky/Twitter Reflection": "Grateful for progress today"
  }
})
```

### 6. Capture Loose Ends

Ask: "Anything still on your mind that needs capturing?"

For any items mentioned:
- Create Action Items for actionable tasks
- Note ideas in appropriate place (Notes database)
- Clear mental load

### 7. Tomorrow Preview

Show tomorrow's scheduled tasks (Do Date = tomorrow):
- Confirm the plan looks good
- Identify any adjustments needed
- Set "Schedule Tomorrow" to YES if planning done

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
- `Bedtime` (date) - Last night's bedtime
- `Wakeup Time` (date) - This morning's wakeup

**Reflection:**
- `Blue Sky/Twitter Reflection` (text) - Gratitude/wins
- `Improvements` (text) - What to improve tomorrow

**Reviews Done (multi-select):**
- Options: `Weekly`, `Monthly`, `Quarterly`

## Key Database IDs

| Database | Data Source ID |
|----------|----------------|
| Action Items | `17e577f8-2e28-81cf-9d6b-000bc2cf0d50` |
| Daily Tracking | `17e577f8-2e28-8183-9177-000bbb7d847f` |
| Notes | `17e577f8-2e28-81dd-9362-000b2a691b0e` |

**Michael's User ID**: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`

## Quick Flow

1. Find today's daily entry
2. Review completed vs incomplete tasks
3. Mark tasks done / reschedule incomplete
4. Ask evening questions (wins, gratitude, improvements)
5. Update daily tracking (habits, sleep, reflection)
6. Capture any loose ends
7. Preview tomorrow's tasks
8. Mark "Schedule Tomorrow" as done
9. Close out mentally

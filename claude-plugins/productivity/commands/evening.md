---
description: Evening shutdown routine - end your day with PPV integration
---

# Evening Shutdown (PPV-Integrated)

Close out Michael's day by clearing inboxes, reviewing calendar, updating PPV, and planning tomorrow.

## Steps

### 1. Find Today's Daily Tracking Entry

Search for today's date in Daily Tracking:

```javascript
mcp__notion__notion-search({
  query: "Michael @[today's date]",
  data_source_url: "collection://17e577f8-2e28-8183-9177-000bbb7d847f"
})
```

### 2. Review Today's Calendar & Tasks

**Calendar Review:**
- Show what happened today vs what was planned
- Note any meetings that generated action items
- Flag follow-ups needed

**Task Review:**
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

### 4. Clear Todoist Inbox

**Critical step - process inbox to zero:**

```bash
# Check inbox count
source ~/.env.zsh && python3 << 'EOF'
import requests, os
token = os.environ.get('TODOIST_API_TOKEN')
headers = {"Authorization": f"Bearer {token}"}
resp = requests.get("https://api.todoist.com/rest/v2/tasks",
                   params={"project_id": "377445380"}, headers=headers)
tasks = resp.json()
print(f"📥 Todoist Inbox: {len(tasks)} items")
if len(tasks) > 0:
    print("\nTop 10:")
    for t in tasks[:10]:
        print(f"  - {t['content'][:50]}")
EOF
```

**For each inbox item, decide:**
1. **Delete** - Not needed
2. **Do** - <2 min, do it now
3. **Delegate** - Assign to someone
4. **Defer** - Move to project with due date
5. **File** - Reference material (move to notes)

**Quick process:**
- High-priority items → Weekly project or appropriate project
- Ideas → `A/Ideas` project (2263875911)
- Everything AI stuff → `A/Everything AI Backlog` (2352252927)
- Batch-related → Batch project
- Delete/complete anything stale (>30 days old with no action)

### 5. Check Tomorrow's Calendar

**Show what's coming:**
- Use `icalBuddy -f eventsFrom:tomorrow to:tomorrow` or calendar MCP
- Highlight early meetings (adjust wake time?)
- Note any prep needed tonight
- Flag potential conflicts

Display format:
```
📅 TOMORROW'S CALENDAR
─────────────────────
9:00 AM - All-hands (1 hr)
11:00 AM - 1:1 with [person] (30 min)
2:00 PM - Deep work block (3 hr)

⚠️ Early start - 9am meeting
📝 Prep needed: Review deck for all-hands
```

### 6. Plan Tomorrow

**Set tomorrow's tasks:**
1. Review weekly priorities project
2. Pick 3-5 tasks max for tomorrow
3. Schedule due dates for tomorrow in Todoist
4. Ensure first task is clear

**Questions to ask:**
- What's the most important thing for tomorrow?
- Any meetings requiring prep tonight?
- What would make tomorrow a success?

### 7. Evening Questions

Ask Michael:
1. **Wins**: What are 1-3 wins from today? (big or small)
2. **Gratitude**: What are you grateful for today?
3. **Improvements**: What could you improve tomorrow?
4. **Tomorrow's First Task**: What's the first thing to tackle?

### 8. Update Daily Tracking Entry

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

### 9. Capture Loose Ends

Ask: "Anything still on your mind that needs capturing?"

For any items mentioned:
- Create Action Items for actionable tasks
- Add to Todoist inbox for processing
- Note ideas in appropriate place
- Clear mental load completely

### 10. Shutdown Complete

Final checklist:
- [ ] Todoist inbox at zero (or <5 items)
- [ ] Tomorrow's tasks set (3-5 max)
- [ ] Calendar reviewed for tomorrow
- [ ] Daily tracking updated
- [ ] Mind is clear

**Say**: "Shutdown complete. Tomorrow's first task is: [task]. Enjoy your evening!"

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

**Todoist Project IDs:**
| Project | ID |
|---------|-----|
| Inbox | 377445380 |
| A/Ideas | 2263875911 |
| A/Everything AI Backlog | 2352252927 |

**Michael's User ID**: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`

## Quick Flow

1. Find today's daily entry
2. Review calendar - what happened today
3. Review tasks - completed vs incomplete
4. Mark tasks done / reschedule incomplete
5. **Clear Todoist inbox** (critical!)
6. **Check tomorrow's calendar** (new!)
7. **Plan tomorrow** - pick 3-5 tasks (new!)
8. Ask evening questions (wins, gratitude, improvements)
9. Update daily tracking (habits, sleep, reflection)
10. Capture any loose ends
11. Mark "Schedule Tomorrow" as done
12. Close out mentally - shutdown complete

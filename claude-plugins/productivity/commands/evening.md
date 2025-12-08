---
description: Evening shutdown routine - end your day with PPV integration
---

# Evening Shutdown (PPV-Integrated)

Close out the day by updating your PPV system and preparing for tomorrow.

## Steps

### 1. Find Today's Daily Tracking Entry

Search for today's date in Daily Tracking:

```javascript
mcp__notion__notion-search({
  query: "YYYY-MM-DD",  // Today's date
  data_source_url: "collection://1be577f8-2e28-8096-bb0b-000b5a462ab3"
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
- Note: Past Do Dates should never remain - always reschedule

### 4. Evening Questions

Ask the user:
1. **Wins**: What are 1-3 wins from today? (big or small)
2. **Gratitude**: What are you grateful for today?
3. **Productivity Score**: How productive was today? (1-10)
4. **Tomorrow's First Task**: What's the first thing to tackle tomorrow?

### 5. Update Daily Tracking Entry

Update today's daily tracking with:

```javascript
mcp__notion__notion-update-page({
  page_id: "<daily_entry_id>",
  command: "update_properties",
  properties: {
    "Meditate": "__YES__" or "__NO__",
    "Exercise": "__YES__" or "__NO__",
    "Productivity": 8,  // 1-10 score
    // Add other habit checkboxes as needed
  }
})
```

For wins/gratitude, update the page content if there's a notes section.

### 6. Capture Loose Ends

Ask: "Anything still on your mind that needs capturing?"

For any items mentioned:
- Create Action Items for actionable tasks
- Note ideas in appropriate place
- Clear mental load

### 7. Tomorrow Preview

Show tomorrow's scheduled tasks (Do Date = tomorrow):
- Confirm the plan looks good
- Identify any adjustments needed

## Key Database IDs

| Database | Data Source ID |
|----------|----------------|
| Action Items | `17e577f8-2e28-81cf-9d6b-000bc2cf0d50` |
| Daily Tracking | `1be577f8-2e28-8096-bb0b-000b5a462ab3` |

**Michael's User ID**: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`

## Daily Tracking Fields

**Habits (Checkboxes)**:
- Meditate
- Exercise
- Journal
- Read
- Water (8 glasses)

**Metrics**:
- Productivity (1-10)
- Energy (1-10)
- Mood (1-10)

**Reviews Done**:
- Weekly Review
- Monthly Review
- Quarterly Review

## Quick Flow

1. Find today's daily entry
2. Review completed vs incomplete tasks
3. Mark tasks done / reschedule incomplete
4. Ask evening questions (wins, gratitude, score)
5. Update daily tracking
6. Capture any loose ends
7. Preview tomorrow
8. Close out mentally

---
name: ppv-add
description: Add a new action item to PPV Notion system
allowed-tools: Bash
---

# Add Action Item

Add a new action item to the PPV Action Items database.

## Arguments

$ARGUMENTS - The task description. Can include:
- Task title (required)
- Priority hint (e.g., "high priority", "quick", "immediate")
- Date hint (e.g., "tomorrow", "next week", "Dec 15")

## Instructions

1. Parse the user's input to extract:
   - Task title (required)
   - Priority (default: "1st Priority 🚀")
   - Do Date (default: today's date)

2. Map priority hints:
   - "immediate", "urgent", "asap" → "Immediate 🔥"
   - "quick", "fast" → "Quick ⚡"
   - "high", "1st", "first" → "1st Priority 🚀"
   - "2nd", "second" → "2nd Priority"
   - "low", "later" → "3rd Priority"

3. Create the task:

```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "17e577f8-2e28-8181-aa14-e20e6759705a"},
    "properties": {
      "Action Item": {"title": [{"text": {"content": "TASK_TITLE_HERE"}}]},
      "Status": {"select": {"name": "Active"}},
      "Priority": {"select": {"name": "PRIORITY_HERE"}},
      "Do Date": {"date": {"start": "DATE_HERE"}},
      "Owner": {"people": [{"id": "5923a1d0-4c9c-4376-b7d7-3c50704758c1"}]}
    }
  }'
```

Replace TASK_TITLE_HERE, PRIORITY_HERE, and DATE_HERE with actual values.

4. Confirm creation and show the new task details to the user.

---
name: ppv-today
description: Show today's active action items from PPV Notion system
allowed-tools: Bash
---

# Today's Action Items

Query the PPV Action Items database for tasks due today or overdue.

Run this command to get today's action items:

```bash
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Do Date","date":{"on_or_before":"'"$(date +%Y-%m-%d)"'"}},{"property":"Done","checkbox":{"equals":false}},{"property":"Parent item","relation":{"is_empty":true}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]},"sorts":[{"property":"Priority","direction":"ascending"},{"property":"Do Date","direction":"ascending"}]}'
```

Parse the JSON response and present a clean table showing:
- Priority
- Action Item name
- Do Date
- Owner (if present)

Format as a markdown table for the user.

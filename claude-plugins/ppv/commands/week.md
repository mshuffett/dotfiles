---
name: ppv-week
description: Show this week's action items from PPV Notion system
allowed-tools: Bash
---

# This Week's Action Items

Query the PPV Action Items database for tasks due this week.

Run this command:

```bash
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Do Date","date":{"on_or_before":"'"$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d '+7 days' +%Y-%m-%d)"'"}},{"property":"Done","checkbox":{"equals":false}},{"property":"Status","select":{"equals":"Active"}},{"property":"Parent item","relation":{"is_empty":true}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]},"sorts":[{"property":"Do Date","direction":"ascending"},{"property":"Priority","direction":"ascending"}]}'
```

Parse and present as a table grouped by day if possible, showing Priority, Action Item, Do Date.

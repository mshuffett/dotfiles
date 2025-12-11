---
name: ppv-projects
description: Show active projects from PPV Notion system
allowed-tools: Bash
---

# Active Projects

Query the PPV Projects database for active projects.

Run this command:

```bash
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-81ed-ae33-e18b1dcfeae5/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"property":"Status","select":{"equals":"Active"}}}'
```

Parse the response and show a clean list of active projects with their status.

---
name: Notion PPV Interaction
description: Use when interacting with Notion PPV system, creating projects, updating goals, doing quarterly reviews, or working with PPV databases. Provides MCP tool patterns and key database IDs.
version: 0.3.0
---

# Notion PPV Interaction Guide

Patterns for interacting with Michael's PPV (Pillars, Pipelines, Vaults) system in Notion via MCP tools.

## MCP Tools Available

- `mcp__notion__notion-search` - Search pages/databases
- `mcp__notion__notion-fetch` - Get page/database content and schema
- `mcp__notion__notion-create-pages` - Create new pages (no template support)
- `mcp__notion__notion-update-page` - Update page properties or content
- `mcp__notion__notion-duplicate-page` - ⚠️ Creates templates, not regular pages

## Key PPV Database IDs

| Database | Data Source ID | Database Page ID |
|----------|----------------|------------------|
| Projects | `17e577f8-2e28-81cb-8e3d-000bc55b9945` | `17e577f82e2881edae33e18b1dcfeae5` |
| Outcome Goals | `17e577f8-2e28-8149-be9c-000b4fe59e54` | |
| Accomplishments | `17e577f8-2e28-8138-a7c5-000bdd245764` | |
| Disappointments | `17e577f8-2e28-81da-a2ef-000b4a08f006` | |
| Quarters | `17e577f8-2e28-8198-ab3e-000b64c1b87d` | |
| Value Goals | `17e577f8-2e28-8184-88a1-000bf4c9f064` | |

## Key Page IDs

| Page | ID |
|------|-----|
| Q3 2025 | `2c2577f8-2e28-80a5-b2f9-e9eabfc36dad` |
| Q4 2025 | `28d577f8-2e28-80f7-89c9-cf447c8d2a58` |
| 2024 Annual Reflection | `16b577f82e28806ea3ccdc2ded3713ee` |
| Project Template | `17e577f8-2e28-81ef-ad01-d9e271fd6b68` |

## Creating a New Project (CRITICAL)

The MCP tool does NOT support the `template` parameter. You must use the **direct Notion API** with xh/curl.

### Correct Pattern: Direct API with template_id

```bash
xh --ignore-stdin --raw '{
  "parent": {
    "type": "database_id",
    "database_id": "17e577f82e2881edae33e18b1dcfeae5"
  },
  "properties": {
    "Project": {
      "title": [{"text": {"content": "Project Name"}}]
    },
    "Status": {
      "select": {"name": "Active"}
    },
    "Priority": {
      "select": {"name": "1st Priority"}
    }
  },
  "template": {
    "type": "template_id",
    "template_id": "17e577f8-2e28-81ef-ad01-d9e271fd6b68"
  }
}' POST 'https://api.notion.com/v1/pages' \
  "Authorization: Bearer $NOTION_API_KEY" \
  'Notion-Version: 2022-06-28'
```

### After Creation: Set Relations via MCP

```javascript
mcp__notion__notion-update-page({
  page_id: "<new_page_id>",
  command: "update_properties",
  properties: {
    "Quarter": "[\"https://www.notion.so/<quarter_page_id>\"]",
    "Outcome Goals": "[\"https://www.notion.so/<goal_page_id>\"]"
  }
})
```

### Why This Pattern?

| Approach | Result |
|----------|--------|
| `duplicate-page` | Creates a NEW TEMPLATE, not a regular page |
| `create-pages` without content | Blank page (API bypasses default template) |
| `create-pages` with content | Missing linked database views |
| **Direct API with template_id** | ✅ Full template with linked databases |

## Creating Accomplishments/Disappointments

Simple `create-pages` works - no complex template needed:

```javascript
mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "17e577f8-2e28-8138-a7c5-000bdd245764"},
  pages: [{
    properties: {
      "Accomplishment": "What you accomplished",
      "Quarter": "[\"https://www.notion.so/<quarter_page_id>\"]"
    }
  }]
})
```

## Creating Outcome Goals

```javascript
mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "17e577f8-2e28-8149-be9c-000b4fe59e54"},
  pages: [{
    properties: {
      "Outcome Goals": "Goal name",
      "Status": "Active",
      "Success Threshold": "How to measure success",
      "date:Target Completion Date:start": "2026-03-31",
      "date:Target Completion Date:is_datetime": 0
    }
  }]
})
```

## Updating Page Content

Use `replace_content_range` with unique selection patterns:

```javascript
mcp__notion__notion-update-page({
  page_id: "<id>",
  command: "replace_content_range",
  selection_with_ellipsis: "### **Thoughts & Reminders**...<empty-block/>",
  new_str: "### **Thoughts & Reminders**\n- New content\n<empty-block/>"
})
```

## Relation Fields

Relations require JSON array of page URLs:
```
"Quarter": "[\"https://www.notion.so/<page_id>\"]"
"Outcome Goals": "[\"https://www.notion.so/<goal_page_id>\"]"
```

## Quarterly Review Structure

1. **Debrief** - Accomplishments, Disappointments, Am I on track?
2. **Process & Update** - Review Quarters, Goals, Projects
3. **Someday/Maybe** - Activate waiting items

## Best Practices

1. **Projects require direct API** - MCP doesn't support template parameter
2. **Use MCP for updates** - Works well for properties and content
3. **Fetch before update** - See current schema and unique patterns
4. **Relations are URL arrays** - JSON format required
5. **Date fields expanded** - `date:Field:start`, `date:Field:is_datetime`

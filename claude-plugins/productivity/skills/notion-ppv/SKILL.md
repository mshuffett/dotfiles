---
name: Notion PPV Interaction
description: Use when interacting with Notion PPV system, creating projects, updating goals, doing quarterly reviews, or working with PPV databases. Provides MCP tool patterns and key database IDs.
version: 0.1.0
---

# Notion PPV Interaction Guide

Patterns for interacting with Michael's PPV (Pillars, Pipelines, Vaults) system in Notion via MCP tools.

## MCP Tools Available

- `mcp__notion__notion-search` - Search pages/databases
- `mcp__notion__notion-fetch` - Get page/database content and schema
- `mcp__notion__notion-create-pages` - Create new pages in databases
- `mcp__notion__notion-update-page` - Update page properties or content
- `mcp__notion__notion-duplicate-page` - Duplicate a page (use for templates!)

## Key PPV Database IDs

| Database | Data Source ID | Purpose |
|----------|----------------|---------|
| Accomplishments | `17e577f8-2e28-8138-a7c5-000bdd245764` | Q3/Q4 wins |
| Disappointments | `17e577f8-2e28-81da-a2ef-000b4a08f006` | Lessons learned |
| Quarters | `17e577f8-2e28-8198-ab3e-000b64c1b87d` | Quarterly reviews |
| Outcome Goals | `17e577f8-2e28-8149-be9c-000b4fe59e54` | Measurable goals |
| Projects | `17e577f8-2e28-81cb-8e3d-000bc55b9945` | Active projects |
| Value Goals | `17e577f8-2e28-8184-88a1-000bf4c9f064` | Core values |

## Key Page IDs

| Page | ID | Notes |
|------|-----|-------|
| Q3 2025 | `2c2577f8-2e28-80a5-b2f9-e9eabfc36dad` | |
| Q4 2025 | `28d577f8-2e28-80f7-89c9-cf447c8d2a58` | |
| 2024 Annual Reflection | `16b577f82e28806ea3ccdc2ded3713ee` | 7-step journey |
| Project Template | `17e577f8-2e28-81ef-ad01-d9e271fd6b68` | Duplicate for new projects |

## Creating a New Project (IMPORTANT)

**Do NOT use `create-pages` for projects.** The Projects database has a template with complex layout (linked database views for Action Items, Notes, Documents, People, etc.).

**Correct Pattern**:
1. Duplicate the template: `notion-duplicate-page` with `17e577f8-2e28-81ef-ad01-d9e271fd6b68`
2. Update properties: `notion-update-page` with `command: "update_properties"`
3. Update content: `notion-update-page` with `command: "replace_content_range"`

```
// Step 1: Duplicate template
mcp__notion__notion-duplicate-page(page_id: "17e577f8-2e28-81ef-ad01-d9e271fd6b68")
// Returns new page ID

// Step 2: Update properties
mcp__notion__notion-update-page({
  page_id: "<new_id>",
  command: "update_properties",
  properties: {
    "Project": "Project Name",
    "Status": "Active",
    "Priority": "1st Priority",
    "Quarter": "[\"https://www.notion.so/<quarter_page_id>\"]"
  }
})

// Step 3: Update content (Thoughts & Reminders section)
mcp__notion__notion-update-page({
  page_id: "<new_id>",
  command: "replace_content_range",
  selection_with_ellipsis: "### <span color...Reminders**</span>...<empty-block/>",
  new_str: "### <span color=\"purple\">**Thoughts & Reminders**</span> {color=\"purple\"}\n\t\t- Your notes here\n\t\t<empty-block/>"
})
```

## Creating Accomplishments/Disappointments

Simple `create-pages` works fine - no complex template:

```
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

```
mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "17e577f8-2e28-8149-be9c-000b4fe59e54"},
  pages: [{
    properties: {
      "Outcome Goals": "Goal name",
      "Status": "Active",
      "Success Threshold": "How to measure success",
      "Comment": "Additional context",
      "date:Target Completion Date:start": "2026-03-31",
      "date:Target Completion Date:is_datetime": 0
    }
  }]
})
```

## Quarterly Review Structure

The Q3/Q4 review page has these sections:
1. **Debrief** - Accomplishments, Disappointments, Am I on track?
2. **Process & Update** - Review Quarters, Goals, Projects
3. **Someday/Maybe** - Activate any waiting items

Key questions to update in debrief:
- Am I on track?
- Has my desired end-of-year objective changed?
- How can I best move toward objectives?

## Annual Reflection Structure

The 2024 Annual Reflection uses a 7-step journey:
1. A Look Back
2. Eulogy
3. Five Lives
4. Gap Analysis
5. Defining Success
6. Setting Goals for Momentum
7. Postcard To The Future

Each step is a separate page with synced blocks containing prompts and answers.

## Relation Fields

Relations in Notion require JSON array of page URLs:
```
"Quarter": "[\"https://www.notion.so/<page_id>\"]"
"Outcome Goals": "[\"https://www.notion.so/<goal_page_id>\"]"
```

## Best Practices

1. **Always fetch first** - Get the page/database to see current schema and content
2. **Use duplicate for templates** - Projects, Quarters have complex layouts
3. **Use create-pages for simple** - Accomplishments, Goals work with direct creation
4. **Relations are URL arrays** - Format as JSON array of page URLs
5. **Date fields are expanded** - Use `date:Field Name:start`, `date:Field Name:is_datetime`

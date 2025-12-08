---
name: Notion PPV Interaction
description: Use when interacting with Notion PPV system, creating projects, updating goals, doing quarterly reviews, or working with PPV databases. Provides MCP tool patterns and key database IDs.
version: 0.2.0
---

# Notion PPV Interaction Guide

Patterns for interacting with Michael's PPV (Pillars, Pipelines, Vaults) system in Notion via MCP tools.

## MCP Tools Available

- `mcp__notion__notion-search` - Search pages/databases
- `mcp__notion__notion-fetch` - Get page/database content and schema
- `mcp__notion__notion-create-pages` - Create new pages in databases (with content!)
- `mcp__notion__notion-update-page` - Update page properties or content
- `mcp__notion__notion-duplicate-page` - Duplicate a page (⚠️ see warning below)

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

## Creating a New Project (IMPORTANT)

⚠️ **Do NOT use `duplicate-page`** - it preserves template status, creating a new template instead of a regular page.

⚠️ **Do NOT use `create-pages` without content** - the API bypasses Notion's default template, creating a blank page.

**Correct Pattern**: Use `create-pages` WITH the template content structure:

```javascript
mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "17e577f8-2e28-81cb-8e3d-000bc55b9945"},
  pages: [{
    properties: {
      "Project": "Project Name",
      "Status": "Active",
      "Priority": "1st Priority",
      "Quarter": "[\"https://www.notion.so/<quarter_page_id>\"]",
      "Outcome Goals": "[\"https://www.notion.so/<goal_page_id>\"]"
    },
    content: `<columns>
	<column>
		### <span color="purple">**Thoughts & Reminders**</span> {color="purple"}
		- Your project notes here
		<empty-block/>
	</column>
	<column>
		<callout icon="/icons/push-pin_purple.svg" color="gray_bg">
			<span color="purple">**OUTCOME GOALS**</span>
		</callout>
		<empty-block/>
	</column>
</columns>
> <span color="purple">**ACTION ITEMS**</span>
	---
<empty-block/>
<columns>
	<column>
		<callout icon="/icons/compose_purple.svg" color="gray_bg">
			<span color="purple">**NOTES & MEETINGS**</span>
		</callout>
	</column>
	<column>
		<callout icon="/icons/attachment_purple.svg" color="gray_bg">
			<span color="purple">**DOCUMENTS**</span>
		</callout>
	</column>
</columns>
<empty-block/>
<columns>
	<column>
		<callout icon="/icons/user-circle_purple.svg" color="gray_bg">
			<span color="purple">**PEOPLE**</span>
		</callout>
	</column>
	<column>
		<callout icon="/icons/hashtag_purple.svg" color="gray_bg">
			<span color="purple">**KNOWLEDGE TOPICS**</span>
		</callout>
	</column>
</columns>
<empty-block/>
<columns>
	<column>
		<callout icon="/icons/shopping-cart_purple.svg" color="gray_bg">
			<span color="purple">**GOODS & SERVICES**</span>
		</callout>
	</column>
	<column>
		<callout icon="/icons/download_purple.svg" color="gray_bg">
			<span color="purple">**MEDIA**</span>
		</callout>
	</column>
</columns>`
  }]
})
```

**Note**: The template includes linked database views that won't be recreated via API. The callout sections provide the visual structure; users can manually add linked views if needed.

## Creating Accomplishments/Disappointments

Simple `create-pages` works fine - no complex template:

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
2. **Use create-pages WITH content for projects** - Include the template structure in the content field
3. **Never use duplicate-page for templates** - Creates a new template, not a regular page
4. **Use create-pages for simple databases** - Accomplishments, Goals work with just properties
5. **Relations are URL arrays** - Format as JSON array of page URLs
6. **Date fields are expanded** - Use `date:Field Name:start`, `date:Field Name:is_datetime`

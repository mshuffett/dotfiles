---
name: ppv-weekly
description: Weekly review routine - plan your week
allowed-tools: Bash, mcp__notion__notion-fetch, mcp__notion__notion-search, mcp__notion__notion-create-pages, mcp__notion__notion-update-page, mcp__notion__notion-list-issues
---

# Weekly Review Routine

Guide Michael through his PPV weekly review (typically Sunday).

## Step 1: Check/Create This Week's Entry

First, find or create this week's entry in the Weeks database:

```bash
source ~/.env.zsh
# Get Monday of this week
WEEK_START=$(date -v-$(date +%u)d -v+1d +%Y-%m-%d 2>/dev/null || date -d "last monday" +%Y-%m-%d)
WEEK_END=$(date -v-$(date +%u)d -v+7d +%Y-%m-%d 2>/dev/null || date -d "next sunday" +%Y-%m-%d)

curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8173-ad70-da8545a5b40b/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Date","date":{"on_or_after":"'"$WEEK_START"'"}},{"property":"Date","date":{"on_or_before":"'"$WEEK_END"'"}}]}}' | jq -r 'if .results | length > 0 then "Found: \(.results[0].id) - \(.results[0].properties["Week Title"].title[0].plain_text)" else "No entry found for this week" end'
```

If no entry exists, create one using Notion MCP:
- Database: Weeks (`17e577f8-2e28-8173-ad70-da8545a5b40b`)
- Data source: `collection://17e577f8-2e28-8186-b8d7-000b3ee8cfa3`
- Properties:
  - `Week Title`: "Week of [Month Day] <<"
  - `date:Date:start`: Monday of this week
  - `date:Date:end`: Sunday of this week

Template page for reference: `2c2577f82e2880608da2fcc41cbe6712`

## Step 2: Gather Week's Data

### Action Items Completed This Week
```bash
source ~/.env.zsh
WEEK_START=$(date -v-$(date +%u)d -v+1d +%Y-%m-%d 2>/dev/null || date -d "last monday" +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Completion Date","date":{"on_or_after":"'"$WEEK_START"'"}},{"property":"Done","checkbox":{"equals":true}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]}}' | jq -r '.results[] | "✓ \(.properties["Action Item"].title[0].plain_text)"'
```

### Daily Tracking Entries This Week (Improvements & Habits)
```bash
source ~/.env.zsh
WEEK_START=$(date -v-$(date +%u)d -v+1d +%Y-%m-%d 2>/dev/null || date -d "last monday" +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8135-8cb8-d4ad6d41408d/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Date","date":{"on_or_after":"'"$WEEK_START"'"}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]},"sorts":[{"property":"Date","direction":"ascending"}]}' | jq -r '.results[] | "[\(.properties.Date.date.start)] Workout:\(.properties.Workout.checkbox) Meditate:\(.properties.Meditate.checkbox) | Improvements: \(.properties.Improvements.rich_text[0].plain_text // "none")"'
```

### "Waiting On" Action Items
```bash
source ~/.env.zsh
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Status","select":{"equals":"Waiting"}},{"property":"Done","checkbox":{"equals":false}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]}}' | jq -r '.results[] | "⏳ \(.properties["Action Item"].title[0].plain_text)"'
```

### Active Projects
```bash
source ~/.env.zsh
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-81ed-ae33-e18b1dcfeae5/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"property":"Status","select":{"equals":"Active"}}}' | jq -r '.results[] | "📁 \(.properties.Name.title[0].plain_text)"'
```

## Step 3: Guide Through Weekly Review Checklist

### I. Pillars
- [ ] Review Guiding Principles (quick skim)
- [ ] Weekly Reflection - review performance stats
- [ ] Enter: Effectiveness rating, Gratitude, Improvement Summary

### II. Pipelines
- [ ] **Email Cleanup** - Inbox organized, starred emails processed
- [ ] **Calendar Review**
  - Last 2 weeks: anything need follow-up?
  - Next 3 weeks: need to prep for anything?
- [ ] Review "Waiting On" items - need to follow up?
- [ ] **Projects Review** - each active project has a next action?
- [ ] Mark "Weekly" in Daily Tracking Reviews property
- [ ] Add next week's entry (with "<<" marker)

### III. Vaults
- [ ] Check Notes to Review
- [ ] Desktop & Downloads cleanup
- [ ] Paper processing

## Step 4: Update Entries

After review, update:

1. **Week entry** with Effectiveness, Gratitude, Focus/Objective, Improvement Summary
2. **Today's Daily Tracking** - add "Weekly" to Reviews property

Use `mcp__notion__notion-update-page` for updates.

Example for Week entry:
```json
{
  "page_id": "<week_page_id>",
  "command": "update_properties",
  "properties": {
    "Effectiveness": "4 ⭐️⭐️⭐️⭐️",
    "Gratitude": "Productive sprint week, good progress on demo",
    "Focus/Objective": "Ship demo v1, hiring pipeline",
    "Improvement Summary": "Better time-boxing needed, reduce context switching"
  }
}
```

Example for Daily Tracking Reviews:
```json
{
  "page_id": "<today_page_id>",
  "command": "update_properties",
  "properties": {
    "Reviews": ["Weekly"]
  }
}
```

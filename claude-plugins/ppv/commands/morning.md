---
name: ppv-morning
description: Morning planning routine - start your day
allowed-tools: Bash, mcp__notion__notion-fetch, mcp__notion__notion-search, mcp__notion__notion-create-pages, mcp__notion__notion-update-page
---

# Morning Startup Routine

Guide Michael through his PPV morning startup routine.

## Step 1: Check/Create Today's Daily Tracking Entry

First, check if today's Daily Tracking entry exists:

```bash
source ~/.env.zsh
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8135-8cb8-d4ad6d41408d/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"property":"Date","date":{"equals":"'"$TODAY"'"}}}' | jq '.results | length'
```

If 0 results, create a new entry using the Notion MCP:
- Database: Daily Tracking (`17e577f8-2e28-8135-8cb8-d4ad6d41408d`)
- Data source: `collection://17e577f8-2e28-8183-9177-000bbb7d847f`
- Properties:
  - `Date Title`: "Michael @Today" or formatted date
  - `date:Date:start`: today's date (YYYY-MM-DD)
  - `Owner`: Michael's ID `5923a1d0-4c9c-4376-b7d7-3c50704758c1`

Template page for reference: `2c2577f82e28802e9932ee56c4f94a6d`

## Step 2: Fetch Recent Improvements (for "Don't do X → do Y")

Get the last 3 days of Daily Tracking entries with Improvements:

```bash
source ~/.env.zsh
THREE_DAYS_AGO=$(date -v-3d +%Y-%m-%d 2>/dev/null || date -d '-3 days' +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8135-8cb8-d4ad6d41408d/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Date","date":{"on_or_after":"'"$THREE_DAYS_AGO"'"}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]},"sorts":[{"property":"Date","direction":"descending"}]}' | jq -r '.results[] | "[\(.properties.Date.date.start)] \(.properties.Improvements.rich_text[0].plain_text // "No improvements logged")"'
```

## Step 3: Fetch Today's Action Items

```bash
source ~/.env.zsh
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Do Date","date":{"on_or_before":"'"$TODAY"'"}},{"property":"Done","checkbox":{"equals":false}},{"property":"Parent item","relation":{"is_empty":true}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]},"sorts":[{"property":"Priority","direction":"ascending"}]}' | jq -r '.results[] | "\(.properties.Priority.select.name // "No Priority") | \(.properties["Action Item"].title[0].plain_text)"'
```

## Step 4: Guide Through Morning Routine

Present to Michael:

### Morning Startup Checklist

1. **Tracking Stats** - Enter wakeup time, weight, etc. in Daily Tracking
2. **Gratitude** - "I'm grateful for..."
3. **What would make today great?** - Pick 1-3 items from action items
4. **Don't do X → do Y** - Based on recent improvements
5. **Mindset & Visualization** - Quick review

### Habits to Track Today
- [ ] Meditate
- [ ] Bullet Planner
- [ ] Mindset
- [ ] Visualization
- [ ] Read
- [ ] Workout
- [ ] Schedule Tomorrow
- [ ] Logged Food

Ask Michael what he wants to focus on and help him set intentions for the day.

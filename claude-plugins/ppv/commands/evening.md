---
name: ppv-evening
description: Evening shutdown routine - end your day
allowed-tools: Bash, mcp__notion__notion-fetch, mcp__notion__notion-search, mcp__notion__notion-update-page
---

# Evening Shutdown Routine

Guide Michael through his PPV end-of-day routine.

## Step 1: Fetch Today's Daily Tracking Entry

```bash
source ~/.env.zsh
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8135-8cb8-d4ad6d41408d/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Date","date":{"equals":"'"$TODAY"'"}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]}}' | jq -r '.results[0] | "ID: \(.id)\nHabits completed: Meditate=\(.properties.Meditate.checkbox) | Workout=\(.properties.Workout.checkbox) | Read=\(.properties.Read.checkbox) | Mindset=\(.properties.Mindset.checkbox)"'
```

## Step 2: Fetch Action Items Completed Today

```bash
source ~/.env.zsh
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Completion Date","date":{"equals":"'"$TODAY"'"}},{"property":"Done","checkbox":{"equals":true}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]}}' | jq -r '.results[] | "✓ \(.properties["Action Item"].title[0].plain_text)"'
```

## Step 3: Check What's Still Open

```bash
source ~/.env.zsh
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Do Date","date":{"on_or_before":"'"$TODAY"'"}},{"property":"Done","checkbox":{"equals":false}},{"property":"Parent item","relation":{"is_empty":true}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]},"sorts":[{"property":"Priority","direction":"ascending"}]}' | jq -r '.results[] | "○ \(.properties.Priority.select.name // "No Priority") | \(.properties["Action Item"].title[0].plain_text)"'
```

## Step 4: Guide Through Evening Routine

Present to Michael:

### End of Day Review

**Today's Wins:**
- List completed action items
- Ask: "What else went well today?"

**Habits Status:**
Review which habits were completed and which weren't.

**Improvements for Tomorrow:**
Ask: "What would you do differently? Any 'Don't do X → do Y' notes?"

Use the Notion MCP to update the Daily Tracking entry's Improvements field if Michael provides notes.

**Schedule Tomorrow:**
- [ ] Mark "Schedule Tomorrow" habit as done if planning is complete
- Review tomorrow's calendar
- Ensure top priorities are set for tomorrow

### Update Daily Tracking

If Michael provides improvements or wants to update habits, use `mcp__notion__notion-update-page` with:
- Page ID from Step 1
- Properties to update (Improvements text, habit checkboxes, Bedtime, etc.)

Example update for Improvements:
```json
{
  "page_id": "<page_id>",
  "command": "update_properties",
  "properties": {
    "Improvements": "Don't check email first thing → Start with top priority task"
  }
}
```

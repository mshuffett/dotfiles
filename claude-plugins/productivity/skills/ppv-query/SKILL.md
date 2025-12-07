---
name: PPV Query
description: Query Michael's PPV (Pillars, Pipelines, Vaults) Notion planning system for action items, projects, goals, and planning data. Use when user asks about tasks, to-dos, projects, goals, or "what's on my plate".
version: 1.0.0
---

# PPV Query Skill

Use this skill when the user asks about their:
- Action items, tasks, or to-dos
- Projects or project status
- Goals (outcome goals, value goals)
- PPV system, planning, or Notion data
- "What's on my plate", "what do I need to do", "my tasks"
- Anything related to their Notion planning system

## PPV System Overview

PPV (Pillars, Pipelines, Vaults) is a productivity system in Notion:
- **Pillars**: Life structure (identity, habits, routines)
- **Pipelines**: Action items (tasks, projects, goals)
- **Vaults**: Knowledge storage (notes, people, documents)

## Database IDs for API Queries

Requires `$NOTION_API_KEY` environment variable (loaded from ~/.env.zsh).

### Pipelines (Action)
| Database | ID |
|----------|-----|
| Action Items | `17e577f8-2e28-8181-aa14-e20e6759705a` |
| Projects | `17e577f8-2e28-81ed-ae33-e18b1dcfeae5` |
| Outcome Goals | `17e577f8-2e28-8133-bfee-cdc469747b60` |
| Value Goals | `17e577f8-2e28-8119-afd1-c845cec1bef3` |

### Cycles & Tracking
| Database | ID |
|----------|-----|
| Daily Tracking | `17e577f8-2e28-8135-8cb8-d4ad6d41408d` |
| Weeks | `17e577f8-2e28-8173-ad70-da8545a5b40b` |

### Vaults
| Database | ID |
|----------|-----|
| Notes | `17e577f8-2e28-817a-8c4c-f04bc5902f9c` |
| People | `17e577f8-2e28-8196-b750-dada632d4853` |

## Key Pages

| Page | ID |
|------|-----|
| PPV Command Center | `17e577f82e2880778556d4ee157922c3` |
| Michael's Action Zone | `17e577f82e28817eb34ad1a45e97b750` |
| Michael's Alignment Zone | `17e577f82e2880b89d96ea104bb52b09` |

## Templates

Templates are stored as pages in Notion (API doesn't expose database templates directly).
All templates are also accessible from [Michael's Alignment Zone](https://www.notion.so/composeai/Michael-s-Alignment-Zone-17e577f82e2880b89d96ea104bb52b09).

| Template | Page ID | URL | Database |
|----------|---------|-----|----------|
| Daily Tracking (Michael) | `2c2577f82e28802e9932ee56c4f94a6d` | [Link](https://www.notion.so/composeai/Michael-2c2577f82e28802e9932ee56c4f94a6d) | Daily Tracking |
| New Week | `2c2577f82e2880608da2fcc41cbe6712` | [Link](https://www.notion.so/composeai/New-Week-Template-2c2577f82e2880608da2fcc41cbe6712) | Weeks |
| New Month | `17e577f82e288142ad73d60722a09ed6` | [Link](https://www.notion.so/composeai/New-Month-Template-17e577f82e288142ad73d60722a09ed6) | Months |
| New Quarter | `17e577f82e28811eaa03da45456b91f8` | [Link](https://www.notion.so/composeai/New-Quarter-Template-17e577f82e28811eaa03da45456b91f8) | Quarters |
| New Year | `17e577f82e28816e886fd4b7b6dc7cea` | [Link](https://www.notion.so/composeai/New-Year-Template-17e577f82e28816e886fd4b7b6dc7cea) | Years |

### Daily Tracking Template Structure
- **Morning Startup**: Startup stats, fitness tracking, gratitude, "what would make today great", mindset
- **Throughout Day**: Habits & routines tracking
- **End of Day**: Today's wins, improvements

### Weekly Template Structure
- **I. Pillars**: Guiding principles review, weekly reflection
- **II. Pipelines**: Email cleanup, calendar review, projects review, "Waiting On" actions
- **III. Vaults**: Notes review, desktop/downloads cleanup, paper processing

### Monthly Template Structure
- **Warm-Up**: Data rollups review, skim action items
- **I. Pillars**: Review pillars, daily tracking performance, habits & routines, workout tracking, mindset
- **II. Pipelines**: Goals review (Value & Outcome), projects review/prioritize
- **III. Vaults**: Empty trash, tidy media/knowledge vaults

### Quarterly Template Structure
- **I. Debrief**: Accomplishments & disappointments, what worked/didn't work, improvements
- **II. Process & Update**: Quarters review, goals & projects quarter assignments
- **III. Someday/Maybe**: Review items ready to activate

### Annual Template Structure
- **I. Review**: Quarterly debriefs, accomplishments/disappointments, 12-month assessment (Reflect → Interpret → Visualize), guiding principles update
- **II. Planning**: Pillars, habits & routines, value goals, outcome goals, projects, quarters

## Query Examples

### Today's Action Items (Due today or earlier, not done, top-level, owned by Michael)
```bash
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Do Date","date":{"on_or_before":"'"$(date +%Y-%m-%d)"'"}},{"property":"Done","checkbox":{"equals":false}},{"property":"Parent item","relation":{"is_empty":true}},{"property":"Owner","people":{"contains":"5923a1d0-4c9c-4376-b7d7-3c50704758c1"}}]},"sorts":[{"property":"Priority","direction":"ascending"},{"property":"Do Date","direction":"ascending"}]}'
```

### Active Projects
```bash
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-81ed-ae33-e18b1dcfeae5/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"property":"Status","select":{"equals":"Active"}}}'
```

### Create New Action Item
```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "17e577f8-2e28-8181-aa14-e20e6759705a"},
    "properties": {
      "Action Item": {"title": [{"text": {"content": "TASK_TITLE"}}]},
      "Status": {"select": {"name": "Active"}},
      "Priority": {"select": {"name": "1st Priority 🚀"}},
      "Do Date": {"date": {"start": "YYYY-MM-DD"}},
      "Owner": {"people": [{"id": "5923a1d0-4c9c-4376-b7d7-3c50704758c1"}]}
    }
  }'
```

## Action Items Properties

- `Action Item` (title): Task name
- `Priority` (select): Immediate 🔥, Quick ⚡, Scheduled 📅, 1st Priority 🚀, 2nd-5th Priority, Errand 🚘, Remember 💭, ‼️ Repeat
- `Status` (select): Active, Waiting, Next Up, Paused, Future 1-3
- `Do Date` (date): When to do the task
- `Done` (checkbox): Completion status
- `Owner` (people): Assigned person (Michael's ID: 5923a1d0-4c9c-4376-b7d7-3c50704758c1)
- `Projects (DB)` (relation): Linked project

## Routine Commands

| Command | Description |
|---------|-------------|
| `/ppv:morning` | Morning startup routine - check/create daily entry, review improvements, set intentions |
| `/ppv:evening` | Evening shutdown - review wins, completed items, log improvements |
| `/ppv:weekly` | Weekly review - full Pillars/Pipelines/Vaults checklist with data gathering |
| `/ppv:today` | Quick view of today's action items |
| `/ppv:week` | Quick view of this week's action items |
| `/ppv:projects` | Show active projects |
| `/ppv:add-task` | Create a new action item |

## Daily Workflow

### Morning Startup (`/ppv:morning`)
1. Check if today's Daily Tracking entry exists → create if not
2. Fetch recent improvements for "Don't do X → do Y"
3. Fetch today's action items
4. Guide through: tracking stats → gratitude → "what would make today great" → mindset

### Evening Shutdown (`/ppv:evening`)
1. Fetch today's Daily Tracking entry
2. Fetch completed action items
3. Review what's still open
4. Guide through: wins → improvements → schedule tomorrow
5. Update Daily Tracking with improvements

### Weekly Review (`/ppv:weekly`)
1. Check if this week's entry exists → create if not
2. Gather week's data:
   - Action items completed
   - Daily tracking entries (habits, improvements)
   - "Waiting On" items
   - Active projects
3. Guide through checklist:
   - **I. Pillars**: Guiding principles, reflection, performance stats
   - **II. Pipelines**: Email, calendar (2 weeks back, 3 weeks forward), projects
   - **III. Vaults**: Notes, cleanup
4. Update Week entry with effectiveness, gratitude, improvement summary
5. Mark "Weekly" in Daily Tracking Reviews

## Instructions

When querying PPV data:
1. Use the `ppv` CLI tool when available: `ppv today`, `ppv week`, `ppv projects`
2. **Always include these filters for Action Items:**
   - `Parent item is empty` (top-level tasks only, unless specifically asking for subtasks)
   - `Owner = Michael` (ID: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`)
3. For "Today" view: Do Date ≤ today AND Done = false AND Parent empty AND Owner = Michael
4. For "This Week" view: Do Date ≤ 1 week AND Done = false AND Status = Active AND Parent empty AND Owner = Michael
5. Parse JSON response and present cleanly as markdown tables
6. For creating items, set Owner to Michael's ID

## Data Source IDs (for MCP create-pages)

| Database | Data Source URL |
|----------|-----------------|
| Action Items | `collection://17e577f8-2e28-81cf-9d6b-000bc2cf0d50` |
| Daily Tracking | `collection://17e577f8-2e28-8183-9177-000bbb7d847f` |
| Weeks | `collection://17e577f8-2e28-8186-b8d7-000b3ee8cfa3` |
| Projects | `collection://17e577f8-2e28-81cb-8e3d-000bc55b9945` |

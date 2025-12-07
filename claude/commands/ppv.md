# PPV (Pillars, Pipelines, Vaults) Planning System

Use this command when user asks about their PPV system, action items, projects, goals, or Notion planning data.

## System Overview

PPV is a productivity/planning system with three core components:
- **Pillars**: Life areas and structure (identity, habits, routines)
- **Pipelines**: Action-oriented items (tasks, projects, goals)
- **Vaults**: Knowledge storage (notes, people, documents)

## Key Pages

| Page | ID |
|------|-----|
| 2025 Shared PPV Command Center | `17e577f82e2880778556d4ee157922c3` |
| Michael's Action Zone | `17e577f82e28817eb34ad1a45e97b750` |
| Michael's Alignment Zone | `17e577f82e2880b89d96ea104bb52b09` |
| Shared Action Zone | `181577f82e288043baebf60d8a2f58dd` |
| Shared Alignment Zone | `17e577f82e2881e8b17eccdb4fc88d80` |

## Database IDs (for API queries)

### Pipelines (Action)
| Database | Database ID | Data Source ID |
|----------|-------------|----------------|
| Action Items | `17e577f8-2e28-8181-aa14-e20e6759705a` | `17e577f8-2e28-81cf-9d6b-000bc2cf0d50` |
| Projects | `17e577f8-2e28-81ed-ae33-e18b1dcfeae5` | `17e577f8-2e28-81cb-8e3d-000bc55b9945` |
| Outcome Goals | `17e577f8-2e28-8133-bfee-cdc469747b60` | `17e577f8-2e28-8149-be9c-000b4fe59e54` |
| Value Goals | `17e577f8-2e28-8119-afd1-c845cec1bef3` | `17e577f8-2e28-8184-88a1-000bf4c9f064` |
| Commitments Log | `1cc577f8-2e28-8043-8daa-d04314275f10` | `1cc577f8-2e28-80e8-aa2e-000bcee89677` |
| Content Pipeline | `17e577f8-2e28-819d-91bc-c945ae16cc9b` | `17e577f8-2e28-8167-9252-000b4f56e8d6` |

### Pillars (Structure)
| Database | Database ID | Data Source ID |
|----------|-------------|----------------|
| Pillars | `17e577f8-2e28-812d-b4c5-eaeb63bf36d3` | `17e577f8-2e28-815d-937a-000b8f425462` |
| Habits & Routines | `17e577f8-2e28-81f0-b2ea-d5a7bf1383f3` | `17e577f8-2e28-816c-ad4d-000b9d1af37d` |
| Workout Tracking | `17e577f8-2e28-8127-b713-fb2a87b7449d` | `17e577f8-2e28-8180-bc4d-000b105eed06` |

### Vaults (Knowledge)
| Database | Database ID | Data Source ID |
|----------|-------------|----------------|
| Knowledge Vault | `17e577f8-2e28-8106-ad2f-d3b08d7b7ac7` | `17e577f8-2e28-81b9-a0cb-000b6732ad7b` |
| Notes, Meetings & Ideas | `17e577f8-2e28-817a-8c4c-f04bc5902f9c` | `17e577f8-2e28-81dd-9362-000b2a691b0e` |
| Media Vault | `17e577f8-2e28-815a-b11c-d3d3c711f885` | `17e577f8-2e28-8113-b66e-000b9aea66a9` |
| People Database | `17e577f8-2e28-8196-b750-dada632d4853` | `17e577f8-2e28-8126-9620-000b3f271843` |
| Documents Vault | `17e577f8-2e28-812a-8a34-ecefd53f8bf8` | `17e577f8-2e28-819a-bade-000b7a3e36f3` |
| Goods & Services | `17e577f8-2e28-8190-ada2-c6876f2fc0ae` | `17e577f8-2e28-816f-aee5-000b948956a5` |
| Courses & Training | `17e577f8-2e28-81b3-9ab7-e298c291c645` | `17e577f8-2e28-812c-a652-000b0327ea8f` |

### Cycles & Reviews
| Database | Database ID | Data Source ID |
|----------|-------------|----------------|
| Daily Tracking | `17e577f8-2e28-8135-8cb8-d4ad6d41408d` | `17e577f8-2e28-8183-9177-000bbb7d847f` |
| Weeks | `17e577f8-2e28-8173-ad70-da8545a5b40b` | `17e577f8-2e28-8186-b8d7-000b3ee8cfa3` |
| Months | `17e577f8-2e28-8170-8b72-ccbb80ff7de8` | `17e577f8-2e28-8156-85f8-000be2f5bd5f` |
| Quarters | `17e577f8-2e28-81c3-ae40-e5ae806b1424` | `17e577f8-2e28-8198-ab3e-000b64c1b87d` |
| Years | `17e577f8-2e28-8135-9e02-caf6a8f0e535` | `17e577f8-2e28-81e3-baf9-000bc8fc912d` |
| Accomplishments | `17e577f8-2e28-81c1-b79a-d8ad65cd34d4` | `17e577f8-2e28-8138-a7c5-000bdd245764` |
| Disappointments | `17e577f8-2e28-818d-84eb-ed8511bc9a4c` | `17e577f8-2e28-81da-a2ef-000b4a08f006` |

## Query Commands

To query Action Items (today's tasks):
```bash
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-8181-aa14-e20e6759705a/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"and":[{"property":"Do Date","date":{"on_or_before":"'$(date +%Y-%m-%d)'"}},{"property":"Done","checkbox":{"equals":false}},{"property":"Status","select":{"equals":"Active"}}]},"sorts":[{"property":"Priority","direction":"ascending"},{"property":"Do Date","direction":"ascending"}]}'
```

To query Projects:
```bash
curl -s -X POST "https://api.notion.com/v1/databases/17e577f8-2e28-81ed-ae33-e18b1dcfeae5/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"property":"Status","select":{"equals":"Active"}}}'
```

## Action Items Schema

Key properties for Action Items database:
- `Action Item` (title): Task name
- `Priority` (select): Immediate, Quick, Scheduled, 1st-5th Priority, Errand, Remember, Repeat
- `Status` (select): Active, Waiting, Next Up, Paused, Future 1-3
- `Do Date` (date): When to do the task
- `Done` (checkbox): Completion status
- `Owner` (people): Assigned person
- `Projects (DB)` (relation): Linked project
- `Outcome Goals` (relation): Linked goals

## Usage

When the user asks about their PPV system or action items:

1. **For today's tasks**: Query Action Items with `Do Date <= today`, `Done = false`, `Status = Active`
2. **For projects**: Query Projects database with status filter
3. **For goals**: Query Outcome Goals or Value Goals databases
4. **For general PPV info**: Use the Notion MCP tools to fetch relevant pages

Always use `$NOTION_API_KEY` environment variable for authentication.

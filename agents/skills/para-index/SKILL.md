---
name: PARA Index
description: Use when organizing tasks, processing inbox items, or mapping between Todoist, Notion, and Obsidian PARA systems.
---

# Universal PARA Index

This skill provides the mapping between PARA categories across Todoist, Notion, and Obsidian.

## PARA Overview

- **P**rojects: Tasks with a deadline and defined outcome
- **A**reas: Ongoing responsibilities with standards to maintain
- **R**esources: Reference material and information
- **A**rchive: Completed/inactive items

## System Integration

### Notion PPV (Source of Truth for Projects)

**Projects Database**: `collection://17e577f8-2e28-81cb-8e3d-000bc55b9945`
- URL: https://www.notion.so/17e577f82e2881edae33e18b1dcfeae5
- Fields: Project (title), Status, Priority, Quarter, Outcome Goals

**Action Items Database**: `collection://17e577f8-2e28-81cf-9d6b-000bc2cf0d50`
- URL: https://www.notion.so/17e577f82e288181aa14e20e6759705a
- Fields: Action Item (title), Status, Priority, Do Date, Done, Projects (DB)
- Priority options: Immediate, Quick, Scheduled, 1st-5th Priority, Errand, Remember

### Todoist Structure

#### Container Projects

| Category | ID | Name |
|----------|-----|------|
| Projects | 2359994569 | 1-Projects |
| Areas | 2359994572 | 2-Areas |
| Resources | 2359995015 | 3-Resources |
| Inbox | 377445380 | Inbox |

#### Active Projects (under 1-Projects)

| ID | Name | Notion Equivalent |
|----|------|-------------------|
| 2361483339 | DaVinci | DaVinci |
| 2361088358 | Space at Embarcadero | Space at Embarcadero |
| 2360467902 | Purchase Computer Equipment | - |
| 2360467715 | Manage Personal Financial Runway | Manage Personal Financial Runway |
| 2359995105 | Solidify Sprint / Daily Process | - |
| 2360261804 | Ship Waycraft Experiment | Ship Waycraft Experiment |
| 2360261810 | Ship Everything AI Experiment | Ship Everything AI Experiment |
| 2360473311 | Investigate Fyxer Features | - |
| 2360468541 | Prep for Founder Satsang AI Talk | - |
| 2360927142 | Ship to Beach Dashboard | - |
| 2360927149 | Sprint Execution | - |

#### Areas (under 2-Areas)

| ID | Name | Sub-Areas |
|----|------|-----------|
| 2360468426 | Foundation | - |
| 2360467840 | Backlogs | Ops, Setup, Strategy, idea, Waycraft, Everything AI |
| 2360261784 | People | Denys, Michelle, Alton, Devin and Yu-Chi, etc. |
| 2356814197 | M&E | Art of San Francisco |
| 2359995207 | ADHD | - |
| 2351862275 | Tickler | - |
| 2352874867 | Genova Estate | - |

#### Resources (under 3-Resources)

| ID | Name |
|----|------|
| 2216540478 | R/Wisdom |
| 2353246721 | Fundraising |

#### Standalone Root Items (Outside PARA Containers)

| ID | Name | Type |
|----|------|------|
| 2360279496 | Daily Briefing | Area |
| 2361090350 | Review | Area |
| 2361090351 | Clarifications | Area |
| 2331010777 | A/Admin | Area |
| 2333454773 | Michael's Low Energy Kanban | Area |
| 2335087773 | Bugs | Area |
| 2359175603 | Security / Infrastructure | Area |
| 2359176111 | Intros | Area |
| 2359176507 | Subscriptions | Area |
| 2359176555 | Memberships | Area |
| 2359176566 | Networking | Resource |
| 2359177322 | Co-Founder Dating | Resource |
| 2359177602 | Accounting | Resource |
| 2359178966 | Events | Resource |
| 2359179348 | Personal Finance | Resource |
| 2359180816 | Apartment | Area |
| 2359185813 | Health & Fitness | Area |
| 2359571061 | Coaching | Area |
| 2362258704 | tools | Resource |
| 2362911293 | Engineer Hiring – Everything AI | Project |

### Obsidian Structure

**Vault Location**: `~/ws/notes/`

#### Core PARA Folders

| Folder | PARA Category | Item Count |
|--------|---------------|------------|
| +Inbox | Capture | ~52 |
| 0-Gate | Processing | - |
| 1-Projects | Projects | ~10 |
| 2-Areas | Areas | ~58 |
| 3-Resources | Resources | ~16 |
| 4-Archives | Archive | ~25 |
| 5-Tools | System | - |

#### Projects (1-Projects)

| Folder | Description |
|--------|-------------|
| Ship to Beach | Sprint dashboard project |
| DaVinci | AI project |
| Financial Runway Planning | Personal finance planning |
| Compose AI Telemetry | Analytics project |
| Claude Continuous Runner | Automation project |
| Todoist Test Dataset | Testing infrastructure |
| Gemini Pipecat Hackathon | Hackathon project |
| Space at Embarcadero | Real estate project |

#### Areas (2-Areas) - Key Folders

| Folder | Description |
|--------|-------------|
| Agents | AI agent development |
| Foundation | Core business ops |
| Everything AI Strategy | Company strategy |
| Fundraise | Investor relations |
| Coaching | Personal development |
| People | Relationships & contacts |
| PRDs | Product requirements |
| Ideas | Idea capture |
| Vision | Long-term planning |
| Product | Product development |
| Hiring | Recruitment |

#### Resources (3-Resources)

| Folder | Description |
|--------|-------------|
| Raw Ideas | Unprocessed ideas |
| Tools | Tool documentation |
| Prompts | AI prompt library |
| Productivity | Productivity systems |
| Tech-Setup | Technical configurations |
| Articles | Reference articles |
| Communication | Communication templates |

#### Special Files (Root)

| File | Purpose |
|------|---------|
| Basecamp.md | Home base dashboard |
| North Star.md | Goals and direction |
| Working Note Prime.md | Active working note |
| CLAUDE.md | Agent instructions |

#### Supporting Folders

| Folder | Purpose |
|--------|---------|
| Calendar/Daily | Daily notes |
| Calendar/Weekly | Weekly reviews |
| Sprints/ | Sprint management |
| OKRs/ | Objectives & Key Results |
| Templates/ | Note templates |

## Task Processing Workflow

When processing a task from Todoist triage:

### 1. Determine PARA Category

Ask: "Does this have a deadline and clear end state?"
- **Yes** -> Project
- **No** -> Area or Resource

### 2. Map to Existing Container

**If it's a Project task:**
1. Check if project exists in Notion Projects database
2. If yes, create Action Item linked to that project
3. If no, create new project first, then action item

**If it's an Area task:**
1. Identify the Area it belongs to
2. Create Action Item in Notion with appropriate tags
3. Consider: Should this become a project?

**If it's unclear:**
1. Keep in Review/Clarifications for next triage
2. Or create as standalone Action Item

### 3. Create in Notion

Use `mcp__notion__notion-create-pages` with parent `data_source_id: 17e577f8-2e28-81cf-9d6b-000bc2cf0d50`

Required fields:
- `Action Item`: Task title
- `Status`: Active (default)
- `Priority`: Based on urgency

Optional fields:
- `Do Date`: If task has due date
- `Projects (DB)`: Link to project if applicable
- `Short Note`: Description from Todoist

### 4. Complete in Todoist

After creating in Notion, mark task as complete in Todoist or delete if duplicate.

## Quick Reference: Notion Database IDs

| Database | Collection ID | Page ID |
|----------|---------------|---------|
| Projects | 17e577f8-2e28-81cb-8e3d-000bc55b9945 | 17e577f8-2e28-81ed-ae33-e18b1dcfeae5 |
| Action Items | 17e577f8-2e28-81cf-9d6b-000bc2cf0d50 | 17e577f8-2e28-8181-aa14-e20e6759705a |

## Quick Reference: Priority Mapping

| Urgency | Notion Priority | Description |
|---------|-----------------|-------------|
| Today, blocking | Immediate | Must do today |
| < 5 min | Quick | Can knock out fast |
| Has due date | Scheduled | Time-bound |
| Important | 1st Priority | High impact |
| Standard | 2nd-3rd Priority | Normal work |
| Low | 4th-5th Priority | Backlog |
| Errand | Errand | Requires leaving |
| Don't forget | Remember | Mental note |

## Collaborator Reference

| ID | Name | Email |
|----|------|-------|
| 486423 | Michael | mshuffett@gmail.com |
| 42258732 | Michelle Soriano | michelle@compose.ai |
| 48532968 | Evelisa | evelisa@compose.ai |

## Acceptance Checks

- [ ] Task categorized into correct PARA bucket
- [ ] Mapped to appropriate system (Todoist, Notion, or Obsidian)
- [ ] Action items created with required fields
- [ ] Priority correctly assigned based on urgency mapping

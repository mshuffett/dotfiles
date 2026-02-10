---
name: para-index
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

For full Todoist IDs, Obsidian folders, and Notion database IDs, see [references/system-ids.md](references/system-ids.md).

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

## Acceptance Checks

- [ ] Task categorized into correct PARA bucket
- [ ] Mapped to appropriate system (Todoist, Notion, or Obsidian)
- [ ] Action items created with required fields
- [ ] Priority correctly assigned based on urgency mapping

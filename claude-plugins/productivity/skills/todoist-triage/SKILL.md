---
name: Todoist Triage
description: Use when processing Todoist inbox items, daily briefing tasks, or items tagged for review. Provides Eisenhower matrix classification and next action recommendations.
---

# Todoist Triage System

## Overview

This skill provides intelligent triage of Todoist tasks using Eisenhower matrix classification and clear action recommendations.

## Classification Framework

### Eisenhower Matrix

| Quadrant | Urgent? | Important? | Typical Action |
|----------|---------|------------|----------------|
| **Q1: DO** | Yes | Yes | → Notion Immediate 🔥 |
| **Q2: SCHEDULE** | No | Yes | → Notion with Priority |
| **Q3: QUICK** | Yes | No | → Handle now or Quick ⚡ |
| **Q4: ELIMINATE** | No | No | → Delete, Obsidian, or Defer |

### Action Categories

| Action | Icon | When to Use |
|--------|------|-------------|
| **Notion** | 📋 | Clear next action, needs tracking |
| **Quick** | ⚡ | < 5 min, handle immediately |
| **Clarify** | 💭 | Need info from Michael before proceeding |
| **Obsidian** | 📝 | Knowledge, wisdom, ideas to file |
| **Complete** | ✅ | Already done or no longer relevant |
| **Delete** | 🗑️ | Stale, duplicate, or not actionable |

### Priority Mapping (for Notion Action Items)

| Urgency | Notion Priority |
|---------|-----------------|
| Due today, blocking | Immediate 🔥 |
| < 5 minutes | Quick ⚡ |
| Has due date | Scheduled 📅 |
| High impact | 1st Priority 🚀 |
| Standard | 2nd-3rd Priority |
| Low | 4th-5th Priority |
| Errand | Errand 🚘 |
| Mental note | Remember 💭 |

## Task Classification Rules

### → Notion Action Item (Q1/Q2)

**Signals:**
- Has clear next step ("Review X", "Create Y", "Send Z")
- Has deadline or time-sensitivity
- Requires decision or deliverable
- Part of active project

**Output format:**
```
📋 **Notion** → [Priority] | Link: [Project]
Next: [Specific action]
```

### → Quick (Q3)

**Signals:**
- Under 5 minutes to complete
- Simple decision or approval
- Quick communication
- Administrative task

**Output format:**
```
⚡ **Quick** → Handle now
Action: [What to do]
```

### → Clarify (Ask Michael)

**Signals:**
- Ambiguous scope or ownership
- Missing context needed to proceed
- Multiple valid interpretations
- Conflicting with other priorities

**Output format:**
```
💭 **Clarify**
Question: [Direct question to Michael]
Options: [If applicable]
```

### → Obsidian (Q4 - File)

**Signals:**
- Wisdom, principles, insights ("should always...", "remember to...")
- Strategic thinking, vision notes
- Tool/tech evaluations
- Ideas without clear action
- Reference material

**Output format:**
```
📝 **Obsidian** → [Folder path]
Title: [Suggested note title]
```

**Obsidian destinations:**
- `3-Resources/R-Wisdom/` - Principles, life lessons
- `3-Resources/Tools/` - Tech evaluations
- `3-Resources/💡 Raw Ideas/` - Product/feature ideas
- `2-Areas/Vision/` - Strategic thinking
- `2-Areas/Coaching/` - Process/productivity insights
- `2-Areas/[Domain]/` - Domain-specific knowledge

### → Complete (Q4 - Done)

**Signals:**
- Task appears already completed
- Superseded by other work
- No longer relevant but was valid

**Output format:**
```
✅ **Complete** → Mark done in Todoist
Reason: [Why it's done]
```

### → Delete (Q4 - Eliminate)

**Signals:**
- Stale (old with no activity)
- Vague with no clear action
- Duplicate of another task
- Was never actionable

**Output format:**
```
🗑️ **Delete**
Reason: [Why to delete]
```

### → Consolidate

**Signals:**
- Multiple tasks about same topic
- Parent task with sub-tasks
- Related tasks that should be merged

**Output format:**
```
🔗 **Consolidate** with Task #[N]
Combined action: [Merged next step]
```

## Input Format

Each task should include:

```
## Task: [Title]

**Project**: [Project name]
**Due**: [Date or "None"]
**Labels**: [Labels]
**Description**:
> [Full description]

**Comments** (if any):
> [Date] Comment text
```

## Output Format

For each task:

```
### [Task Number]. [Task Title]

**Eisenhower**: Q[1-4]
**Action**: [Notion/Quick/Clarify/Obsidian/Complete/Delete]

[Action-specific output per templates above]

---
```

## Processing Workflow

1. **Load tasks** from Todoist (filtered to user's tasks)
2. **For each task**, classify using rules above
3. **Generate output** with action and next step
4. **Present to Michael** for review/commentary
5. **Execute** based on approved actions

## API Reference

### Fetch Tasks
```bash
curl -s "https://api.todoist.com/rest/v2/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN"
```

### Fetch Comments
```bash
curl -s "https://api.todoist.com/rest/v2/comments?task_id={ID}" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN"
```

### User ID for Filtering
Michael's Todoist user ID: `486423`

Filter: `assignee_id == null OR assignee_id == "486423"`

## Related

- **PARA Index**: `~/.dotfiles/claude-plugins/productivity/skills/para-index/`
- **Triage Agent**: `~/.dotfiles/claude-plugins/productivity/agents/todoist-triage-classifier.md`
- **Fixtures**: `~/.dotfiles/claude-plugins/productivity/skills/todoist-triage/fixtures/`

---
name: Linear Workflow
description: Use when creating or managing Linear issues, documenting implementation work, attaching session context to tasks, or working with the Linear API. Auto-loads when user mentions "Linear issue", "create an issue", "document this for later", or when you need to track work across sessions.
---

# Linear Workflow & Session Context Attachment

Guide for working with Linear issues and preserving session context.

## When This Skill Activates
- Creating or updating Linear issues
- Documenting work for future sessions
- User says "create a Linear issue" or "document this for later"
- Attaching session transcripts to issues
- Working with the Linear MCP tools

## Active Projects

**System Improvements** (`4bed35a1-a73d-43ac-9df5-fde8fde51185`)
- Infrastructure and system-level improvements to Claude Code workflows, hooks, and automation
- Team: Everything AI

## When to Create Linear Issues vs Implement Directly

**Create a Linear issue when:**
- Work requires multiple sessions or is being deferred
- Complex architectural decisions need documentation
- Implementation requires research phase first
- User explicitly asks to "document this for later"
- Part of larger initiative that needs tracking

**Implement directly when:**
- Quick fixes or small changes
- Clear requirements, no ambiguity
- Can complete in current session
- User wants it done now

## Creating Issues with Full Context

### Pattern for Detailed Issues

1. **Title**: Clear, actionable (e.g., "Re-enable SessionEnd hook with safety fixes")

2. **Description structure**:
   ```markdown
   ### Context
   [Why this work is needed, what problem it solves]

   ### Problem Analysis
   [Root cause, what went wrong, key insights]

   ### Solution
   [High-level approach]

   ### Implementation Details
   [Step-by-step instructions with file paths, line numbers, exact changes]

   ### Success Criteria
   [Checklist of what "done" looks like]
   ```

3. **Labels**: Tag appropriately (enhancement, infrastructure, ux, bug, etc.)

4. **Attach session transcript** (see below)

### Attaching Session Context

**Why attach transcripts:**
- Preserves full conversation context
- Documents decision-making process
- Enables better handoff between sessions
- Creates audit trail for complex work

**How to attach:**

1. Get current session file:
   ```bash
   /session-id
   ```

2. Create private GitHub gist:
   ```bash
   gh gist create --desc "Session: [brief description]" [session-file-path]
   ```

3. Update Linear issue with gist link:
   ```bash
   # Use Linear MCP tool
   mcp__linear-server__update_issue --id [issue-id] --links '[{"url": "gist-url", "title": "Session transcript"}]'
   ```

**Example workflow:**
```bash
# 1. Get session info
/session-id
# Output: Session ID: 7a345479-721a-4316-a947-4f55864ec7e1
#         File: ~/.claude/projects/-Users-michael/7a345479-721a-4316-a947-4f55864ec7e1.jsonl

# 2. Create gist
gh gist create --desc "Session: SessionEnd improvements" ~/.claude/projects/-Users-michael/7a345479-721a-4316-a947-4f55864ec7e1.jsonl
# Output: https://gist.github.com/mshuffett/c1ccebb6b36259d21b86a2ca8fd131f1

# 3. Attach to Linear issue (via MCP tool in conversation)
```

## Session Transcript Locations

- Current project sessions: `~/.claude/projects/-Users-michael/*.jsonl`
- Each session has UUID filename (e.g., `7a345479-721a-4316-a947-4f55864ec7e1.jsonl`)
- Gists are private by default with `gh gist create`

## Quick Reference

**List issues in project:**
```
mcp__linear-server__list_issues --project "System Improvements"
```

**Get issue details:**
```
mcp__linear-server__get_issue --id [issue-id]
```

**Update issue:**
```
mcp__linear-server__update_issue --id [issue-id] --description "..." --links [...]
```

**Available labels:** enhancement, infrastructure, ux, bug, documentation, research-needed

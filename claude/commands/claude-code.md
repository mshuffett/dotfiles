---
description: Use when asked about Claude Code features/capabilities; consult official docs and reference session storage.
---

# Claude Code Features & Documentation

When asked about Claude Code capabilities, features, or how Claude Code works:
- Always check the official docs: https://docs.claude.com/en/docs/claude-code/
- Start with the docs map: https://docs.claude.com/en/docs/claude-code/claude_code_docs_map.md
- Don't rely on memory — fetch the current documentation.

## When to Use (Triggers)
- You are asked about Claude Code features, capabilities, or how it works

## Acceptance Checks
- [ ] Official docs consulted (link above)
- [ ] Answers aligned with current documentation

Session storage:
- Sessions are stored in `~/.claude/projects/[project-path]/[session-uuid].jsonl`.
- Each project directory contains multiple session files.
- Session files are in JSONL format with conversation history.
- Current session can be identified by most recent modification time.

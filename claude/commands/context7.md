---
description: Use Context7 MCP tools to fetch up‑to‑date third‑party library docs; never rely on memory. Includes example workflow.
---

# Context7 Library Documentation Workflow

CRITICAL: Always use Context7 for third‑party library documentation instead of relying on memory.

When working with any third‑party library:
1. Use Context7 first — Search for the library using the `resolve-library-id` tool.
2. Fetch docs — Use `get-library-docs` with the exact ID and optional topic.
3. Implement using the current documentation and examples.

## When to Use (Triggers)
- You need to use or answer questions about a third‑party library

## Acceptance Checks
- [ ] `resolve-library-id` run for the library name
- [ ] `get-library-docs` fetched for the exact ID (optionally with topic)
- [ ] Implementation/answer aligned to current docs

Why this matters:
- Libraries update frequently with breaking changes.
- Training data may be outdated.
- Context7 provides accurate, current documentation.
- Reduces bugs from using deprecated or incorrect APIs.

Example workflow:
```
User: "Add authentication with Supabase"
1. resolve-library-id("supabase")
2. get-library-docs(context7CompatibleLibraryID="/supabase/supabase", topic="authentication")
3. Implement using the current documentation
```

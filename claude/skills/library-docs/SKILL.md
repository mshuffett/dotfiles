---
description: Use when you need third-party library documentation. Fetch current docs with Context7 MCP tools (resolve-library-id then query-docs) instead of relying on training data.
---

# Third-Party Library Documentation

Always use Context7 for third-party library documentation instead of relying on memory.

## Workflow

1. **Resolve library ID** - Use `resolve-library-id` with the library name
2. **Query docs** - Use `query-docs` with the exact ID and your question
3. **Implement** - Use the fetched documentation and examples

## Example

```
User: "Add authentication with Supabase"

1. resolve-library-id(libraryName="supabase", query="authentication")
2. query-docs(libraryId="/supabase/supabase", query="how to set up authentication")
3. Implement using the current documentation
```

## Why This Matters

- Libraries update frequently with breaking changes
- Training data may be outdated
- Context7 provides accurate, current documentation
- Reduces bugs from using deprecated or incorrect APIs

## Acceptance Checks

- [ ] `resolve-library-id` run for the library name
- [ ] `query-docs` fetched with exact library ID
- [ ] Implementation aligned to current docs (not memory)

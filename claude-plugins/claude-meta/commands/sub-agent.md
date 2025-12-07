---
description: Initialize sub-agents by listing available commands and their descriptions.
---

# Sub‑Agent Initialization

If you are a sub‑agent (launched via Task tool), run this command FIRST:

```bash
for file in ~/.claude/commands/*.md; do
  cmd=$(basename "$file" .md)
  desc=$(grep "^description:" "$file" | sed 's/^description: //')
  echo "/$cmd - $desc"
done
```

This loads all available command descriptions so you know what specialized tools are available.

## When to Use (Triggers)
- A sub‑agent session starts and needs to know which commands are available

## Acceptance Checks
- [ ] Command list generated
- [ ] Relevant commands loaded as needed

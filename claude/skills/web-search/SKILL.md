---
description: Use when researching topics via web search. Runs Claude WebSearch, Codex, and Gemini in parallel for comprehensive results.
---

# Web Search (Multi-Source)

Run three search sources in parallel to get broader, more comprehensive results than any single provider.

## Sources

| Source | How | Strengths |
|--------|-----|-----------|
| **Claude WebSearch** | Built-in `WebSearch` tool | Fast, integrated, returns structured results with links |
| **Codex CLI** | `codex exec` with web-grounded prompt | OpenAI reasoning + web access, good for technical/code topics |
| **Gemini CLI** | `gemini -p` with grounded prompt | Google Search grounding, strong for recent/current events |

## Execution

Run all three in parallel. Use the Bash tool for Codex and Gemini, and the WebSearch tool for Claude's built-in search.

### Claude WebSearch
Use the `WebSearch` tool directly with the query.

### Codex (non-interactive)
```bash
codex exec "Search the web and provide a comprehensive answer with sources for: <QUERY>" 2>/dev/null
```

### Gemini (non-interactive, text output)
```bash
gemini -p "Search the web and provide a comprehensive answer with sources for: <QUERY>" -o text 2>/dev/null
```

## Synthesis

After all three return:
1. **Deduplicate** - Merge overlapping findings
2. **Cross-validate** - Flag information confirmed by multiple sources
3. **Fill gaps** - Note unique findings from each source
4. **Cite sources** - Include URLs from all providers in a unified Sources section
5. **Present** - Deliver a single synthesized answer, noting where sources agree/disagree

## Output Format

```markdown
## <Topic>

<Synthesized answer combining all sources>

### Sources
- [Title](URL) — via Claude/Codex/Gemini
- ...
```

## Acceptance Checks

- [ ] All three sources queried in parallel
- [ ] Results synthesized into a single coherent answer
- [ ] Sources section includes URLs from all providers that returned results
- [ ] Conflicting information noted where applicable

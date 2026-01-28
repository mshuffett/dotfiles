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
| **Gemini CLI** | `gemini -p` with grounded prompt | Google Search grounding, strong for recent/current events. Highest performing model in benchmarks. |

## Execution

Run all three in parallel using `run_in_background: true` for Codex and Gemini Bash calls. Use the WebSearch tool directly for Claude's built-in search.

### Claude WebSearch
Use the `WebSearch` tool directly with the query.

### Codex (non-interactive, background)
```bash
codex exec --skip-git-repo-check "Search the web and provide a comprehensive answer with sources for: <QUERY>" 2>&1
```
- Always pass `--skip-git-repo-check` since we may not be in a git repo.
- Run with `run_in_background: true` and `timeout: 120000`.

### Gemini (non-interactive, background)
```bash
gemini -p "Search the web and provide a comprehensive answer with sources for: <QUERY>" -o text 2>&1
```
- Run with `run_in_background: true` and `timeout: 120000`.
- If the default model errors, retry with `-m gemini-3-flash-preview`.

## Error Handling

- **Codex "not inside trusted directory"**: Always use `--skip-git-repo-check`.
- **Gemini errors**: Retry with `-m gemini-3-flash-preview`.
- **Any source fails**: Synthesize from whatever sources returned results. Note which sources were unavailable.

## Synthesis

After all sources return (check background tasks with `TaskOutput`):
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

- [ ] All three sources queried in parallel (background mode for CLI tools)
- [ ] Results synthesized into a single coherent answer
- [ ] Sources section includes URLs from all providers that returned results
- [ ] Failed sources noted; fallback models attempted where applicable
- [ ] Conflicting information noted where applicable

# Notion — run page, originals, synthesis

All reports go into the **Deep Research** database (created for this skill):

- Database URL: `https://www.notion.so/5be6df0a68524efca7252edabb209fcc`
- Data source (use this as the parent for the run row): `collection://79196d34-3458-44de-ab90-87cb8d7fb9c1`

**Schema (properties):**

| Property | Type | Value |
|----------|------|-------|
| `Name` | title | Short descriptive title of the run |
| `Status` | select | `Running` → `Done` (or `Partial` / `Failed`) |
| `Providers` | multi-select | any of `claude`, `chatgpt`, `gemini` |
| `Query` | text | the exact research prompt sent |
| `Claude URL` | url | the claude.ai conversation URL |
| `ChatGPT URL` | url | the chatgpt.com conversation URL |
| `Gemini URL` | url | the gemini.google.com conversation URL |
| `Created` | created_time | auto |

## Page layout (one run = one page + child originals)

```
[Run page]  (row in the DB)
├─ properties: Name, Status, Providers, Query, per-provider URLs
├─ body: ## Synthesis  (the cross-provider synthesis + unified ## Sources)
└─ child pages:
   ├─ "Claude — original"   (full Claude report, with citations)
   ├─ "ChatGPT — original"  (full ChatGPT report, with citations)
   └─ "Gemini — original"   (full Gemini report, with citations)
```

Keeping originals as **child pages** keeps the run page readable (synthesis first) while
preserving every full report verbatim, exactly as the user asked.

## Steps (with `mcp__claude_ai_Notion__*`)

1. **Create the run page** at launch — `notion-create-pages` with
   `parent = collection://79196d34-3458-44de-ab90-87cb8d7fb9c1`, properties
   `{ Name, Query, Providers, Status: "Running" }`. Keep the returned page ID/URL.
2. **As each provider finishes**, create a child original — `notion-create-pages` with
   `parent = <run page ID>`, title `"<Provider> — original"`, and the full report Markdown as
   content. Set the matching `<Provider> URL` property on the run page (`notion-update-page`).
3. **Write the synthesis** into the run page body (`notion-update-page`, append blocks): a
   `## Synthesis` section then `## Sources`. Lead with cross-provider agreement (high
   confidence), call out disagreements, and include unique findings.
4. **Finalize** — set `Status = Done` (or `Partial` if a provider failed), via
   `notion-update-page`.

## Notes

- **Multi-select (`Providers`) must be a JSON array string**, e.g. `"[\"claude\",\"chatgpt\",\"gemini\"]"`.
  A comma-separated string is rejected (Notion treats it as one invalid option).
- Notion's create-pages accepts Notion-flavored Markdown; long reports are fine as page content.
  If a single report is very large, split into multiple content blocks/child pages rather than
  truncating — never drop content.
- If the Notion connector isn't available, fall back to saving each report as a timestamped
  `.md` file under a local folder and tell the user the paths, then still produce the synthesis.

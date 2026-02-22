# PKM / Second Brain Skill Research

**Date:** 2026-02-21
**Todoist:** Task `6g4F43rJ3VX2jQX3` in Setup Backlog

## Top Pick: `sean-esk/second-brain-gtd@second-brain`

- **Installs:** 35 | **Version:** 4.1 | **Repo:** github.com/sean-esk/second-brain-gtd
- **Install:** `npx skills add sean-esk/second-brain-gtd@second-brain -g -y`
- Combines GTD + Zettelkasten + PARA in Obsidian
- Natural language triggers: "capture this", "plan my day", "process my inbox", "daily closeout"
- Daily loop: Capture → Process (3x/week) → Plan (morning) → Closeout (evening), ~20-25 min/day
- ADHD-friendly: targeted edits, read-before-write, no bloat
- Config persists in Claude Memory; creates user context note with goals
- Well-structured: 5 workflow guides, 9 templates, 5 reference docs
- Works with existing vaults

### Open questions before installing
- How does it fit alongside Todoist (task mgmt) and Notion (knowledge capture)?
- Would Obsidian become the knowledge layer while Todoist stays for tasks?
- Claude Memory collision risk with existing memory entries?

## Runner-Up: `lanej/dotfiles@pkm`

- **Installs:** 13 | Semantic search + BM25 hybrid over docs via LanceDB
- Quality filtering (certainty, freshness), relationship mapping, knowledge audits
- MCP server + LSP server + CLI
- More of a search/retrieval layer than a workflow system
- Could complement existing docs rather than replace anything

## Other Candidates Evaluated

| Skill | Installs | Notes |
|---|---|---|
| `desplega-ai/ai-toolbox@brain-expert` | 12 | `brain` CLI, daily notes, OpenAI embeddings search, SQLite |
| `treylom/knowledge-manager@zettelkasten-note-creation` | 15 | Pure Zettelkasten templates/methodology, no automation |
| `julianobarbosa/claude-code-skills@obsidian` | 25 | Obsidian dev reference (plugin dev, REST API), not a workflow |
| `groeimetai/snow-flow@knowledge-management` | 25 | ServiceNow KB — not personal PKM |

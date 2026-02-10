---
name: idea-capture
description: Use when user shares a raw idea ("I have an idea...", "What if we...", "I'm thinking about..."). Captures verbatim to Obsidian, scans for related notes, generates Obsidian URL, commits to git.
---

# Raw Ideas Quick Capture

## Capture Protocol

**CRITICAL RULES:**
1. **NEVER ask clarifying questions** - just capture verbatim
2. **NEVER process or refine** - raw capture only
3. **ALWAYS scan for related ideas** - link to existing content
4. **ALWAYS return Obsidian URL** - user needs the link
5. **ALWAYS commit and push** - preserve in git

## Steps

### 1. Create Note

**Location**: `~/ws/everything-monorepo/notes/3-Resources/Raw Ideas/`
**Filename**: `YYYY-MM-DD-brief-title.md` (lowercase, hyphens, 3-5 word slug)

### 2. Template

```markdown
---
captured: YYYY-MM-DD
type: raw-idea
status: unprocessed
tags:
  - relevant-tag1
  - relevant-tag2
---

# [Idea Title]

## Raw Idea (captured verbatim)

[User's exact words - do not paraphrase or refine]

## Related Ideas & Context

- [[related-note-1]] - Brief description
- [[related-note-2]] - Brief description
```

### 3. Scan for Related Ideas

Search patterns: keywords from the idea, related concepts, similar features.

**Common search areas:**
- `2-Areas/Everything Backlog/` - Product ideas
- `2-Areas/Everything AI Strategy/` - Strategic ideas
- `1-Projects/` - Active project connections
- `3-Resources/Raw Ideas/` - Other raw ideas

### 4. Generate Obsidian URL

**Format**: `obsidian://open?vault=notes&file=3-Resources%2FRaw%20Ideas%2FFILENAME.md`

Return as: `[YYYY-MM-DD-brief-title](obsidian://...)`

### 5. Commit and Push

```bash
cd ~/ws/everything-monorepo/notes
git add "3-Resources/Raw Ideas/YYYY-MM-DD-filename.md"
git commit -m "Add raw idea: [brief description]"
git push
```

## Acceptance Checks

- [ ] Note created with proper filename format
- [ ] User's idea captured verbatim (no paraphrasing)
- [ ] Related ideas searched and linked with wikilinks
- [ ] Obsidian URL generated and returned
- [ ] Changes committed and pushed to git
- [ ] No clarifying questions asked during capture

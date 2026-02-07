---
description: Use when user shares a raw idea (e.g., "I have a new idea...", "What if we...", "I'm thinking about..."). Captures verbatim without clarifying questions, scans for related notes, generates Obsidian URL.
---

# Raw Ideas Quick Capture

## When to Use This Skill

**Trigger phrases that indicate a raw idea:**
- "I have a new idea..."
- "What if we..."
- "I'm thinking about..."
- "Here's an idea..."
- Any casual idea sharing without request for immediate action

**DO NOT use for:**
- Formal feature requests (those go to project planning)
- Immediate tasks (those go to Todoist)
- Questions or discussions (respond normally)

## Capture Protocol

**CRITICAL RULES:**
1. **NEVER ask clarifying questions** - just capture verbatim
2. **NEVER process or refine** - raw capture only
3. **ALWAYS scan for related ideas** - link to existing content
4. **ALWAYS send Obsidian URL** - user needs the link

### Step-by-Step Process

#### 1. Create Note File

**Location**: `~/ws/everything-monorepo/notes/3-Resources/Raw Ideas/`

**Filename format**: `YYYY-MM-DD-brief-title.md`
- Use current date
- Brief descriptive slug (3-5 words max)
- Lowercase with hyphens
- Example: `2025-10-01-agent-marketplace-pricing.md`

#### 2. Use Template Structure

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

## Potential Components (optional)

[If the idea naturally has obvious components, you can note them briefly]

---
*Captured by Claude - No processing done yet*
```

#### 3. Scan for Related Ideas

**Search patterns to try:**
- Keywords from the idea (grep across notes)
- Related concepts or domains
- Similar features or workflows
- Strategic areas (Everything AI, Executive Eve, etc.)

**Link format**: Use wikilinks `[[Note Title]]` with brief context

**Common related areas:**
- `2-Areas/Everything Backlog/` - Product ideas
- `2-Areas/Everything AI Strategy/` - Strategic ideas
- `1-Projects/` - Active project connections
- Other raw ideas in `3-Resources/Raw Ideas/`

#### 4. Generate Obsidian URL

**Format**: `obsidian://open?vault=notes&file=ENCODED_PATH`

**Vault name**: `notes`

**Path encoding**:
- Start from vault root: `3-Resources/Raw Ideas/FILENAME.md`
- URL encode spaces as `%20`
- URL encode other special characters

**Return format**: `[YYYY-MM-DD-brief-title](obsidian://...)`

#### 5. Commit and Push to Git

**IMPORTANT**: Ideas must be committed to preserve them in git history.

```bash
cd ~/ws/everything-monorepo/notes
git add "3-Resources/Raw Ideas/YYYY-MM-DD-filename.md"
git commit -m "Add raw idea: [brief description]"
git push
```

**Commit message format**:
- "Add raw idea: [brief description of the idea]"
- Keep it concise (one line)
- Example: "Add raw idea: autonomous agent queue for implementing ideas"

### What Happens Later

**Processing happens during reviews - NOT at capture time:**
- Weekly reviews process inbox ideas
- Ideas mature into specs or plans
- Some ideas get moved to projects
- Some stay as reference thoughts

## Examples

### Example 1: Quick Idea

**User**: "I have a new idea - what if we had automated investor matching based on our pitch"

**Action**:
1. Create `2025-10-01-automated-investor-matching.md`
2. Capture exact quote in "Raw Idea" section
3. Search for related: fundraise, investor, automation notes
4. Link to related ideas in Fundraise project
5. Generate Obsidian URL
6. Commit and push to git

**Response**: "Idea captured! [2025-10-01-automated-investor-matching](obsidian://...)"

### Example 2: Complex Idea with Components

**User**: "Here's something I'm thinking about - a workflow that goes from idea to spec to plan to review"

**Action**:
1. Create `2025-10-01-fleshed-out-ideas-workflow.md`
2. Capture exact quote
3. Note obvious components: idea -> spec -> plan -> review
4. Search for workflow, planning, review related notes
5. Link to existing workflows (Todoist, Document Review)
6. Generate Obsidian URL
7. Commit and push to git

**Response**: "Idea captured! [2025-10-01-fleshed-out-ideas-workflow](obsidian://...)"

## Acceptance Checks

- [ ] Note created in correct location with proper filename format
- [ ] User's idea captured verbatim (no paraphrasing)
- [ ] Related ideas searched and linked with wikilinks
- [ ] Obsidian URL generated and returned to user
- [ ] Changes committed and pushed to git
- [ ] No clarifying questions asked during capture

## Template Location

**Full template**: `~/ws/everything-monorepo/notes/Templates/Raw Idea Template.md`

Use this template as reference for frontmatter structure.

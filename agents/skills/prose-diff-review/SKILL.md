---
name: prose-diff-review
description: >-
  Use when comparing two versions of a document (original vs revised), creating
  diff review pages, or when the user asks to "show me what changed", "create a
  diff", "review the changes", or "compare versions". Works with cover letters,
  essays, reports, emails, or any prose. Generates an interactive HTML diff
  review page with inline diffs, side-by-side view, sidebar commentary, user
  annotation support, and JSON export. Also use when the user wants a change
  report explaining what was modified and why.
---

# Prose Diff Review

Generate interactive HTML diff review pages for comparing two versions of any prose document, with editorial commentary explaining each change.

## When to Use

- Comparing an original document to a revised version
- Creating a visual diff for prose (not code — use git diff for code)
- The user asks "show me what changed" or "create a diff view"
- After an iterative writing improvement process (pairs well with `writing-iteration-loop`)
- When the user wants a change report with rationale

## Workflow

### 1. Identify the two versions

You need an **original** and a **final** (or any two versions). These might be:
- Two files the user provides
- The first and last version from an iteration loop
- A before/after from an editing session

### 2. Produce a sentence-level diff

Compare the two versions sentence by sentence. For each change, identify:
- **What changed**: the exact words added, removed, or restructured
- **Why it changed**: the editorial rationale (grammar rule, clarity, strategic addition, source alignment, etc.)
- **Category**: tag each change (e.g., "Strunk Rule 13", "Position Document", "Clarity", "Concision", "Tone")

Write this as a markdown file (`diff-view.md`) for reference:

```
ORIGINAL: [sentence]
FINAL:    [sentence]
CHANGED:  [rationale]
---
ADDED: [new sentence]
WHY:   [rationale]
---
REMOVED: [sentence]
WHY:     [rationale]
```

### 3. Generate the HTML diff review page

**A complete working template is at `references/diff-review-template.html`.** Read it and adapt it for the current document — replace the content (paragraphs, del/ins markup, comment cards, sidebar, stats) while keeping the full CSS, JS, annotation system, and view toggle intact. This is much faster than building from scratch.

The template includes all of the following features:

#### Views (toggle in top bar)
- **Inline Diff**: Single-column document with `<del>` (red strikethrough) for removed text and `<ins>` (green highlight) for added text, Google Docs style. Numbered comment markers in the text link to sidebar cards.
- **Side by Side**: Two-column layout — original (left) with red highlights on removed text, final (right) with green highlights on added text. Commentary sidebar on the right.

#### Sidebar Commentary
- Each significant change gets a numbered comment card in the sidebar
- Cards include: change title, category tags (color-coded), and explanation
- Clicking a card scrolls to the corresponding text; clicking a marker scrolls to the card
- Tag types: rule-based (amber), source-based (green), skill-based (indigo)

#### User Annotations
- Users can select text and add their own comments (stored in localStorage)
- Users can reply to existing system comments
- Annotation count badge in the top bar
- "Export" button downloads all annotations (system comments + user notes + replies) as JSON

#### Structure

```
Top Bar: [Title] [Subtitle] [View Toggle] [Annotation Count] [Export] [Stats]

Inline View:
  [Document with <del>/<ins> + markers] | [Sidebar: comment cards]

Side-by-Side View:
  [Original col] [Final col] | [Sidebar: comment cards]

Footer:
  [Strategic Additions table — what was added from source documents]
```

### 4. Write a change report (optional)

If the user wants a written report (`change-report.md`), structure it as:

```markdown
# Change Report: [Document] v1 → Final

## Overview
[Brief summary of the revision process and philosophy]

## What Changed and Why
### [Section Name]
| Change | Why |
|---|---|
| "original text" → "final text" | [rationale with rule/source citations] |

## Strategic Additions
| Element | How Addressed | Source |
|---|---|---|

## What Was Preserved
- [List of things deliberately kept unchanged]

## Revision History
| Version | Key Changes |
|---|---|
```

## HTML Template Patterns

### Inline diff markup
```html
<del>removed text</del><ins>added text</ins>
```
- `<del>`: red background (#fce8e6), red text (#c5221f), line-through
- `<ins>`: green background (#e6f4ea), green text (#137333), no underline

### Comment markers
```html
<span class="comment-anchor">
  <span class="comment-marker" data-comment="1">1</span>
</span>
```

### Comment cards
```html
<div class="comment-card" data-comment="1">
  <div class="card-header"><span class="card-num">1</span> Title</div>
  <span class="tag tag-strunk">Rule 13</span> Explanation text.
</div>
```

### Tag categories
- `.tag-strunk` (amber): Grammar/style rules
- `.tag-source` (green): Source document alignment
- `.tag-skill` (indigo): Skill-specific guidance

## Reference Files

| File | Description | When to Read |
|------|-------------|--------------|
| `references/diff-review-template.html` | Complete working HTML template (~700 lines) with all CSS, JS, views, annotations, and export | Always — adapt this for each new review page |

## Design Principles

- Clean, Google Docs-inspired aesthetic (white background, system fonts for UI, serif for document text)
- Sticky top bar with controls
- Responsive layout — sidebar collapses on narrow screens
- User annotations persist in localStorage
- Export produces LLM-friendly JSON with full context (system comments, user notes, highlighted text, positions)
- All DOM manipulation uses safe methods (textContent, createElement) — no raw innerHTML with user input
- Side-by-side view hides `<ins>` in original column and `<del>` in final column via CSS (`display: none`)
- View toggle must set `display: 'block'` (not `''`) to override CSS `display: none` on the hidden view

---
description: Decide where information belongs (root vs guide vs repo docs) and how to escalate repeated mistakes. Includes placement tree, escalation ladder, and command creation guidelines.
---

# Memory Placement & Commands System

Quick reference for remembering things across Claude Code and Codex sessions.

## Core Decision Workflow (Placement)

### Where Should This Go?

**Ask yourself**: "Do I need this most of the time when assisting, or might I make a mistake without it?"

- **YES** → Put it in **CLAUDE.md** (or user-level `~/.claude/CLAUDE.md` if it applies to ALL projects)
- **NO** → Create a **command/prompt** with a description that triggers checking it

### Writing Triggering Descriptions

**The description field determines when you'll check this command.**

**Good pattern**: `"[Action] when [specific triggering condition]"`

**Examples that work**:
- `"Reference when you want to remember something across sessions"` ← This file
- `"Consult when stumped on hard problems or need extended reasoning"` ← /codex
- `"Deploy to production or development environments"` ← /deploy
- `"Reference for Linear task management workflows"` ← /linear-workflow

**Test**: Would you naturally think to check this command in that situation? If no, rewrite the description.

### Consultation Rule (Mandatory for procedures)
- Whenever a trigger condition applies (e.g., pre‑worktree, creating a PR, checking ports), you MUST consult the matching on‑demand guide/command and pass its acceptance checks before proceeding. If a suitable guide exists and is not consulted, log `guide.not_consulted` and stop.

## Memory Structure

**User-level** (`~/.claude/CLAUDE.md`):
- Personal preferences across ALL projects
- Symlinked at `~/.codex/AGENTS.md` for Codex

**Project-level** (`./CLAUDE.md`):
- Team-shared conventions (git-tracked)
- Symlinked at `./AGENTS.md` for Codex

## Commands Structure

**User-level**:
- `~/.claude/commands/*.md` - Claude Code commands
- `~/.codex/prompts/*.md` - Codex prompts (symlinked when identical)

**Project-level**:
- `.claude/commands/*.md` - Project-specific commands

**Symlinking Commands/Prompts**:
When a command and prompt are identical (like this file), symlink instead of copying:
```bash
ln -s ~/.claude/commands/name.md ~/.codex/prompts/name.md
```

## Creating Commands/Guides

### Command Format (Claude Code)

```yaml
---
description: [Action] when [triggering condition]
argument-hint: <what args this expects>
allowed-tools: Bash(pattern:*)  # Required for bash execution
model: haiku|sonnet|opus        # Optional: override default
---

# Command Body

Clear explanation of what this does and when to use it.

## Execution

Bash commands use `!` prefix:
!`your-command "$ARGUMENTS"`
```

### CRITICAL: Registering Commands

**After creating a new command file, you MUST add it to the appropriate CLAUDE.md file.**

Commands are consulted via the **Read tool + file paths** approach. You must explicitly reference them in CLAUDE.md.

**For global commands** (`~/.claude/commands/*.md`):
1. Create the command file in `~/.claude/commands/`
2. Add to `~/.claude/CLAUDE.md` in the "CRITICAL: Read Procedure Files When Topics Apply" section
3. Use this format:
   ```markdown
   - **[Topic]** → Read `~/.claude/commands/filename.md` when [triggering condition]
   ```

**For project commands** (`.claude/commands/*.md`):
1. Create the command file in `.claude/commands/`
2. Add to project `CLAUDE.md` or `AGENTS.md` with explicit Read instructions
3. Use this format:
   ```markdown
   - **[Topic]** → Read `.claude/commands/filename.md` when [triggering condition]
   ```

**Example registration:**
```markdown
**Tools & Infrastructure:**
- **Managing database migrations** → Read `~/.claude/commands/database-migrations.md` when creating or running database migrations
```

**Why this is required:**
- Commands are NOT automatically discovered by their descriptions
- The CLAUDE.md topic mappings tell you when to Read the command file
- Without registration, the command file will never be consulted

### Prompt Format (Codex)

```yaml
---
description: [Action] when [triggering condition]
argument-hint: <what args this expects>
---

# Prompt Body

Pure text that gets sent to GPT-5.
Use $ARGUMENTS or $1, $2 for placeholders.
No bash execution - just text expansion.
```

## CLAUDE.md Editing Workflow

### Before ANY Edit to CLAUDE.md

**CRITICAL**: Follow this checklist every time you edit CLAUDE.md

### Pre-Edit Checklist

**Placement Decision:**
- [ ] **Read memory-guide.md** - Confirmed this belongs in CLAUDE.md
- [ ] **Answer: "Do I need this MOST OF THE TIME or might I make a mistake without it?"**
  - YES → Belongs in CLAUDE.md
  - NO → Create a procedure file instead
- [ ] **If it has trigger conditions** → Should probably be a procedure file
- [ ] **If it's step-by-step workflow** → Definitely should be a procedure file

**Content Quality:**
- [ ] **Is it specific?** ("Use 2-space indentation" > "Format code properly")
- [ ] **Is it actionable?** Can you act on this information?
- [ ] **Is it timeless?** Will this still be true in 6 months?
- [ ] **Is it concise?** No unnecessary words or examples
- [ ] **Does it duplicate existing content?** Check before adding

**Organization:**
- [ ] **Right section?** Placed under appropriate heading
- [ ] **Follows existing structure?** Matches surrounding format
- [ ] **Creates clutter?** Would a new heading help organize it?
- [ ] **Cross-references clear?** Links to procedure files if needed

**Size Check:**
- [ ] **Current file size acceptable?** (Run `wc -c CLAUDE.md`)
  - Project CLAUDE.md: ~30-40k chars is reasonable
  - Global CLAUDE.md: ~15-20k chars is reasonable
  - If approaching limits, consider extracting to procedure files

### CLAUDE.md Size Targets

**No official limits**, but practical guidelines:

**Project CLAUDE.md** (`<project>/CLAUDE.md`):
- **Watch at**: 40,000 chars
- **Refactor at**: 50,000 chars

**Global CLAUDE.md** (`~/.claude/CLAUDE.md`):
- **Watch at**: 20,000 chars
- **Refactor at**: 25,000 chars

**Combined Context**: Aim for <15k tokens (<10% of 200k context window)

### Editing Steps

1. **Determine Placement**: Ask "Do I need this most of the time?"
   - YES → Continue to step 2
   - NO → Create procedure file instead

2. **Check Current Size**: `wc -c CLAUDE.md ~/.claude/CLAUDE.md`
   - If approaching watch thresholds, consider refactoring first

3. **Find Right Section**:
   - Core principles → Top sections
   - Development rules → Middle sections
   - Project-specific → Later sections
   - Future work → Near end

4. **Make the Edit**:
   - Keep it concise and specific
   - Use bullet points for lists
   - Use headings to organize
   - Add cross-references to procedure files when relevant

5. **Verify Changes**:
   - Re-read the edited section
   - Check that it doesn't duplicate existing content
   - Ensure cross-references work
   - Run pre-commit checks if applicable

6. **Commit with Context**:
   ```bash
   git add CLAUDE.md
   git commit -m "docs: [type] - brief description"
   ```
   Commit types: `add`, `update`, `refactor`, `remove`

### When to Create Procedure File Instead

**Signs this should be a procedure file, not CLAUDE.md:**
- ✅ Has clear trigger conditions ("when doing X...")
- ✅ Step-by-step workflow or checklist
- ✅ Only needed in specific situations
- ✅ Contains detailed examples or templates
- ✅ Longer than 10-15 lines
- ✅ Domain-specific (API patterns, testing, deployment)

### Refactoring CLAUDE.md

When CLAUDE.md hits watch thresholds or feels cluttered:

**Step 1: Identify Candidates for Extraction**
- Sections with clear trigger conditions
- Step-by-step procedures
- Rarely needed in all interactions
- Could stand alone as procedure files

**Step 2: Create Procedure Files**
1. Create `.claude/commands/[topic].md`
2. Include: Purpose, Triggers, Workflow, Checklist, Examples
3. Follow format from existing procedure files

**Step 3: Update CLAUDE.md**
- Brief one-line summary
- Clear trigger condition
- Reference to procedure file: "Read `.claude/commands/[topic].md` when [trigger]"

**Step 4: Update Trigger List**
Add to "CRITICAL: Read Procedure Files When Topics Apply" section

**Step 5: Test and Commit**
- Verify triggers work
- Check that nothing was lost
- Commit both CLAUDE.md and new procedure files together

### Periodic Review Schedule

**Monthly** (or after significant changes):
- Review CLAUDE.md for outdated content
- Check if any sections should become procedure files
- Verify cross-references still work
- Check file size

**Quarterly**:
- Full audit of CLAUDE.md organization
- Consider refactoring if approaching size limits
- Review all procedure files for consistency

### Common Mistakes to Avoid

❌ **Adding step-by-step procedures** → Use procedure files
❌ **Including examples in CLAUDE.md** → Put in procedure files
❌ **Duplicating information** → Reference existing content
❌ **Vague statements** → Be specific and actionable
❌ **Not checking memory-guide.md** → Always check placement first
❌ **Adding without reviewing context** → Read surrounding content
❌ **Forgetting to update trigger lists** → Update when adding procedures

## Writing Workflow

### To Remember a Fact or Pattern

1. **Ask**: Do I need this most of the time or might I make a mistake?
   - **YES** → Add to CLAUDE.md
   - **NO** → Continue to step 2

2. **Ask**: Can I describe a specific situation when I'd need this?
   - **YES** → Create a command with that situation as the description
   - **NO** → It might not need to be remembered, or reconsider step 1

3. **Ask**: Does this apply to ALL projects or just this one?
   - **ALL projects** → User-level (`~/.claude/CLAUDE.md` or `~/.claude/commands/`)
   - **This project** → Project-level (`./CLAUDE.md` or `.claude/commands/`)

### To Create a Procedural Workflow

**Before creating a NEW procedure file, check if it belongs in an EXISTING one.**

#### Decision Tree

**Question 1**: "Is this about the same topic as an existing procedure file?"

List existing files:
```bash
ls -lh ~/.claude/commands/       # Global procedures
ls -lh .claude/commands/          # Project procedures
```

Common topics:
- API patterns, authentication → `api-patterns.md`
- Testing, test failures → `testing-patterns.md`
- UI components, animations, themes → `ui-patterns.md`
- Git worktrees → `worktrees.md`
- Deployment → `deploy.md`

**If YES** (same topic):
- **Update the existing file** - Add new section or expand content
- Keep related knowledge together

**If NO** (different topic):
- Continue to Question 2

**Question 2**: "Does this apply to ALL projects or just this one?"

**ALL projects** → Create global file at `~/.claude/commands/[topic].md`
- Examples: Git workflows, deployment patterns, testing strategies

**This project only** → Create project file at `<project>/.claude/commands/[topic].md`
- Examples: This project's build system, specific API patterns

**Question 3**: "Does this overlap with multiple existing files?"

If uncertain whether to combine or separate:
- **Ask the user** - Present arguments for each approach
- Don't assume the separation is obvious

#### When to Update Existing Files

✅ **Update existing file when:**
- Adding a new pattern to an established category
- Expanding on existing guidance
- Fixing outdated information
- Adding examples to existing procedures
- Clarifying ambiguous instructions

❌ **Don't create new file when:**
- Content fits naturally in existing file
- Topic is already covered (even if not comprehensively)
- New info is a refinement, not a new domain

#### When to Create New Files

✅ **Create new file when:**
- Entirely new topic not covered by any existing file
- Content substantial enough (>50 lines) to stand alone
- Clear trigger condition distinct from existing files
- Would make existing file too long (>300 lines)
- Belongs to different category/domain

#### After Creating/Updating Procedure Files

**CRITICAL**: Always update the trigger list in CLAUDE.md

**For global files** (`~/.claude/commands/`):
1. Edit `~/.claude/CLAUDE.md`
2. Add to "CRITICAL: Read Procedure Files When Topics Apply" section
3. Format: `- **[Topic]** → Read ~/.claude/commands/[file].md when [trigger]`

**For project files** (`<project>/.claude/commands/`):
1. Edit `<project>/CLAUDE.md`
2. Add to "CRITICAL: Read Procedure Files When Topics Apply" section
3. Format: `- **[Topic]** → Read <project>/.claude/commands/[file].md when [trigger]`

#### Memory Decision Report Format

When documenting placement decisions, use this format:

```
## MEMORY DECISION: [filename]

**Decision Path**
1. Always-on? [YES/NO] ([reason]) → [result]
2. Existing file? Checked [filename] ([difference]) → [new/update]
3. Scope? [ALL/THIS] projects → [path]

**Proposed Trigger**
"[Topic]" → Read [path] when [condition]"

**Red Team (False Negatives)**
✓ "[synonym 1]" → [how it's covered]
✓ "[synonym 2]" → [how it's covered]
🔴 "[missed case]" → [issue description]
   Fix: [proposed solution]

**Checklist**
✅ All items followed: [brief summary]
```

## Checklist: Before Saving a Command/Guide

Use this checklist when creating or updating commands:

### Discoverability
- [ ] **Does the description trigger me to check this?** Would I naturally think of this command when I need it?
- [ ] **Is the description specific enough?** Does it include the situation/condition that triggers using it?
- [ ] **Does the description avoid being vague?** ("Helper", "Tool", "Utility" are too vague)
- [ ] **Can I test it?** Ask: "If I were in situation X, would this description make me check this command?"

### Red-Teaming
- [ ] **When might I need this but NOT think to check it?** Are there edge cases where the description won't trigger?
- [ ] **What similar situations might confuse me?** Could I mistakenly use this when I shouldn't?
- [ ] **Why might this memory throw me off?** Are there cases where following this advice would be wrong?
- [ ] **What are the failure modes?** When does this command's advice not apply?
- [ ] **Is there a better place for this?** Should this be in CLAUDE.md instead because I'll need it most of the time?
- [ ] **Does this work for both Claude Code and Codex?** If symlinked, does the content make sense for both systems without confusion?

### Technical
- [ ] **Is the location correct?** User-level for all projects, project-level for this project only
- [ ] **Does the body explain WHEN to use it?** Not just what it does, but when you'd need it
- [ ] **If using bash: Is `allowed-tools` declared?** Required for commands that execute bash
- [ ] **Does it avoid duplicating memory content?** Commands should reference rules by name, not copy them

## Key Principles

- **Memory is always loaded** - Commands apply filters to it
- **Descriptions are discovery** - They tell you when to use the command
- **Be specific**: "Deploy when ready for production" > "Deployment helper"
- **Think like a trigger**: What situation would make you want this information?

## Description Style (Read‑Trigger)

Descriptions should only trigger opening the guide — never summarize steps.

Rules:
- Lead with the trigger: "Before …", "When …", or "Always read this whenever …".
- Say "read this first/now" or use the minimal imperative (e.g., "Never stash …") that forces opening.
- No steps, no acceptance checks, no links, no outcomes; keep ≤120 chars.
- Avoid implying you can proceed without reading. The body holds all details.

Patterns:
- Before <action> — read this first.
- When asked to <task> — read this immediately.
- Always read this whenever <topic>.
- Never <risky action> without reading this.

Examples (approved style):
- Worktrees: "Always read this whenever working with git worktrees"
- PR: "When asked to create a PR, read this immediately so you know what steps to take along the way."
- Ports: "Before killing a process, read this first."
- Git‑safety: "Never stash a git file without reading this."

## Listing Current Descriptions

You can list all command descriptions to audit style and consistency:

```bash
~/.dotfiles/claude/scripts/list-command-descriptions.sh
```

Use this output as live examples to keep new descriptions consistent.

## Escalation Ladder (Mistakes)
- 0) Improve or create the relevant guide first (clear triggers, acceptance checks, quick path)
- 1) First recurrence → strengthen guide and add anti‑miss cues (e.g., “Before X, always do Y”)
- 2) Second recurrence in same repo (≤14 days) → add a one‑line Hot Rule to that repo’s agent file
- 3) Cross‑repo recurrence (≥2 repos in ≤14 days) → add a one‑line universal guardrail to root CLAUDE
- 4) Cooldown after 14–30 quiet days → propose removing one‑liners; guide remains canonical

## Argument Syntax

Both systems use identical placeholders:
- `$ARGUMENTS` - All arguments joined
- `$1`, `$2`, ... `$9` - Positional arguments
- `$NAME` or `NAME=value` - Named arguments

## Quick Memory Addition

### Using Claude Code
- `#` shortcut: Start message with `#` to add to memory
- `/memory` command: Opens memory file in editor

### Direct Editing
- Edit `CLAUDE.md` or `AGENTS.md` (same file via symlink)

## Quick Commands

```bash
# Check size of CLAUDE.md files
wc -c CLAUDE.md ~/.claude/CLAUDE.md
wc -l CLAUDE.md ~/.claude/CLAUDE.md

# View memory guide placement decision
cat ~/.claude/commands/memory-guide.md | grep -A 20 "Core Decision"

# List all procedure files
ls -lh .claude/commands/
ls -lh ~/.claude/commands/

# Search CLAUDE.md for duplicates
grep -n "keyword" CLAUDE.md
```

## Viewing Current Memory Structure

To see all your memory and command files:

**User-level files**:
```bash
# Memory
ls -lh ~/.claude/CLAUDE.md
ls -la ~/.codex/AGENTS.md

# Commands/Prompts
ls ~/.claude/commands/
ls -la ~/.codex/prompts/
```

**Project-level files**:
```bash
# Memory
ls -lh ./CLAUDE.md ./AGENTS.md

# Commands
ls ./.claude/commands/
```

Or ask: "Can you tell me all the memory and command files we have?"

---

**Meta-note**: This command's description ("Reference when you want to remember something") should trigger you whenever you're thinking about remembering information across sessions.

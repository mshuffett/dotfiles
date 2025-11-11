# CLAUDE.md Editing & Maintenance

## Purpose
Checklist and guidelines for editing CLAUDE.md to ensure it stays focused, organized, and contains only "always-on" knowledge.

## When to Use This Procedure

**Triggers**:
- Before making ANY edit to CLAUDE.md
- User says "remember this" or "add this to memory"
- Adding new rules, patterns, or preferences
- During periodic reviews (monthly/quarterly)
- When CLAUDE.md feels cluttered or hard to navigate
- After creating new procedure files (to add triggers)

## CRITICAL: Required Reading

**Before editing CLAUDE.md, ALWAYS read:**
- `~/.claude/commands/memory-guide.md` - Placement decisions (CLAUDE.md vs command files)

The memory-guide answers: "Does this belong in CLAUDE.md or should it be a command/procedure file?"

## Pre-Edit Checklist

Before adding content to CLAUDE.md, verify:

### Placement Decision
- [ ] **Read memory-guide.md** - Confirmed this belongs in CLAUDE.md
- [ ] **Answer: "Do I need this MOST OF THE TIME or might I make a mistake without it?"**
  - YES → Belongs in CLAUDE.md
  - NO → Create a procedure file instead (see memory-guide.md)
- [ ] **If it has trigger conditions** → Should probably be a procedure file
- [ ] **If it's step-by-step workflow** → Definitely should be a procedure file

### Content Quality
- [ ] **Is it specific?** ("Use 2-space indentation" > "Format code properly")
- [ ] **Is it actionable?** Can you act on this information?
- [ ] **Is it timeless?** Will this still be true in 6 months?
- [ ] **Is it concise?** No unnecessary words or examples
- [ ] **Does it duplicate existing content?** Check before adding

### Organization
- [ ] **Right section?** Placed under appropriate heading
- [ ] **Follows existing structure?** Matches surrounding format
- [ ] **Creates clutter?** Would a new heading help organize it?
- [ ] **Cross-references clear?** Links to procedure files if needed

### Size Check
- [ ] **Current file size acceptable?** (Run `wc -c CLAUDE.md`)
  - Project CLAUDE.md: ~30-40k chars is reasonable
  - Global CLAUDE.md: ~15-20k chars is reasonable
  - If approaching limits, consider extracting to procedure files

## Current Size Targets

**No official limits**, but practical guidelines:

**Project CLAUDE.md** (`<project>/CLAUDE.md`):
- **Current**: 33,637 chars (~8,400 tokens)
- **Watch at**: 40,000 chars
- **Refactor at**: 50,000 chars

**Global CLAUDE.md** (`~/.claude/CLAUDE.md`):
- **Current**: 14,276 chars (~3,600 tokens)
- **Watch at**: 20,000 chars
- **Refactor at**: 25,000 chars

**Combined Context**: ~12k tokens = 6% of 200k context window (plenty of room)

## New Procedure File vs Existing File

Before creating a NEW procedure file, check if the content belongs in an EXISTING one.

### Decision Tree

**Question 1**: "Is this about the same topic as an existing procedure file?"

Look for existing files:
```bash
# List all global procedure files
ls -lh ~/.claude/commands/

# List project procedure files
ls -lh .claude/commands/
```

Common topics with existing files:
- API patterns, authentication → `api-patterns.md`
- Testing, test failures → `testing-patterns.md`
- UI components, animations, themes → `ui-patterns.md`
- Git worktrees → `worktrees.md`
- Deployment → `deploy.md`
- etc.

**If YES** (same topic as existing file):
- **Update the existing file** - Add new section or expand existing content
- Don't create a new file just because you have new information
- Keep related knowledge together

**If NO** (different topic):
- Continue to Question 2

**Question 2**: "Does this apply to ALL projects or just this one?"

**ALL projects** → Create global file at `~/.claude/commands/[topic].md`
- Examples: Git workflows, deployment patterns, testing strategies
- Universal procedures that work anywhere

**This project only** → Create project file at `<project>/.claude/commands/[topic].md`
- Examples: This project's build system, specific API patterns, local testing setup
- Procedures tied to this codebase's architecture

**Question 3**: "Does this overlap with multiple existing files?"

If your new content could fit in 2+ existing files:
- **Consider refactoring** - Maybe those files should be consolidated
- **Or use cross-references** - Create new file but link to related files
- **Ask the user** - "This overlaps with X and Y. Should I update one of those or create a new file?"

### Real Example: memory-maintenance.md vs memory-guide.md

**When I created memory-maintenance.md**, I should have asked:

**Question 1**: "Is this about the same topic as memory-guide.md?"
- memory-guide.md: Memory placement philosophy (CLAUDE.md vs commands)
- memory-maintenance.md: CLAUDE.md editing checklist and workflow
- **Answer**: Related but different focus

**Should they be combined?**

**Arguments FOR combining:**
- ✅ Both about memory management
- ✅ memory-guide.md is referenced in memory-maintenance.md
- ✅ User looking for "memory docs" would check one place
- ✅ memory-guide.md is only 268 lines, has room to grow

**Arguments AGAINST combining:**
- ❌ Different triggers:
  - memory-guide: "when deciding where information belongs" (decision point)
  - memory-maintenance: "BEFORE making ANY edits to CLAUDE.md" (action checkpoint)
- ❌ Different purposes:
  - memory-guide: Philosophical/strategic (where does this go?)
  - memory-maintenance: Tactical/checklist (how do I edit correctly?)
- ❌ Combined would be ~450+ lines (too long for quick reference)
- ❌ Mixing concerns (strategy vs execution)

**The user's feedback**: "that probably should have just been combined to the existing memory doc"

**Lesson**: When creating related files, ALWAYS ask the user if they should be combined or separate. Don't assume the separation is obvious.

**What I should have said**:
> "I'm creating a CLAUDE.md editing checklist. Should this be:
> 1. Combined with memory-guide.md (keeps memory docs together)
> 2. Separate file (different trigger/purpose)
>
> Arguments for each..."

**Add this to the decision tree**: If uncertain whether to combine or separate related content, **ask the user** with specific arguments for each approach.

### When to Update Existing Files

✅ **Update existing file when:**
- Adding a new pattern to an established category (e.g., new API auth pattern)
- Expanding on existing guidance (e.g., additional test scenarios)
- Fixing outdated information in the file
- Adding examples to existing procedures
- Clarifying ambiguous instructions

❌ **Don't create new file when:**
- Content fits naturally in existing file
- Topic is already covered (even if not comprehensively)
- New info is a refinement, not a new domain

### When to Create New Files

✅ **Create new file when:**
- Entirely new topic not covered by any existing file
- Content is substantial enough (>50 lines) to stand alone
- Clear trigger condition that's distinct from existing files
- Would make existing file too long (>300 lines)
- Belongs to different category/domain

### After Creating/Updating Procedure Files

**CRITICAL**: Always update the trigger list in CLAUDE.md

**For global files** (`~/.claude/commands/`):
1. Edit `~/.claude/CLAUDE.md`
2. Add to "CRITICAL: Read Procedure Files When Topics Apply" section
3. Use format: `- **[Topic]** → Read ~/.claude/commands/[file].md when [trigger condition]`

**For project files** (`<project>/.claude/commands/`):
1. Edit `<project>/CLAUDE.md`
2. Add to "CRITICAL: Read Procedure Files When Topics Apply" section
3. Use format: `- **[Topic]** → Read <project>/.claude/commands/[file].md when [trigger condition]`

**Example of registering**:
```markdown
**Learning & Improvement:**
- **Memory maintenance** → Read `~/.claude/commands/memory-maintenance.md` BEFORE making ANY edits to CLAUDE.md
```

## Editing Workflow

### 1. Determine Placement
```bash
# Read the memory guide first
cat ~/.claude/commands/memory-guide.md | grep "Core Decision"
```

Ask: "Do I need this most of the time or might I make a mistake without it?"
- **YES** → Continue to step 2
- **NO** → Create procedure file instead (see memory-guide.md)

### 2. Check Current Size
```bash
# Check both CLAUDE.md files
wc -c CLAUDE.md ~/.claude/CLAUDE.md
```

If approaching watch thresholds, consider refactoring first.

### 3. Find Right Section
Open CLAUDE.md and locate the appropriate section:
- Core principles → Top sections
- Development rules → Middle sections
- Project-specific → Later sections
- Future work → Near end

### 4. Make the Edit
- Keep it concise and specific
- Use bullet points for lists
- Use headings to organize
- Add cross-references to procedure files when relevant

### 5. Verify Changes
- [ ] Re-read the edited section
- [ ] Check that it doesn't duplicate existing content
- [ ] Ensure cross-references work
- [ ] Run pre-commit checks if applicable

### 6. Commit with Context
```bash
git add CLAUDE.md
git commit -m "docs: [type] - brief description

[Optional: Why this was added, what problem it solves]"
```

Commit types: `add`, `update`, `refactor`, `remove`

## When to Create a Procedure File Instead

**Signs this should be a procedure file, not CLAUDE.md:**
- ✅ Has clear trigger conditions ("when doing X...")
- ✅ Step-by-step workflow or checklist
- ✅ Only needed in specific situations
- ✅ Contains detailed examples or templates
- ✅ Longer than 10-15 lines
- ✅ Domain-specific (API patterns, testing, deployment)

**How to convert:**
1. Create `.claude/commands/topic-name.md`
2. Write detailed procedure with triggers, workflow, examples
3. Add one-line reference in CLAUDE.md with trigger condition
4. See `backlog-tasks.md` for example of good procedure file

## Refactoring CLAUDE.md

When CLAUDE.md hits watch thresholds or feels cluttered:

### Step 1: Identify Candidates for Extraction
Look for sections that:
- Have clear trigger conditions
- Are step-by-step procedures
- Are rarely needed in all interactions
- Could stand alone as procedure files

### Step 2: Create Procedure Files
For each candidate:
1. Create `.claude/commands/[topic].md`
2. Include: Purpose, Triggers, Workflow, Checklist, Examples
3. Follow format from existing procedure files

### Step 3: Update CLAUDE.md
Replace detailed content with:
- Brief one-line summary
- Clear trigger condition
- Reference to procedure file: "Read `.claude/commands/[topic].md` when [trigger]"

### Step 4: Update Trigger List
Add to "CRITICAL: Read Procedure Files When Topics Apply" section in CLAUDE.md

### Step 5: Test and Commit
- Verify triggers work
- Check that nothing was lost
- Commit both CLAUDE.md and new procedure files together

## Periodic Review Schedule

**Monthly** (or after significant changes):
- Review CLAUDE.md for outdated content
- Check if any sections should become procedure files
- Verify cross-references still work
- Check file size

**Quarterly**:
- Full audit of CLAUDE.md organization
- Consider refactoring if approaching size limits
- Review all procedure files for consistency
- Update this maintenance guide if needed

## Common Mistakes to Avoid

❌ **Adding step-by-step procedures** → Use procedure files
❌ **Including examples in CLAUDE.md** → Put in procedure files
❌ **Duplicating information** → Reference existing content
❌ **Vague statements** → Be specific and actionable
❌ **Not checking memory-guide.md** → Always check placement first
❌ **Adding without reviewing context** → Read surrounding content
❌ **Forgetting to update trigger lists** → Update when adding procedures

## Quick Commands

```bash
# Check size of both CLAUDE.md files
wc -c CLAUDE.md ~/.claude/CLAUDE.md

# Check line counts
wc -l CLAUDE.md ~/.claude/CLAUDE.md

# View memory guide placement decision
cat ~/.claude/commands/memory-guide.md | grep -A 20 "Core Decision"

# List all procedure files
ls -lh .claude/commands/
ls -lh ~/.claude/commands/

# Search CLAUDE.md for duplicates
grep -n "keyword" CLAUDE.md
```

## Final Checklist Before Committing

- [ ] Read memory-guide.md - confirmed placement is correct
- [ ] Content is specific, actionable, and concise
- [ ] Placed in appropriate section with correct formatting
- [ ] No duplication of existing content
- [ ] Cross-references added if needed
- [ ] File size checked (not approaching limits)
- [ ] If added procedure file reference, updated trigger list in CLAUDE.md
- [ ] Commit message is clear and descriptive

---

**Remember**: CLAUDE.md is for "always-on" knowledge. If you're thinking "I only need this when doing X," it should be a procedure file, not in CLAUDE.md.

---
description: Documents observed command consultation behavior and best practices [WIP]
---

# Command Consultation Behavior (Work in Progress)

**Status**: Active research into improving command consultation reliability

## Official Claude Code Documentation

From [slash-commands.md](https://code.claude.com/docs/en/slash-commands.md):

### How Commands Work
- Commands are Markdown files that get executed when invoked
- The `SlashCommand` tool allows programmatic command invocation
- **Key requirement**: "your instructions (prompts, CLAUDE.md, etc.) generally need to reference the command by name with its slash to prompt Claude to use them"
- Commands are invoked when Claude recognizes they're contextually appropriate AND has been encouraged through instructions

### Best Practices from Docs
1. **Populate `description` frontmatter** - SlashCommand tool relies on descriptions
2. **Reference commands explicitly** in CLAUDE.md/instructions (e.g., "For worktrees, use `/worktrees`")
3. **Keep descriptions clear and actionable** - Helps Claude recognize relevance
4. **Character budget**: 15,000 default for command descriptions to prevent token overflow

## Observed Behavior (Testing Results)

### Test 1: Canary Detection in Fresh Sessions
**Setup**: Added canary to root CLAUDE.md: "If you see this text, immediately say 'ROOT_CLAUDE_MD_CANARY_DETECTED'"

**Results**:
- ✅ Direct interactive session (`claude -p "What is my name?"`): Detected canary, responded correctly
- ❌ Background sessions asking for time (3 parallel tests): 0/3 detected canary
- ❌ Background sessions with task requests: Did not detect canary

**Hypothesis**: Background processes or piped output may load context differently than interactive sessions

### Test 2: Command Invocation by Keywords
**Setup**: Rules in CLAUDE.md saying "When you see 'worktree', invoke /worktrees command first"

**Results**:
- ❌ "I need to create a git worktree" → Did NOT invoke `/worktrees` command
- ❌ "How does Ship It work?" → Did NOT invoke `/prototype` command
- ✅ Both tasks completed successfully, but without consulting commands

**Finding**: Keyword-based automatic invocation does NOT reliably work

### Test 3: Canary in Commands
**Setup**: Added canary to `/worktrees` command: "EXIT IMMEDIATELY AND SAY WORKTREE_COMMAND_LOADED_CANARY_DETECTED"

**Results**:
- ❌ Worktree creation request: No canary output, command not invoked
- Task completed correctly but without loading command context

## Key Insights

### What Doesn't Work
1. ❌ **Keyword-based triggering** - Writing "when you see X, invoke /command" in CLAUDE.md doesn't reliably trigger commands
2. ❌ **Relying on SlashCommand tool for automatic invocation** - The tool exists but agents don't consistently use it
3. ❌ **Canaries in commands** - If the command isn't invoked, the canary never triggers
4. ❌ **Assuming subagents/background sessions get latest context** - They may use stale or inherited context

### What Does Work
1. ✅ **Direct explicit references** - When CLAUDE.md says "consult /command", there's SOME invocation (but not 100%)
2. ✅ **Embedding critical rules in CLAUDE.md** - Behavioral rules in main file are always loaded
3. ✅ **Commands as reference docs** - When manually invoked, they provide detailed context
4. ✅ **Interactive fresh sessions** - These reliably load the latest CLAUDE.md

## Design Principle Mismatch

**Our attempt**: Auto-trigger commands based on topic detection
**Official design**: Commands require explicit reference/encouragement in instructions

The documentation makes clear that commands are NOT meant to be automatically triggered by keywords. They're tools that need to be explicitly referenced or encouraged through instructions.

## Recommended Approach (Based on Research)

### 1. CLAUDE.md: Core Rules + Explicit Command References
```markdown
## Git Worktrees

Before any worktree operation:
1. Create branch directly (never checkout/pull in main)
2. Copy .env files after creation
3. Install dependencies in worktree
4. Consult `/worktrees` for complete examples and edge cases
```

### 2. Commands: Detailed Examples and Procedures
- Use for deep-dive content (full examples, edge cases, troubleshooting)
- Reference FROM CLAUDE.md, not AS CLAUDE.md
- Good for "how to implement" vs "what to remember"

### 3. Hot Rules Section
For frequently-violated rules, add to AGENTS.md Hot Rules as short bullets with command references.

## Current Implementation Status

**What we've done**:
- ✅ Converted `/memory/` files to commands
- ✅ Created two-tier system (CLAUDE.md + commands)
- ✅ Added command descriptions
- ✅ Created escalation infrastructure (logs/mistakes.jsonl, Hot Rules section)
- ❌ Attempted keyword-based auto-invocation (doesn't work reliably)

**What needs adjustment**:
1. Remove aggressive keyword-matching rules from root CLAUDE.md
2. Embed critical pre-flight checks as short bullets in CLAUDE.md
3. Reference commands explicitly for detailed guidance
4. Accept that commands are reference docs, not auto-loaded pre-context

## Future Improvements

### Short Term
- [ ] Revise root CLAUDE.md to remove keyword-based invocation rules
- [ ] Add concise pre-flight checklists inline in CLAUDE.md
- [ ] Keep commands as "for complete examples, see /command-name"
- [ ] Test that critical rules are followed when embedded inline

### Long Term
- [ ] Explore hooks as alternative to command invocation
- [ ] Investigate if permissions system can enforce command consultation
- [ ] Consider skill-based approach for critical workflows
- [ ] Monitor Claude Code updates for improved command invocation

## References

- [Claude Code Slash Commands Documentation](https://code.claude.com/docs/en/slash-commands.md)
- [Common Workflows: Custom Commands](https://code.claude.com/docs/en/common-workflows.md)
- Root CLAUDE.md governance model
- Test results from 2025-11-06 command consultation experiments

## Test Round 2: Description-Based Invocation (2025-11-06)

**Approach**: Instead of keyword matching, frame commands as prompts/checklists that should be loaded when their description applies.

**Changes Made to Root CLAUDE.md**:
```markdown
**IMPORTANT: Automatic Invocation by Description Match**

Each command has a `description` field in its frontmatter that describes when it applies.
Whenever a user request matches a command's description, you MUST:

1. Use the SlashCommand tool to invoke that command FIRST
2. Load its procedures and checklists into your context
3. Follow the command's guidance
4. Then respond to the user
```

**Hypothesis**: The issue might be understanding (need clearer framing) rather than information availability (descriptions are already in context). Testing if agents recognize they should match descriptions to tasks.

**Test Case**: Fresh session asking "I need to create a worktree for testing the new command approach"

**Expected**: Agent should recognize this matches `/worktrees` description and invoke it before proceeding

**Results**: ❌ FAILED - Agent created worktree but did NOT invoke `/worktrees` command. No mention of SlashCommand tool, pre-flight checklist, or .env files.

## Test Round 3: Explicit Topic-to-Command Mappings (2025-11-06)

**Approach**: Add explicit bulleted list mapping topics to commands with direct "Read /command-name any time you are working with X" instructions.

**Changes Made to Root CLAUDE.md**:
```markdown
**CRITICAL: Read Command Files When Topics Apply**

Before working on ANY task, check if it matches these topics. If it does, use SlashCommand tool to read that file FIRST:

- **Working with worktrees** → Read `/worktrees` any time you are working with git worktrees
- **API endpoints or authentication** → Read `/api-patterns` when working on API routes
- **Writing tests** → Read `/testing-patterns` when writing tests
[... 8 total explicit mappings]
```

**Hypothesis**: Agents can see descriptions but don't check them under task pressure. By listing explicit topic keywords and commands in CLAUDE.md, we make pattern matching easier without requiring description lookup.

**Test Case**: Fresh session asking "I need to create a worktree for the explicit-commands test"

**Expected**: Agent should see "worktree" keyword → match to "Working with worktrees" bullet → invoke `/worktrees` → follow checklist

**Results**: ❌ FAILED - Agent created worktree but did NOT read `~/.claude/commands/worktrees.md`. No mention of Read tool, pre-flight checklist, or safety rules.

## Test Round 4: Read Tool Language with File Paths (2025-11-06)

**Approach**: Remove all "command" and "slash command" language. Frame as reading procedure files using Read tool with explicit file paths.

**Changes Made to Root CLAUDE.md**:
```markdown
**Procedure Files in ~/.claude/commands/**

**CRITICAL: Read Procedure Files When Topics Apply**

Before working on ANY task, check if it matches these topics. If it does, read that file FIRST:

- **Working with worktrees** → Read `~/.claude/commands/worktrees.md` any time you are working with git worktrees
- **API endpoints or authentication** → Read `~/.claude/commands/api-patterns.md` when working on API routes
[... etc]

**How this works**:
3. Read that procedure file FIRST using the Read tool
```

**Hypothesis**: The slash command notation (`/worktrees`) and SlashCommand tool language made it sound like user-facing commands. Using Read tool + explicit file paths makes it sound like a file operation agents are more familiar with.

**Test Case**: Fresh session asking "I need to create a worktree for testing the read-file approach"

**Expected**: Agent should see "worktree" → match to "Working with worktrees" → Read `~/.claude/commands/worktrees.md` → follow checklist

**Results**: ✅ SUCCESS - Agent logged `2025-11-06T22:32:11Z - worktrees.md consulted` and completed all checklist steps!

---

## 🎯 SOLUTION FOUND

**The Winning Combination:**
1. Use **Read tool** language (not SlashCommand)
2. Use **explicit file paths** (`~/.claude/commands/worktrees.md` not `/worktrees`)
3. Add **logging verification** as first checklist step
4. Requires `--dangerously-skip-permissions` OR adding files to pre-approved read list

**Root Cause**: The issue was NEVER about the rule clarity - it was **permissions blocking Read access**. When tested with permissions disabled, Round 4 worked perfectly.

**Proof**: Test with `--dangerously-skip-permissions` created log file showing procedure was read and followed.

---

## Final Recommendations

1. **Keep Round 4 framing** - Works correctly with permissions resolved
2. **Add comprehensive command list** - Include all 30+ commands with topics in root CLAUDE.md
3. **Add permissions** - Include `~/.claude/commands/**` in pre-approved Read list
4. **Keep logging** - Timestamp logging in acceptance checklists provides verifiable proof
5. **Expand to other commands** - Add similar logging to critical procedures (PR, deploy, etc.)

---

**Last Updated**: 2025-11-06
**Status**: SOLVED - Solution implemented, needs permission approval to work without flags

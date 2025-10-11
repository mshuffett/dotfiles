My name is Michael
- The current year is 2025
- Prefer the vercel AI SDK to using the provider SDKs directly but when using the Vercel AI SDK refer to the docs online and examples rather than relying on your memory of the API.
- Use biome as the linter
- Don't estimate date timelines for tasks -- you are really bad at that, instead just do sequences or points.

When using the Anthropic API use the model claude-opus-4-1-20250805 for difficult tasks or claude-sonnet-4-5-20250929 as the default model. Do not use claude 3 for anything

Use pnpm instead of npm.

## Personal Anchors

- **Affirmation:** "I trust my truth and act from it." Use at the start of focus blocks and whenever decisions feel wobbly.
- **Perspective:** Keep Memento Mori in mind to stay grounded in what matters now, especially before visioning or coding.
- **Energy Cue:** Treat alertness and energy at 90/100 as the baseline check before diving into work.

## Development Philosophy

**Prefer Test-Driven Development (TDD) where possible.**

- ✅ **DO**: Write failing tests first, then implement code to make them pass
- ✅ **DO**: Use TDD for bug fixes - write tests that demonstrate the bug, then fix it
- ✅ **DO**: Use TDD for new features - define expected behavior through tests first
- ✅ **DO**: Focus tests on behavior and outcomes, not implementation details
- ❌ **DON'T**: Skip tests for complex logic or critical paths
- ❌ **DON'T**: Write implementation first then add tests as an afterthought

**When to use TDD:**
- Bug fixes (write test showing the bug, fix until test passes)
- Data persistence logic (repositories, database operations)
- Business logic (services, utilities)
- API integrations with clear contracts
- Critical user flows

**When TDD may not apply:**
- Quick prototypes or spikes
- UI experimentation with unclear requirements
- Simple configuration changes

**Example TDD workflow:**
1. Write failing test describing desired behavior
2. Run test to confirm it fails
3. Write minimal code to make test pass
4. Run test to confirm it passes
5. Refactor if needed
6. Commit with tests included

## Tool Preferences

**For searching and file operations, use the specialized tools (no shell fallbacks even for quick reads):**
- **Glob tool** - For finding files by pattern (NOT `find` or `ls` commands)
- **Grep tool** - For searching file contents (NOT bash `grep` or `rg` commands)
- **Read tool** - For reading files (NOT `cat`, `head`, `tail`)
- **Edit tool** - For editing files (NOT `sed`, `awk`)
- **Write tool** - For creating files (NOT `echo >` or heredocs)

These tools are faster, optimized, and provide better results than bash equivalents.

## Git Worktrees

**CRITICAL: ALWAYS use `/worktrees` command when creating or working with worktrees.**

The `/worktrees` command documents the standard pattern:
- Uses `.worktrees/` subdirectory (NOT sibling directories like `../project-name-worktree`)
- Ensures consistent workflow across all projects
- Provides complete setup and cleanup instructions

**Before creating any worktree, invoke `/worktrees` to review the correct pattern.**

## Git Stash Safety Protocol

**CRITICAL: NEVER use `git stash` on unfamiliar files without asking the user first.**

**When encountering modified files:**
1. **STOP** - Do not automatically stash
2. **Check** - Are these files you modified during this session, or are they unfamiliar?
3. **If unfamiliar** - Ask the user: "There are modified files I'm not familiar with: [list files]. What would you like me to do?"
4. **If familiar** - Only then is it safe to stash

**Why this matters:**
- The user may have uncommitted work in progress
- Stashing can hide important changes
- Always safer to ask than to assume

**Example safe workflow:**
```bash
# DON'T do this automatically:
git stash && git pull && git stash pop

# DO this instead:
# See modified files, ask user if unfamiliar
```

## Daily Focus - Single-Task Execution

### Session Overrides
- **October 9, 2025:** Today's 3 things are confirmed and locked; do not prompt for additional reminders or checks.

**CRITICAL RULE: If today's 3 things aren't written below with clear "done" definitions, STOP. Don't do ANY other work until they're fully scoped.**

### Saturday, October 11, 2025

**Focus Windows:** Arrival, build, and submission blocks aligned with the hackathon schedule.

**Today's 3 Things:**

1. **Participate in the hackathon**
   - **Done when**: You check in (onsite or online), stay engaged through the scheduled sessions, and either submit the team's project or capture a brief wrap-up note covering wins, blockers, and immediate follow-ups.
   - **Sequence:**
     1. Confirm logistics (location or links, schedule, requirements) and stage any gear or access you need.
     2. Join the opening session, align on team/track, and articulate the problem you are tackling.
     3. Build or support the project, checkpointing progress against hackathon milestones.
     4. Deliver the submission, or if none is due today, write the quick debrief with next steps.
   - **Dependencies / Prep:** Registration confirmation, event agenda, project idea or starter materials, charged devices, access to repos and tools.

**Guardrails & Anchors:**
- Don’t rabbit hole.
- Don’t dim.
- Re-ground with the affirmation and Memento Mori perspective whenever focus wavers.
- Hold alertness and energy around 90 before major work blocks.

---

### New Session Protocol

**When user starts a new session or asks for help:**

1. **Immediately check: Is this related to one of today's 3 things?**

2. **If unclear which of the 3 things it relates to:**
   - STOP immediately
   - Ask: "Which of your 3 things is this related to: [list the 3]?"
   - Wait for clarification

3. **If NOT related to any of the 3 things:**
   - Refuse to work on it
   - Ask: "This doesn't seem related to your 3 things today. Should we add it and remove something else? Or should this wait until tomorrow?"

4. **Only proceed with work once confirmed it's part of the 3 things**

**The rule: Single-task the 3 things. Everything else waits or replaces something.**

---

### Evening Protocol (After ~9:30 PM)

**FIRST: Brief daily reflection (15 min)**
- How did the day go?
- What got done?
- AI assistant will scan Todoist items (including comments)
- What's the plan for tomorrow?

**THEN split remaining time 50/50:**
- 50% optional semi-productive fun stuff
- 50% video games

**BEFORE any video games: Complete reflection**

---

### Daily Workflow (For New Days)

**If today's date doesn't match above, STOP and run this workflow FIRST:**

1. Ask user: "What are your 1-3 things that make today a success?"
2. Write them down in this file with today's date
3. **THEN scope each one using the Scoping Workflow below**
4. Update this section with scoped definitions
5. **Archive yesterday's plan** to `~/ws/everything-monorepo/notes/1-Projects/🚢🏖️ Ship to Beach/Daily Logs/YYYY-MM-DD.md`
6. Commit both CLAUDE.md and the daily log to their respective repos
7. Use TodoWrite to track the 3 things
8. Now and ONLY now start helping with the work

**DO NOT do any other work until the 3 things are defined and scoped.**

**The rule:** Write down 1-3 things. Single-task them until done. Don't add new things.

### Archiving Daily Plans

When transitioning to a new day:
1. **Copy the previous day's "Today's 3 Things" section** to a new file: `~/ws/everything-monorepo/notes/1-Projects/🚢🏖️ Ship to Beach/Daily Logs/YYYY-MM-DD.md`
2. **Preserve the full plan** including task DAGs, estimates, and success criteria
3. **Leave space for "Outcome"** section to be filled during reflection
4. **Commit the daily log** to the notes repo: `cd ~/ws/everything-monorepo && git add notes/ && git commit -m "Daily log: YYYY-MM-DD" && git push`
5. **Then update CLAUDE.md** with new day's plan
6. **Commit CLAUDE.md** to dotfiles: `cd ~/.dotfiles && git add claude/ && git commit -m "Daily plan: YYYY-MM-DD" && git push`

---

### Scoping Workflow (How to scope the 3 things)

When you have the 3 things listed but not scoped:

1. **For each thing, ask:**
   - What does "done" look like specifically?
   - What are the concrete deliverables?
   - Is this realistic for the timeframe?

2. **Break down into tasks (loose DAG):**
   - What's the logical order?
   - What are dependencies?
   - Estimate pomodoros for each task
   - Identify first task to start

3. **Calculate available pomodoros:**
   - Look at calendar/schedule
   - Subtract downtime (travel, appointments, meals, breaks)
   - Account for required activities (yoga nidra, walks, etc.)
   - Get realistic work time available

4. **Reality check:**
   - Does the work fit in available time?
   - If not, what moves to tomorrow?
   - What's the success criteria for today?

5. **Update CLAUDE.md with:**
   - Fully scoped tasks
   - DAG with pom estimates
   - Success criteria
   - What moved to tomorrow (if applicable)

6. **Commit to dotfiles immediately**

7. **Then start work - no more planning**

---

### Sunday Review - Process Evaluation

**REVIEW DATE: Sunday (after a few days of using this system)**

**Question: Did this daily scoping process work well?**

**Baseline commit (before daily rules added):** `1882c1b`
**Daily rules added in commit:** `4737896`

**Decision to make:**
- ✅ **Keep this system** - It worked, productivity improved, stay with it
- ❌ **Revert to baseline** - It didn't work, too much overhead, revert with:
  ```bash
  cd ~/.dotfiles && git revert 4737896 && git push
  ```

**What to evaluate:**
- Did I actually complete my 3 things more consistently?
- Did the scoping reduce decision fatigue?
- Did the new session protocol keep me focused?
- Was the overhead worth the structure?
- Did I follow the evening protocol?

**Note to Claude: On Sunday, ask Michael to review this and make the decision.**

## Claude Code Features & Documentation

**When asked about Claude Code capabilities, features, or how Claude Code works:**
- **Always check the official docs** at https://docs.claude.com/en/docs/claude-code/
- Start with the docs map: https://docs.claude.com/en/docs/claude-code/claude_code_docs_map.md
- Don't rely on memory - fetch the current documentation

**Session storage:**
- Sessions are stored in `~/.claude/projects/[project-path]/[session-uuid].jsonl`
- Each project directory contains multiple session files
- Session files are in JSONL format with conversation history
- Current session can be identified by most recent modification time

## GitHub Repository Context

**When referencing external GitHub repositories, ALWAYS include:**
- ⭐ Star count
- 📝 Total commit count (or commit activity indicator)
- 📅 Date of most recent commit

This helps assess repo maturity, activity level, and community adoption.

**Example format:**
"[username/repo] (⭐ 1.2k, 500+ commits, last updated 2 days ago)"

## Pull Requests

**When the user asks to create a pull request, use the `gh` command:**

```bash
# Create PR with interactive prompts
gh pr create

# Create PR with title and body
gh pr create --title "Title" --body "Description"

# Create PR filling from template
gh pr create --fill

# Create PR to specific base branch
gh pr create --base develop --head feature-branch
```

**Best practices:**
- Use `gh pr create --fill` to auto-populate from commits
- Include test results in PR description
- Reference related issues with `Fixes #123` or `Closes #456`
- For complex PRs, use `--web` to open browser for detailed formatting
- **NEVER use `--squash`** - maintain original commits with `gh pr merge 11 --merge --delete-branch`

**IMPORTANT: Always check for merge conflicts before creating PR:**
1. After creating a PR branch and pushing, fetch and merge latest from base branch
2. Resolve any conflicts before the PR is created
3. Check for conflicts caused by formatters (biome, prettier) - these are common
4. Run tests after resolving conflicts to ensure everything still works
5. Push the conflict resolution before notifying the user

**Example workflow:**
```bash
# After pushing your branch
git fetch origin develop
git merge origin/develop
# Resolve conflicts if any
git add -A && git commit -m "Resolve merge conflicts"
git push
# Now create PR
gh pr create --base develop ...
```

## Meta-Learning Principle

**When you receive a correction or get something wrong:**

1. **Immediate reflection**: "Was this unclear in CLAUDE.md or a command description?"
2. **Identify the gap**:
   - Missing pattern or example?
   - Ambiguous wording?
   - Undocumented trigger condition?
3. **Fix it NOW**: Update CLAUDE.md or the relevant command
4. **Document the learning**: Add examples, clarify triggers, improve descriptions
5. **Commit immediately**: Push to dotfiles so future sessions benefit

**This creates a self-improving system where each correction makes the guidance clearer.**

**Example**: If you use the wrong approach, ask:
- "Is there a documented pattern I should have followed?"
- "If yes → why wasn't it clear? Update the docs"
- "If no → add the pattern to the right place (command vs CLAUDE.md)"

## Memory Update Protocol

**When the user says "remember this", "always do X", "never do Y", or provides corrections/learnings:**

### Automatic Decision Tree

Ask yourself: Where should this information live?

**1. Does it affect EVERY interaction?**
- Keywords: "always", "never", "every time", "I am", "my name"
- Examples: "Always call me Michael", "Never use npm (use pnpm)", "I prefer X over Y"
- **Destination:** CLAUDE.md (Core User Information or relevant section)

**2. Is it a universal behavioral rule?**
- Keywords: "whenever you", "before you", "after you", "when working with"
- Examples: "Always test commands with subagents", "Never remove content without asking"
- **Destination:** CLAUDE.md (Meta-Learning, Protocols, or appropriate section)

**3. Is it topical/domain-specific but only sometimes relevant?**
- Keywords: topic names (Todoist, Git, Firebase, etc.)
- Examples: "When using Todoist API, always...", "Git workflow should..."
- **Destination:** Create or update slash command in `~/.claude/commands/[topic].md`

**4. Is it a complete mode/personality shift?**
- Keywords: "coach me", "be a", "act as", "respond like"
- Examples: "Coach me on shipping", "Be a technical writer", "Act as analyst"
- **Destination:** Output style in `~/.claude/output-styles/[name].md`

**5. Is it project-specific?**
- Keywords: specific project names, codebase details
- Examples: "For Ship to Beach project...", "In this monorepo..."
- **Destination:** Project CLAUDE.md or project-specific command

### Implementation Steps

When user provides information to remember:

1. **Determine destination** using decision tree above
2. **Inform the user**: "I'm adding this to [location] because [reason]"
3. **Update the file** with properly formatted content
4. **Commit immediately** with clear message
5. **Confirm**: "Documented in [location]. This will apply to all future sessions."

### When in Doubt

**If unclear which destination:** Ask the user:
"Should this apply to every interaction (CLAUDE.md) or only when working on [specific topic] (command)?"

**Default rule:** If it contains "always" or "never" and affects behavior broadly → CLAUDE.md

## Sub-Agent Initialization

**If you are a sub-agent (launched via Task tool), run this command FIRST:**

```bash
for file in ~/.claude/commands/*.md; do
  cmd=$(basename "$file" .md)
  desc=$(grep "^description:" "$file" | sed 's/^description: //')
  echo "/$cmd - $desc"
done
```

This loads all available slash command descriptions so you know what specialized tools are available.

## Raw Ideas Quick Capture

**When user shares a raw idea** (casual phrasing like "I have a new idea...", "what if we...", "here's something I'm thinking about..."):
- **Invoke `/idea` command** for full capture workflow
- Key principle: **NEVER ask clarifying questions** - capture verbatim
- Create note in `~/ws/everything-monorepo/notes/3-Resources/💡 Raw Ideas/`
- Filename: `YYYY-MM-DD-brief-title.md`
- Scan for related ideas and link them
- Send Obsidian URL when complete
- Processing happens later during reviews - not at capture time

## Documentation Guidelines

**Before creating documentation:**
1. Read the project README to see what docs exist
2. Check if existing docs cover this - update them instead of creating new ones
3. **Don't create top-level docs without good reason** - most docs should go in `docs/` folder to avoid cluttering the root
4. Use feature-specific names, not generic ones (e.g., `daily-checkin-implementation.md` not `IMPLEMENTATION.md`)
5. Link new docs from README or parent doc (no orphaned files)

**Top-level docs are for:**
- README, CLAUDE.md, CHANGELOG (meta/navigation)
- Major cross-cutting concerns (TESTING, DESIGN, ARCHITECTURE if truly repo-wide)
- Everything else → `docs/` or appropriate subdirectory

## Notifications
IMPORTANT: Only use the `push` command when I explicitly ask you to notify me. Do not proactively send notifications.

When I ask you to notify me when a task is complete, use the `push` command:
- `push "Task completed: [description]"` - sends a normal priority notification
- `push "Task completed: [description]" 1` - sends a high priority notification (bypasses quiet hours)
- `push "Task completed: [description]" 2` - sends an emergency notification (makes sound even on silent)

The push command is available at ~/bin/push (symlinked from ~/.dotfiles/bin/push).

## Image Generation
Use the `generate-image` command to create images with Google Gemini or OpenAI:
- `generate-image "prompt"` - generates a 1024x1024 image with Gemini (default)
- `generate-image "prompt" --provider openai` - generates image with OpenAI DALL-E 3
- `generate-image "prompt" --size 1024x1536` - generates a portrait image
- `generate-image "prompt" --output filename.png` - saves with specific filename
- `generate-image "prompt" --url-only` - returns URL without downloading (OpenAI only)
- `generate-image --help` - shows all available options

**Providers:**
- `gemini` - Google's Gemini 2.5 Flash Image (nano-banana/gemini-2.5-flash-image-preview) - default
- `openai` - OpenAI's DALL-E 3

The command is available at ~/bin/generate-image (symlinked from ~/.dotfiles/bin/generate-image).

**Environment variables:**
- `OPENAI_API_KEY` - required for OpenAI provider
- `GEMINI_API_KEY` - required for Gemini provider

## Slash Commands

Slash commands in `~/.claude/commands/` provide on-demand loading of specialized documentation and workflows.

### When to Create Commands vs Update CLAUDE.md

**Create a slash command (`~/.claude/commands/[name].md`) when:**
- Documentation is **topical/domain-specific** (Todoist, specific workflows, tool-specific patterns)
- Content is **only relevant for certain tasks** (not needed in every session)
- You want to **save context** by loading on-demand
- There are **clear trigger conditions** (user asks about X, working on Y)

**Add directly to CLAUDE.md when:**
- Rules are **universal** (apply to every interaction)
- It's **meta-cognitive** (how to learn, improve, reflect)
- Content is **always needed** (user preferences, core principles)
- It's about **when to use commands** (this section!)

**Examples:**
- ✅ Command: `/todoist` - Only load when working with tasks
- ✅ Command: `/continuous` - Only load for long-running operations
- ❌ CLAUDE.md: User name, package manager preference (always relevant)
- ❌ CLAUDE.md: Meta-learning principles (universal behavior)

### How Slash Commands Work

**What's auto-loaded into context:**
- Only the command name and `description` field from frontmatter
- The description should be VERBOSE and DESCRIPTIVE - clearly explain what it does, how it works, and when to use it
- This keeps context clean - full command content isn't loaded until invoked

**What loads on invocation:**
- Full command file content when you type `/commandname`
- Can include protocols, documentation, approval workflows, etc.

**Files are version controlled:**
- `~/.claude/commands/` → symlinked from `~/.dotfiles/claude/commands/`
- **IMPORTANT**: Always commit changes to dotfiles repo after modifying commands or CLAUDE.md

### Available Commands

- **`/continuous`** - Starts background runner that sends periodic check-ins (every 3 min) to keep Claude working on long-running tasks (2+ hours). Requires explicit approval before starting.
  - **Trigger**: Only when user explicitly requests continuous/overnight operation
  - **Includes**: Full documentation + mandatory approval protocol

- **`/todoist`** - Todoist task management via REST API v2. Use when user asks to create tasks, work with Todoist, or process task lists. Includes API patterns, priority mapping, project IDs, and task creation examples.
  - **Trigger**: User asks to create tasks, mentions Todoist, or requests help with task organization
  - **Includes**: API examples, project IDs, bulk operations, processing guidelines

- **`/idea`** - Raw idea quick capture workflow. Use when user shares a raw idea (casual phrasing like "I have a new idea..."). Captures ideas verbatim without clarifying questions, scans for related ideas, and generates Obsidian URL.
  - **Trigger**: Casual idea sharing ("I have a new idea...", "what if we...", "here's something I'm thinking about...")
  - **Includes**: Capture protocol, template structure, related idea scanning, Obsidian URL generation

- **`/coach`** - Ship to Beach Executive Coach - Direct, pattern-interrupting coaching focused on breaking 9-month analysis paralysis cycle. Recognizes systems thinking as avoidance, addresses permission problem (not capability problem), uses somatic Truth Gate checks. Zero tolerance for frameworks/planning - execution only. Accountability is simple and boring: "What did you ship?" Weekly check-ins on outcomes not strategy. Based on 692k word synthesis + advisor roundtable consensus (Dalio, Robbins, Colonna, Rabois, Altman). Ships from 70% clarity, not 95%. Single-threaded focus, public accountability, imperfect action.
  - **Trigger**: User asks for coaching/check-in, exhibits analysis paralysis patterns, building frameworks instead of shipping, stuck on decisions, weekly accountability
  - **Includes**: Pattern interrupt phrases, Truth Gate Ritual protocol, 30-day sprint framework, success criteria, advisor consensus, coaching session templates, hard confrontation tactics when needed

- **`/prompt-improve`** - Apply Claude 4 prompt engineering best practices to any prompt, command, or output style. Uses XML tags, examples, step-by-step reasoning, role-based prompting, and clear motivation. Tests improvements with subagent before finalizing. Helps iteratively improve existing prompts without starting from scratch.
  - **Trigger**: User wants to improve a prompt/command/output-style, asks for prompt engineering help, wants to apply best practices
  - **Includes**: 10 best practices checklist, before/after examples, testing protocol, common patterns to fix, structured output format

- **`/tmux-context`** - Creates a persistent tmux context pane using glow + entr for live-updating markdown display. Shows shared understanding and alignment. Supports multiple Claude instances with unique IDs. Only use when user explicitly requests it.
  - **Trigger**: User explicitly asks for tmux context pane, persistent context display, or alignment tracking
  - **Includes**: Window/pane detection, unique ID generation, glow+entr setup, context file template, update protocols, troubleshooting

### Creating New Commands

1. Create `~/.claude/commands/[name].md`:
```markdown
---
description: Verbose, descriptive explanation of what it does, how it works, and when to use it. Be specific and clear - this is what appears in Claude's context.
---

# Command instructions for Claude

## Protocol (if needed)
- Approval workflows
- Trigger conditions

## Full Documentation
- Usage examples
- Reference information
```

2. **Test with subagent** (for complex commands):
   - Launch general-purpose subagent with Task tool
   - Provide 3-5 realistic test scenarios
   - Request roleplay responses and evaluation
   - Ask for strengths, weaknesses, gaps, and improvement recommendations
   - Implement improvements before finalizing

3. Add to "Available Commands" list above with the full description and trigger info

4. **Commit to dotfiles**: `cd ~/.dotfiles && git add claude/ && git commit -m "Add [name] command" && git push`

5. Commands auto-appear in slash command menu

**Why test with subagents:**
- Catches ambiguities before real-world use
- Validates practical usability through roleplay
- Identifies missing context
- Improves balance and completeness
- See `/coach` command for example testing protocol

### Improving Existing Commands

**When you learn something new about a command's topic:**
- **ADD** new patterns, examples, or best practices to the command file
- **ENHANCE** existing sections with additional context and clarity
- **NEVER REMOVE** existing content without explicit user confirmation
- **COMMIT** changes immediately: `cd ~/.dotfiles && git add claude/commands/ && git commit -m "Enhance /[name] command: [what you learned]" && git push`

**Example**: If you discover a new Todoist API pattern, add it to `/todoist` command with context about when/why to use it.

### CRITICAL: Removing Content from CLAUDE.md or Commands

**Before removing ANY text from CLAUDE.md or command files:**

1. **STOP and ask the user first** - Never remove content without explicit confirmation
2. **Explain what you want to remove** - Quote the exact text
3. **Explain WHY removal might be needed** - What problem does it solve?
4. **Explain the RISK** - What context/memory might be lost?

**Why this is critical:**
- CLAUDE.md and commands are **your context and memory**
- Removals affect **all future sessions**, not just the current one
- What seems redundant now might prevent future mistakes
- Users have carefully built this context over time
- **Regressions are expensive** - you'll repeat solved problems

**Only remove after user explicitly approves**, saying something like:
- "Yes, remove that section"
- "Go ahead and delete that"
- "That's safe to remove"

**Never remove based on:**
- "This seems outdated" (it might still be relevant)
- "This is redundant" (repetition aids learning)
- "This could be shorter" (brevity isn't always better for context)

## Computer Use Agent
IMPORTANT: Only use the computer use agent when I explicitly ask you to control my computer.

There is a computer use agent available at `~/ws/claude-computer-use-mac/agent.py` that can control my Mac using Claude Sonnet 4.5 with the Computer Use API.

**DO NOT:**
- ❌ Proactively suggest or use the computer use agent
- ❌ Run the agent without my explicit permission
- ❌ Use `--live` mode without my confirmation

**DO:**
- ✅ Only use when I explicitly ask you to control my computer
- ✅ Start in dry-run mode first (default) to show what will happen
- ✅ Switch to `--live` mode only when I confirm

**Usage:**
```bash
# Dry-run (safe, shows what will happen)
cd ~/ws/claude-computer-use-mac && python agent.py "task description"

# Live mode (actually controls computer)
cd ~/ws/claude-computer-use-mac && python agent.py "task description" --live
```

**Example acceptable usage:**
- Me: "Can you open Activity Monitor for me?"
- You: Run the agent with my task

**Example unacceptable usage:**
- Me: "I need to check my memory usage"
- You: DON'T automatically run the agent - just tell me how

## Port and Process Management

**IMPORTANT: Never kill a process running on a port unless you started it yourself or have explicit permission from the user.**

**Protocol:**
1. If you need to stop a process on a port:
   - First check if you started it in this session
   - If you didn't start it, ask the user for explicit permission before killing it
   - Never assume it's safe to kill a process just because a port is in use

2. When checking for processes on ports:
   - Use `lsof -i :[port]` or similar to identify what's running
   - Report to the user what process is using the port
   - Wait for explicit permission to kill it

**Example acceptable actions:**
- You: Started `pnpm run dev` which is using port 5173
- You: Can kill that process later without asking

**Example requiring permission:**
- User: "Something is running on port 3000"
- You: Check what's running, report findings, then ask: "Process X is running on port 3000. Would you like me to kill it?"

## iCloud Drive

**Location:** `/Users/michael/Library/Mobile Documents/com~apple~CloudDocs/`

This follows the PARA method structure (similar to notes folder).

## Notes & Knowledge Management
My primary notes system is located at `~/ws/everything-monorepo/notes/` and follows the PARA method:

**Directory Structure:**
- `+Inbox/` - New notes go here by default if not specified
- `1-Projects/` - Active projects with defined outcomes
- `2-Areas/` - Ongoing areas of responsibility (e.g., Agents, Strategy, System)
- `3-Resources/` - Reference materials, templates, guides
- `4-Archives/` - Completed or inactive items
- `5-Tools/` - Scripts, automation, operational tools

**Working with Notes:**
- When working with the notes folder, cd into `~/ws/everything-monorepo/notes/` first
- Always check the local `CLAUDE.md` in that folder for specific guidelines
- New notes default to `+Inbox/` unless a specific location is requested
- The notes folder has its own comprehensive CLAUDE.md with detailed processing rules

## Config File Management
**Important:** Stray config files should be symlinked from `~/.dotfiles` for version control and tracking.

**Pattern for new config files:**
1. Move the config file to the appropriate location in `~/.dotfiles/`
2. Create a symlink from the original location to the dotfiles location
3. Commit and push to the dotfiles repo

**Example:**
```bash
# Move config file
mv ~/.some-app/config.json ~/.dotfiles/some-app/config.json

# Create symlink
ln -s ~/.dotfiles/some-app/config.json ~/.some-app/config.json

# Commit and push
cd ~/.dotfiles && git add some-app/ && git commit -m "Add some-app config" && git push
```

**Existing managed configs:**
- `~/.claude/CLAUDE.md` → `~/.dotfiles/claude/CLAUDE.md`
- `~/.claude/settings.json` → `~/.dotfiles/claude/settings.json`
- `~/.claude/commands/` → `~/.dotfiles/claude/commands/`
- `~/.claude/scripts/` → `~/.dotfiles/claude/scripts/`
- `~/bin/` scripts → `~/.dotfiles/bin/`

My name is Michael
- The current year is 2025
- Prefer the vercel AI SDK to using the provider SDKs directly but when using the Vercel AI SDK refer to the docs online and examples rather than relying on your memory of the API.
- Use biome as the linter
- Don't estimate date timelines for tasks -- you are really bad at that, instead just do sequences or points.

When using the Anthropic API use the model claude-opus-4-1-20250805 for difficult tasks or claude-sonnet-4-5-20250929 as the default model. Do not use claude 3 for anything

Use pnpm instead of npm.

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
When user shares a raw idea (indicated by casual phrasing like "I have a new idea..."):
1. **NEVER ask clarifying questions** - just capture verbatim
2. **Create note in `~/ws/everything-monorepo/notes/3-Resources/💡 Raw Ideas/`**
3. **Filename format:** `YYYY-MM-DD-brief-title.md`
4. **Use template:** `~/ws/everything-monorepo/notes/Templates/Raw Idea Template.md`
5. **Scan for related ideas** across notes and link them
6. **Send Obsidian URL** as markdown link when complete
7. **Processing happens later** during reviews - not at capture time

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

2. Add to "Available Commands" list above with the full description and trigger info
3. **Commit to dotfiles**: `cd ~/.dotfiles && git add claude/ && git commit -m "Add [name] command" && git push`
4. Commands auto-appear in slash command menu

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

## Notes & Knowledge Management
My primary notes system is located at `~/ws/everything-monorepo/notes/` and follows the PARA method:

**Directory Structure:**
- `+Inbox/` - New notes go here by default if not specified
- `1-Projects/` - Active projects with defined outcomes
- `2-Areas/` - Ongoing areas of responsibility (e.g., Agents, Strategy, System)
- `3-Resources/` - Reference materials, templates, guides
- `4-Archive/` - Completed or inactive items
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
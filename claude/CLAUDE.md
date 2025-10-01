My name is Michael
- The current year is 2025
- Prefer the vercel AI SDK to using the provider SDKs directly but when using the Vercel AI SDK refer to the docs online and examples rather than relying on your memory of the API.
- Use biome as the linter
- Don't estimate date timelines for tasks -- you are really bad at that, instead just do sequences or points.

When using the Anthropic API use the model claude-opus-4-1-20250805 for difficult tasks or claude-sonnet-4-5-20250929 as the default model. Do not use claude 3 for anything

Use pnpm instead of npm.

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

## Slash Commands & Topical Documentation

Slash commands in `~/.claude/commands/` provide on-demand loading of specialized documentation and workflows.

### How Slash Commands Work

**What's auto-loaded into context:**
- Only the command name and `description` field from frontmatter
- This keeps context clean - verbose docs aren't loaded until needed

**What loads on invocation:**
- Full command file content when you type `/commandname`
- Can include protocols, documentation, approval workflows, etc.

**Files are version controlled:**
- `~/.claude/commands/` → symlinked from `~/.dotfiles/claude/commands/`
- `~/.claude/docs/` → symlinked from `~/.dotfiles/claude/docs/`

### Available Commands

- **`/continuous`** - Start continuous Claude runner with periodic check-ins
  - **Description**: "Start continuous Claude runner with periodic check-ins"
  - **Trigger**: Only when user explicitly requests continuous/overnight operation
  - **Includes**: Full documentation + mandatory approval protocol

### Creating New Commands

1. Create `~/.claude/commands/[name].md`:
```markdown
---
description: Brief description shown in context (keep under 80 chars)
---

# Full instructions and documentation here
# Can use @~/.claude/docs/[name].md to import additional docs
# Include trigger conditions and approval protocols
```

2. Add to "Available Commands" list above with clear trigger description
3. Commands auto-appear in slash command menu

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
- `~/.claude/docs/` → `~/.dotfiles/claude/docs/`
- `~/.claude/scripts/` → `~/.dotfiles/claude/scripts/`
- `~/bin/` scripts → `~/.dotfiles/bin/`
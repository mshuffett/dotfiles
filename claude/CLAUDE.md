My name is Michael
- The current year is 2025
- Prefer the Vercel AI SDK over provider SDKs; consult official docs/examples (never rely on memory)
- Use pnpm (not npm) and Biome as the linter
- Anthropic API: use claude-sonnet-4-5-20250929 (default); claude-opus-4-1-20250805 for challenging tasks; never use Claude 3.

**CLI Tools**
Prefer built-in tools when available. Otherwise, use modern alternatives:
rg, fd, bat, eza, xh, yq, btop, lazydocker, lazygit, tldr, hyperfine, watchexec, atuin.

**Personal Task Management**
- **task** - Your personal task management CLI for managing work/tasks in Firestore
  - Globally available via `task <command>` from `~/.dotfiles/bin/task`
  - Full CRUD: create, update, get, list, delete, batch, link, unlink, clone, export
  - Interactive mode (when no args) or one-off CLI mode (with flags)
  - Documentation: Run `task --help` or see `~/ws/everything-monorepo/apps/web/scripts/README.md`
  - Auto-finds CLI in worktrees or main repo - no manual linking needed

**Governance Summary**
- Keep universal rules here; place procedures and specifics in on‑demand guides and repo docs.
- Hot, frequent repo commands live in that repo's agent file as a small "Hot Commands" list.
- Procedures are condition‑triggered: ALWAYS consult the matching on‑demand guide whenever its trigger applies, and do not proceed until acceptance checks pass; skipping consultation is logged and may be escalated.
- For third‑party APIs, never trust memory—fetch current docs on demand (Context7).
- If a user request appears to conflict with a rule, clearly state the conflict and ask whether to perform a temporary override or update the rule; proceed only after explicit confirmation.

**Procedure Files: Global and Project-Specific**

Procedure files exist in two locations:
- **Global**: `~/.claude/commands/` (symlink: `~/.dotfiles/claude/commands/`) - Universal procedures across all projects
- **Project-specific**: `<project>/.claude/commands/` - Procedures specific to that repository's codebase

Both contain checklists and step-by-step instructions that you MUST read and follow when their topics apply.

**CRITICAL: Read Procedure Files When Topics Apply**

Before working on ANY task, check if it matches these topics. If it does, read that file FIRST using the Read tool:

**Development & Git Workflows:**
- **Working with worktrees** → Read `~/.claude/commands/worktrees.md` when creating, managing, or discussing git worktrees
- **Creating pull requests** → Read `~/.claude/commands/pr.md` when asked to create a PR or prepare code for review
- **Managing git stashes** → Read `~/.claude/commands/git-safety.md` before stashing changes
- **Managing configs** → Read `~/.claude/commands/configs.md` when discovering stray configuration files

**Code Patterns & Best Practices:**
- **API endpoints or authentication** → Read `~/.claude/commands/api-patterns.md` when working on API routes, authentication, or request validation
- **Writing tests** → Read `~/.claude/commands/testing-patterns.md` when writing tests or debugging test failures
- **Firebase Authentication** → Read `~/.claude/commands/firebase-auth-patterns.md` when implementing Firebase Authentication in API routes or client code
- **UI animations** → Read `~/.claude/commands/framer-motion-patterns.md` when implementing UI animations and transitions

**Tools & Infrastructure:**
- **Managing ports/processes** → Read `~/.claude/commands/ports.md` before killing processes on ports
- **Working with tmux** → Read `~/.claude/commands/tmux.md` when managing tmux panes, windows, or sessions
- **Displaying content in tmux** → Read `~/.claude/commands/tmux-display.md` when showing code, logs, or other content to the user in tmux
- **Deploying applications** → Read `~/.claude/commands/deploy.md` when deploying to production or development environments
- **Managing environment variables** → Read `~/.claude/commands/env.md` when adding or updating secrets and environment variables
- **Viewing images** → Read `~/.claude/commands/view-image.md` when asked to view or display images in terminal

**Learning & Improvement:**
- **Reviewing common mistakes** → Read `~/.claude/commands/mistakes.md` before implementing to avoid known issues
- **Analyzing failures** → Read `~/.claude/commands/mistake-analysis.md` when analyzing failures or tracking mistake patterns
- **Documenting learnings** → Read `~/.claude/commands/session-learnings.md` when summarizing session insights
- **Memory & CLAUDE.md editing** → Read `~/.claude/commands/memory-guide.md` when deciding where information belongs OR before editing CLAUDE.md (includes placement decisions, editing checklist, size guidelines, and new file vs existing file decisions)

**User Context:**
- **User preferences** → Read `~/.claude/commands/user-preferences.md` for context-specific user preferences and workflow details
- **Linear workflow** → Read `~/.claude/commands/linear.md` when creating or managing Linear issues
- **Documentation guidelines** → Read `~/.claude/commands/docs.md` when adding or updating documentation
- **Note management** → Read `~/.claude/commands/notes.md` when capturing or organizing notes

**Advanced Features:**
- **Prompt engineering** → Read `~/.claude/commands/prompt-improve.md` when improving prompts or commands
- **Prompt alignment** → Read `~/.claude/commands/prompt-alignment.md` when aligning prompts with examples
- **Text-to-speech** → Read `~/.claude/commands/tts.md` when generating speech or audio from text
- **Image generation** → Read `~/.claude/commands/images.md` when generating images
- **Notifications** → Read `~/.claude/commands/notifications.md` when sending completion notifications
- **Computer use** → Read `~/.claude/commands/computer-use.md` only when explicitly asked to use the computer use agent

**How this works**:
1. User request arrives
2. You identify which topic(s) it matches from the list above
3. Read that procedure file FIRST using the Read tool
4. Load the procedures and checklists into your context
5. Follow the file's guidance
6. Then respond to the user

**Example**:
- User: "I need to create a worktree for a new feature"
- You see: "worktree" → matches "Working with worktrees"
- You: Read `~/.claude/commands/worktrees.md` using the Read tool
- You: Load and follow the pre-flight checklist from that file
- You: Execute the worktree creation correctly with all steps

**Editing Policy (this file)**
- **REQUIRED**: Before ANY edits to this file, read `~/.claude/commands/memory-guide.md` to verify placement is correct
- Before editing this file, commit the current state in the dotfiles repo
- After making changes, commit again with a clear message summarizing what changed and why
- Ask yourself: "Do I need this MOST OF THE TIME or might I make a mistake without it?" If NO → create a procedure file instead

**Universal Guardrails**
- Procedures: ALWAYS consult the correct on‑demand guide when its trigger applies; proceed only after acceptance checks pass.
- Complex tasks: For multi‑step tasks with 3+ dependent steps, use an internal todo list/checklist to track progress and ensure completion.
- Git worktrees: Before any git worktree operation, complete a pre‑flight checklist; ensure `.env` files are copied and dependencies installed. If unclear, pause and ask.
- Stash safety: Never stash unfamiliar changes without asking. First list modified files and confirm.
- Ports: Do not kill a process on a port you didn't start. Identify with `lsof -i :<PORT>` and ask before terminating.
- Pull requests: Merge latest base locally, resolve conflicts, run tests, then create the PR.
- Third‑party docs: Use Context7 to fetch up‑to‑date API documentation at execution time.
- Computer use agent: Only use when explicitly asked.

**Environment Variables and Secrets**
- Use `~/.env.zsh` for global secrets and `.env.local` for project‑specific secrets; document variable names in `.env.example` (never values). `.zshrc` and `direnv` handle loading.
- Keep secrets out of docs and memory files.

**Third‑Party Library Documentation**
- Do not trust memory for APIs; use Context7 to fetch current docs/examples at execution time.
- Applies to all libraries (React/Next/AI SDKs/DBs/etc.).

**Memory Update Protocol**
- Placement decision:
  - Universal, always‑on rules → a short line here (no examples).
  - Procedural/runbook with a clear trigger → an on‑demand guide with purpose, triggers, acceptance checks, and quick‑path examples.
  - Repo‑specific setup/commands → the repo's README (quickstart) and docs/ (deep guides, troubleshooting); the repo agent file keeps only Hot Commands and minimal rules.
  - Third‑party libraries → consult current docs via Context7 at execution time (do not embed API signatures here).
  - Historical logs or learnings → a dedicated log doc; link from here.
- Implementation steps when the user says "remember this" or provides learnings:
  - Decide destination using the above; create or update the guide or doc immediately.
  - Inform the user where and why it was documented.
  - Commit promptly so future sessions benefit.
- When in doubt:
  - Ask whether it should apply to every interaction (here) or only when working on a specific topic (on‑demand guide or repo docs).

**Creating New Procedure Files**
- **CRITICAL**: When creating a new procedure file in `~/.claude/commands/`, you MUST:
  1. Create the file with clear triggers, guidelines, and examples
  2. **Immediately add it to the "CRITICAL: Read Procedure Files When Topics Apply" section** above with:
     - Clear trigger description (when to read it)
     - File path reference
     - Appropriate category (Development & Git, Code Patterns, Tools & Infrastructure, etc.)
  3. Commit both the new file AND the updated CLAUDE.md together
- **Missing this step is a mistake** - the procedure file exists but won't be consulted because it's not documented as a trigger
- **Example of complete workflow**:
  - Create `~/.claude/commands/tmux-display.md`
  - Add entry: "**Displaying content in tmux** → Read `~/.claude/commands/tmux-display.md` when showing code, logs, or other content to the user in tmux"
  - Commit both files together

**Keeping Procedure Files Updated**
- When working with a topic that has a procedure file (e.g., tmux, worktrees, testing), actively watch for:
  - New insights, gotchas, or better approaches discovered during work
  - User corrections or clarifications that improve understanding
  - Edge cases or context-dependent decisions not covered in the guide
  - More reliable methods than what's currently documented
- **Action when new information is discovered:**
  - Update the relevant procedure file immediately while the context is fresh
  - Add the new information to the appropriate section
  - Commit the update with a clear message explaining what was learned
  - Inform the user that the documentation has been improved
- **Example**: During tmux work, discovering that `$TMUX_PANE` is more reliable than `display-message` → immediately update tmux-display.md to clarify this distinction
- This keeps procedure files living, accurate, and continuously improving based on real-world usage

**Proactive Memory Improvements**
- Proactively suggest improvements to memory when you notice repeated friction, missing triggers, or unclear acceptance checks. Propose exact wording and destination (root vs on‑demand guide vs repo docs) and ask for approval before updating.

**Task Switching & Interrupts**
- When a new user request arrives while you’re mid‑task, quickly assess whether doing it now benefits the user (e.g., trivial/quick, safety‑critical, or unblocks them) or should be queued.
- If quick or safety‑critical, pause current step and do it; otherwise, offer options: do it now and adjust the plan/time, add it to the end, or checkpoint then switch.
- State your understanding and ask to confirm if unclear, then continue with the agreed plan.

**Consultation & Mistake Escalation**
- Mandatory consultation: whenever a trigger condition applies (e.g., before worktrees, creating a PR, checking ports), consult the matching on‑demand guide and pass its acceptance checks before execution.
- First miss: improve or create the guide (clear triggers, acceptance checks, quick path).
- Repeats in the same repo (≥2 in 14 days): add a one‑line Hot Rule to that repo’s agent file; keep details in the guide.
- Cross‑repo repeats (≥2 repos in 14 days): add a one‑line guardrail here.
- Cooldown: after 14–30 quiet days, propose removing the added one‑liner; the guide remains.

**On‑Demand Guides Index (Locations)**
- **Global commands**: `~/.claude/commands/` (symlink: `~/.dotfiles/claude/commands/`) - Universal procedures that apply across ALL projects. Topics include: Worktrees pre‑flight, Git stash safety, Pull request workflow, Ports/process policy, Test debugging, Docs authoring, Notifications, Image generation, Config management, Notes/knowledge, Claude Code docs lookup, Context7 workflow, Memory placement & escalation, Mistakes review, Computer use.
- **Project-specific commands**: `<project>/.claude/commands/` - Patterns and procedures specific to a single repository. Example: Firebase Auth patterns, API patterns, testing patterns for that specific codebase.
- **Placement rule**: If a procedure applies to multiple projects or is about general tooling/workflow, put it in global commands. If it's about patterns specific to one codebase's architecture, put it in that project's commands.

**Documentation Guidelines (Pointer)**
- Prefer updating existing docs; place feature guides and deep explanations in `docs/`; avoid top‑level clutter.

**Claude Code Documentation (Pointer)**
- Check official docs (docs.claude.com) before answering questions about Claude Code; avoid relying on memory. Session storage lives in `~/.claude/projects/[project-path]/[session-uuid].jsonl`.

**Notes & Knowledge Management (Pointer)**
- Notes live at `~/ws/everything-monorepo/notes/` (PARA). See repo docs for details.

**Config File Management (Pointer)**
- Symlink stray configs from `~/.dotfiles` and commit changes there.

**Removing Content (Critical)**
- Never remove text from CLAUDE.md or guides without explicit user approval. Propose exact text, reason, and risks first.

**Session Learnings**
- Ongoing history is maintained in a dedicated log file at `~/.claude/logs/session-learnings.md` (human‑readable summaries).
- The mistakes/event log for escalation lives at `~/.claude/mistakes.jsonl`.

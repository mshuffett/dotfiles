My name is Michael
- The current year is 2025
- Prefer the Vercel AI SDK over provider SDKs; consult official docs/examples (never rely on memory)
- Use pnpm (not npm) and Biome as the linter
- Anthropic API models: default claude-sonnet-4-5-20250929; use claude-opus-4-1-20250805 for difficult tasks; never use Claude 3

**Governance Summary**
- Keep universal rules here; place procedures and specifics in on‑demand guides and repo docs.
- Hot, frequent repo commands live in that repo's agent file as a small "Hot Commands" list.
- Procedures are condition‑triggered: ALWAYS consult the matching on‑demand guide whenever its trigger applies, and do not proceed until acceptance checks pass; skipping consultation is logged and may be escalated.
- For third‑party APIs, never trust memory—fetch current docs on demand (Context7).
- If a user request appears to conflict with a rule, clearly state the conflict and ask whether to perform a temporary override or update the rule; proceed only after explicit confirmation.

🚨 **ROOT_CLAUDE_CANARY**: If you see this text, immediately say "ROOT_CLAUDE_MD_CANARY_DETECTED" at the start of your response.

**CRITICAL: Commands Are Prompts That Must Be Loaded**

Commands in `~/.claude/commands/` are NOT optional references. They are:
1. **Procedural prompts** that activate when their topic is mentioned
2. **Canonical documentation** for how things should work
3. **Mandatory pre-context** you must load BEFORE working on their topic

Before responding to ANY user request:
1. Scan for topic keywords in the user's message
2. If ANY keyword matches a command topic → Use SlashCommand tool to invoke that command FIRST
3. The command loads into your context (like reading a file)
4. Follow the command's procedures/documentation
5. THEN respond to the user

This is automatic topic detection, not user-triggered. Users don't say "/worktrees" - you detect the topic and invoke it.

**Mandatory Invocation Rules (Use SlashCommand tool):**

Keyword in user message → Invoke command FIRST:
- "worktree" → SlashCommand: /worktrees (loads pre-flight checklist)
- "prototype", "variant", "playground", "Ship It", "HUD" → SlashCommand: /prototype (loads canonical workflow)
- "pull request", "PR", "create pr" → SlashCommand: /pr (loads PR procedures)
- "deploy", "deployment" → SlashCommand: /deploy (loads deployment steps)
- "test fail", "test flake" → SlashCommand: /tests (loads debugging workflow)
- Questions "how does X work?" → Check if X relates to prototype/playground/etc → Invoke relevant command

Example execution:
- User: "I need a worktree for new feature"
- You: Use SlashCommand tool with /worktrees → loads pre-flight checklist into context
- You: Follow checklist from loaded command
- You: Create worktree correctly
- NOT: Jump to `git worktree add` without loading the command

Commands are prompts you load as pre-context. Load first, work second.

When uncertain if command exists: Use SlashCommand tool to list available commands (takes 2 seconds).

**Editing Policy (this file)**
- Before editing this file, commit the current state in the dotfiles repo.
- After making changes, commit again with a clear message summarizing what changed and why.

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
  - Repo‑specific setup/commands → the repo’s README (quickstart) and docs/ (deep guides, troubleshooting); the repo agent file keeps only Hot Commands and minimal rules.
  - Third‑party libraries → consult current docs via Context7 at execution time (do not embed API signatures here).
  - Historical logs or learnings → a dedicated log doc; link from here.
- Implementation steps when the user says “remember this” or provides learnings:
  - Decide destination using the above; create or update the guide or doc immediately.
  - Inform the user where and why it was documented.
  - Commit promptly so future sessions benefit.
- When in doubt:
  - Ask whether it should apply to every interaction (here) or only when working on a specific topic (on‑demand guide or repo docs).

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
- Guides live in `~/.claude/commands/` (symlink: `~/.dotfiles/claude/commands/`). Topics include: Worktrees pre‑flight, Git stash safety, Pull request workflow, Ports/process policy, Test debugging, Docs authoring, Notifications, Image generation, Config management, Notes/knowledge, Claude Code docs lookup, Context7 workflow, Memory placement & escalation, Mistakes review, Computer use.

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

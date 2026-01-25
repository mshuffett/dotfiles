---
name: ralph-orchestrator
description: This skill should be used when the user asks to "run ralph", "set up ralph", "create a PRD workflow", "use ralph-orchestrator", "autonomous coding loop", "hat-based agents", or mentions ralph tasks, ralph presets, ralph plan, or PRD-driven development. Provides guidance for ralph-orchestrator autonomous coding workflows.
version: 0.1.0
---

# Ralph Orchestrator

Ralph-orchestrator is an autonomous coding loop that coordinates specialized AI agents ("hats") to implement features from specifications.

## Installation

```bash
brew install ralph-orchestrator
```

## Core Concepts

### The Hat System

Ralph uses specialized personas that take turns:

| Hat | Purpose |
|-----|---------|
| 📋 Planner | Reads specs, creates tasks |
| ⚙️ Builder | Implements one task at a time |
| 🔎 Reviewer | Verifies against requirements |
| ✅ Verifier | Final verification, outputs LOOP_COMPLETE |

### Task System

Tasks live in `.agent/tasks.jsonl`. The loop continues until all tasks are closed:

```bash
ralph task add "Implement feature" -p 1 -d "Description"
ralph task add "Blocked task" --blocked-by <task-id>
ralph task list
ralph task ready      # Show unblocked tasks
ralph task close <id>
```

### Backpressure

Quality gates that reject work unless tests/lint/typecheck pass. Enforced via guardrails in `ralph.yml`.

### Events

Hats communicate via events. Each hat triggers on specific events and publishes results:

```bash
ralph emit "build.done" "tests: pass, lint: pass"
```

## Quick Start

```bash
# Initialize with a preset
ralph init --preset spec-driven --backend claude

# Create PROMPT.md with your task
echo "Build a rate limiter" > PROMPT.md

# Run
ralph run
```

## Starting from a GitHub Issue

When you have a GitHub issue to implement, follow this workflow:

### Option 1: Simple Issues (Single Task)

For straightforward issues that can be tackled in one sitting:

```bash
# Fetch the issue and create PROMPT.md
gh issue view 83 --repo owner/repo > PROMPT.md

# Or for cleaner output (body only):
gh issue view 83 --repo owner/repo --json title,body --jq '"# " + .title + "\n\n" + .body' > PROMPT.md

# Run Ralph
ralph run
```

### Option 2: Complex Issues (Multiple Sub-tasks)

For issues with multiple components (like yours with SSE streaming, tunnel persistence, and S3 permissions):

```bash
# 1. Fetch the issue to a spec file
gh issue view 83 --repo owner/repo --json title,body --jq '"# " + .title + "\n\n" + .body' > specs/issue-83.md

# 2. Initialize with spec-driven preset
ralph init --preset spec-driven --backend claude

# 3. Point PROMPT.md at the spec
echo "Implement the fixes described in specs/issue-83.md" > PROMPT.md

# 4. Run - the Planner will break it into tasks
ralph run
```

### Option 3: Using `ralph plan` (Interactive)

For when you want to review the plan before execution:

```bash
# Fetch issue content
gh issue view 83 --repo owner/repo --json body -q '.body' > specs/issue-83.md

# Interactive planning session
ralph plan "Fix issues in specs/issue-83.md"

# Review the tasks
ralph task list

# Then run
ralph run
```

### Which Option to Choose?

| Scenario | Best Option |
|----------|-------------|
| Bug fix, single clear change | Option 1 |
| Multi-part issue (like your example) | Option 2 |
| Unclear scope, want control | Option 3 |
| Long-running feature work | Option 2 + `--resume` |

### Pro Tips

- **Keep the issue link**: Add `<!-- Issue: https://github.com/owner/repo/issues/83 -->` to your spec for traceability
- **Scope down**: If an issue has 3 unrelated problems, consider running Ralph 3 times on focused sub-specs
- **Resume interrupted runs**: `ralph run --resume` continues where you left off

## Available Presets

View all presets:
```bash
ralph init --list-presets
```

Key presets:
- `spec-driven` - Spec Writer → Critic → Builder → Verifier
- `feature` - Builder → Reviewer cycle with backpressure
- `documentation-first` - README-driven development
- `tdd-red-green` - Test-driven development
- `debug` - Bug investigation workflow

### Dotfiles Presets

Custom presets live in `~/.dotfiles/claude/skills/ralph-orchestrator/references/`:
- `prd-to-code-assist.yml` - Start from existing PRD, skip design debate

## PRD-Driven Workflow

When you already have a detailed PRD and want to skip the design debate phase:

### Quick Start (Existing PRD)

```bash
# Use the prd-to-code-assist preset from dotfiles
ralph run -c ~/.dotfiles/claude/skills/ralph-orchestrator/references/prd-to-code-assist.yml \
  --prompt "Implement specs/canvas/prd.md"

# Or copy to your project and customize
cp ~/.dotfiles/claude/skills/ralph-orchestrator/references/prd-to-code-assist.yml ./ralph.yml
```

### prd-to-code-assist Workflow (5 hats)

| Hat | Triggers | What It Does |
|-----|----------|--------------|
| Explorer | `prd.ready` | Researches codebase, builds context from PRD |
| Planner | `context.ready` | Creates TDD test strategy and implementation plan |
| Task Writer | `plan.ready` | Converts plan into `.code-task.md` files |
| Builder | `tasks.ready`, `task.complete` | Implements ONE task per iteration via TDD |
| Validator | `implementation.ready` | Quality gate, E2E testing, outputs LOOP_COMPLETE |

### File Organization

```
your-project/
├── specs/
│   └── {feature-name}/
│       ├── design.md      # Your PRD (copy or symlink)
│       ├── context.md     # Generated: codebase patterns
│       ├── plan.md        # Generated: implementation plan
│       └── tasks/
│           ├── task-01-*.code-task.md
│           └── task-02-*.code-task.md
└── ralph.yml
```

### Full PDD Workflow (9 hats)

For rough ideas that need design refinement first, use `pdd-to-code-assist`:

```bash
ralph run -c presets/pdd-to-code-assist.yml --prompt "Build a rate limiter"
```

This adds Inquisitor → Architect → Design Critic before the implementation phase.

## Evolutionary Meta-Orchestrator

The meta-orchestrator runs multiple approaches in parallel, grades them, identifies failure patterns, and evolves improved approaches until a target score is achieved.

### Quick Start

```bash
# From any project with specs/ directory
~/.dotfiles/claude/skills/ralph-orchestrator/references/meta-orchestrator/run-meta.sh

# Or with custom config
~/.dotfiles/claude/skills/ralph-orchestrator/references/meta-orchestrator/run-meta.sh path/to/config.md

# Or run ralph directly
ralph run -c ~/.dotfiles/claude/skills/ralph-orchestrator/references/meta-orchestrator/ralph.yml
```

### The 4 Hats

| Hat | Purpose |
|-----|---------|
| 🎯 Orchestrator | Launches competing approaches in parallel |
| 📊 Grader | Scores each approach against rubric with verification commands |
| 🔬 Analyzer | Classifies errors, identifies patterns, finds winning strategies |
| 🧬 Evolver | Generates improved approach configs based on analysis |

### Configuration

Create `.meta/config.md` with:
- **Task specification** — What to implement
- **Approaches** — Configs/scripts to run with ports
- **Grading rubric** — Categories, verification commands, scoring
- **Critical requirements** — Pass/fail gates
- **Target score** — When to stop iterating

### Error Taxonomy

The analyzer classifies failures to enable targeted evolution:

| Error Type | Meaning | Fix Strategy |
|------------|---------|--------------|
| Planner Error | PRD section not covered | Add Task Auditor hat |
| Builder Error | Task incomplete | More explicit requirements |
| Integration Error | Components not wired | Wiring checklist in Reviewer |
| Environment Error | Wrong paths | Path verification step |
| Runtime Error | Code crashes | Add QA Tester hat |
| Reviewer Error | Issues not caught | Stronger review checklist |

### Output Structure

```
.meta/
├── config.md                 # Task config (input)
├── scratchpad.md             # Running state
├── iteration.txt             # Current iteration number
├── results/
│   ├── grades-1.md           # Scores with evidence
│   ├── analysis-1.md         # Error classification + patterns
│   └── ...
└── approaches/
    ├── evolved-1/
    │   ├── ralph.yml         # Improved config
    │   └── CHANGELOG.md      # What changed and why
    └── ...
```

### Example: PRD Implementation

See `~/.dotfiles/claude/skills/ralph-orchestrator/references/meta-orchestrator/examples/prd-implementation.md` for a complete example config.

## Creating Custom Presets

Edit `ralph.yml`:

```yaml
cli:
  backend: "claude"

core:
  specs_dir: "./specs/"
  guardrails:
    - "Fresh context - re-read specs each iteration"
    - "Backpressure is law - tests must pass"

event_loop:
  starting_event: "task.start"
  completion_promise: "LOOP_COMPLETE"
  max_iterations: 100

hats:
  my_hat:
    name: "🔨 My Hat"
    triggers: ["my.event"]
    publishes: ["my.done"]
    instructions: |
      What this hat should do...
```

## CLI Reference

```bash
ralph run                    # Run the loop
ralph run --resume           # Continue interrupted loop
ralph run --verbose          # Show full prompts
ralph run --dry-run          # Show config without running
ralph plan "idea"            # Interactive planning session
ralph task <subcommand>      # Task management
ralph emit "topic" "payload" # Publish event
ralph init --preset <name>   # Initialize preset
ralph clean                  # Clean up .agent/ files
```

## Project Structure

```
your-project/
├── ralph.yml          # Configuration
├── PROMPT.md          # Task prompt
├── specs/             # Specifications
│   └── prd.md
└── .agent/
    ├── tasks.jsonl    # Task tracking
    ├── scratchpad.md  # Working memory
    └── memories.md    # Persistent learnings
```

## Supported Backends

Ralph supports 7 backends:
- `claude` - Claude Code CLI
- `amp` - Amp (Sourcegraph)
- `codex` - OpenAI Codex
- `gemini` - Google Gemini CLI
- `kiro` - Kiro CLI
- `copilot` - GitHub Copilot
- `opencode` - OpenCode

Set backend:
```bash
ralph init --preset feature --backend claude
```

## Two Task Systems

Ralph has **two separate task systems** — don't confuse them:

| System | Command | Purpose | Storage |
|--------|---------|---------|---------|
| **Code tasks** | `ralph task` | Generate implementation task files from descriptions | `tasks/*.code-task.md` |
| **Runtime tasks** | `ralph tools task` | Track work items during orchestration runs | `.agent/tasks.jsonl` |

### Code Tasks (`ralph task`)

Alias for `ralph code-task`. Uses the code-task-generator SOP to create structured task files:

```bash
ralph task "Add rate limiting to API endpoints"
# Creates tasks/add-rate-limiting.code-task.md
```

### Runtime Tasks (`ralph tools task`)

Used by agents during runs to track work:

```bash
ralph tools task add "Implement feature" -p 1
ralph tools task list
ralph tools task ready      # Show unblocked tasks
ralph tools task close <id>
```

## Usage Patterns & FAQ

### Prompt File Location — Flexible

The prompt file does **not** need to be in the repo root. Precedence:

1. CLI inline: `ralph run -p "inline text"`
2. CLI file path: `ralph run -P specs/my-feature.spec.md`
3. Config `event_loop.prompt` (inline text in YAML)
4. Config `event_loop.prompt_file` (file path in YAML)
5. Default fallback: `PROMPT.md` in current directory

**Pattern:** Keep specs organized in `specs/` and point to them:
```bash
ralph run -P specs/issue-83-fix.md
```

### Adding Tasks Mid-Run — Not Supported

Tasks are loaded once at startup from `.agent/tasks.jsonl`. No file watching during execution.

**Pattern:** Interrupt → edit → restart:
```bash
# Ctrl+C to interrupt
vim .agent/tasks.jsonl
ralph run -P specs/my-feature.md
```

### Parallel Workers — Not Supported

Ralph is single-threaded orchestration. One hat → one execution → next iteration. The philosophy is "agents are smart, let them do the work" — not "spawn many agents."

### Editing Plans Mid-Execution — Supported by Design

This is explicitly supported via Ralph's tenets:

> **"Disk Is State, Git Is Memory"** — Tasks are the handoff mechanism.
> **"The Plan Is Disposable"** — Regeneration costs one planning loop.

**Pattern:**
1. Interrupt the run (Ctrl+C or let iteration complete)
2. Edit `.agent/tasks.jsonl` — mark tasks complete, add new ones, change priorities
3. Edit the spec/prompt file if needed
4. Restart: `ralph run -P specs/my-feature.md`

Ralph re-reads everything fresh each run. No "recovery" logic needed — that's the "Fresh Context Is Reliability" tenet.

### Lighter Planning — No Fast Variant

Two planning options exist, both full workflows:
- `ralph plan` — Full PDD methodology (interactive)
- `ralph task` — Code task generator (structured output)

Neither has a "quick mode." Per the tenets: "The Plan Is Disposable" — regeneration is cheap.

**Pattern for quick iterations:** Skip `ralph plan`, write a minimal spec directly:
```bash
echo "Fix the auth bug in login.ts:45" > PROMPT.md
ralph run
```

## Additional Resources

### Reference Files

- **`references/prd-preset.yml`** - Complete PRD-driven workflow preset
- **`references/workflow-diagram.md`** - Visual workflow documentation
- **`references/meta-orchestrator/`** - Evolutionary meta-orchestrator preset
  - `ralph.yml` - Main config with 4 hats (Orchestrator, Grader, Analyzer, Evolver)
  - `run-meta.sh` - Entry point script
  - `examples/prd-implementation.md` - Example task config

### Example Files

- **`examples/simple-prd.md`** - Example PRD for string utilities

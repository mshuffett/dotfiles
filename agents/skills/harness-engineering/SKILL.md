---
name: harness-engineering
description: Use when setting up, auditing, or improving AI agent infrastructure in a repo — AGENTS.md/CLAUDE.md files, linters, architectural constraints, feedback loops, context tiering, agent specialization, or entropy management. Also use when the user mentions "harness engineering", "agent-friendly repo", "context architecture", "agent constraints", or asks how to make a codebase work well with AI coding agents (Claude Code, Codex, Copilot, Cursor, etc.). Use even if the user just says "set up my repo for agents" or "why is my agent struggling".
---

# Harness Engineering

Harness engineering is the discipline of designing the **environment** around AI coding agents — constraints, guardrails, feedback loops, documentation, and lifecycle management — so agents produce reliable, maintainable output at scale.

The core insight: **the harness, not the agent, is the hard part.** Better models don't reduce the need for harness engineering — they increase it, because more capable models unlock more autonomy, and more autonomy demands better guardrails.

## When This Skill Applies

- Setting up a new repo for AI agent use (greenfield harness)
- Auditing/improving an existing repo's agent-readiness
- Debugging why agents produce poor output in a codebase
- Designing AGENTS.md, CLAUDE.md, or similar agent instruction files
- Adding linters, structural tests, or CI checks to constrain agent behavior
- Organizing context so agents stay in their "smart zone"
- Setting up agent specialization (sub-agents with scoped tools)
- Fighting entropy/drift in an agent-maintained codebase

## Harness File Inventory

A harness is not one file — it's a system of files that work together. Here's what a well-harnessed repo contains:

### Agent Instruction Files
| File | Purpose | Agent Support |
|------|---------|--------------|
| `CLAUDE.md` (root) | Tier 1 context — project map, commands, constraints | Claude Code |
| `CLAUDE.md` (subdirectories) | Tier 2 context — module-specific rules, loaded when working in that dir | Claude Code |
| `AGENTS.md` | Agent-agnostic instructions (Codex, Copilot, etc.) | Codex, multi-agent |
| `.cursor/rules/*.mdc` | Cursor-specific agent rules | Cursor |
| `.github/copilot-instructions.md` | Copilot-specific instructions | GitHub Copilot |
| `GEMINI.md` | Gemini CLI instructions | Gemini |

You don't need all of these — pick the ones matching your tooling. Many teams maintain `CLAUDE.md` as primary and symlink or generate the others.

### Constraint & Enforcement Files
| File | Purpose |
|------|---------|
| `.eslintrc` / `pyproject.toml` / `clippy.toml` | Deterministic linting rules |
| `.prettierrc` / `ruff.toml` / `rustfmt.toml` | Formatting enforcement |
| `tsconfig.json` (strict) / `mypy.ini` / `pyright` | Type system enforcement |
| `.pre-commit-config.yaml` | Pre-commit hook orchestration |
| `tests/architecture/` | Structural tests (dependency direction, import rules) |
| `.github/workflows/ci.yml` | CI pipeline enforcing all of the above |

### Knowledge Base: The `docs/` System of Record

The OpenAI team's key insight: treat the repository's knowledge base as the **system of record**, not external tools. The root agent file is just a table of contents (~100 lines); all depth lives in a structured `docs/` directory.

**Reference layout** (from OpenAI's harness engineering article):
```
AGENTS.md                          # ~100 lines — the map, not the manual
ARCHITECTURE.md                    # Top-level domain map + package layering
docs/
├── design-docs/
│   ├── index.md                   # Catalogued, indexed, with verification status
│   ├── core-beliefs.md            # Agent-first operating principles
│   └── ...
├── exec-plans/
│   ├── active/                    # In-progress plans with decision logs
│   ├── completed/                 # Archived plans (versioned history)
│   └── tech-debt-tracker.md       # Known debt, tracked explicitly
├── generated/
│   └── db-schema.md               # Auto-generated reference (kept fresh by CI)
├── product-specs/
│   ├── index.md
│   ├── new-user-onboarding.md
│   └── ...
├── references/
│   ├── design-system-reference-llms.txt   # External lib docs, vendored
│   ├── nixpacks-llms.txt
│   ├── uv-llms.txt
│   └── ...
├── DESIGN.md                      # Design principles and patterns
├── FRONTEND.md                    # Frontend conventions
├── PLANS.md                       # Active plan index
├── PRODUCT_SENSE.md               # Product domain knowledge
├── QUALITY_SCORE.md               # Quality grades per domain/layer
├── RELIABILITY.md                 # Reliability requirements
└── SECURITY.md                    # Security constraints
```

**Key patterns from this structure**:

- **Plans are first-class artifacts.** Active plans, completed plans, and tech debt are all versioned and co-located in the repo. Agents operate without relying on external context.
- **Quality scoring.** A quality document grades each product domain and architectural layer, tracking gaps over time. This gives agents a clear signal about where to focus.
- **Design docs have verification status.** Not just "here's the design" but "is this still true?"
- **References vendor external docs.** Rather than linking to external sites agents can't access, the `references/` directory contains vendored `llms.txt` files from key dependencies. Agents can read these directly.
- **Generated docs stay fresh.** Auto-generated references (like `db-schema.md`) are rebuilt by CI, so agents always see current state.

### The Key Insight: Give Agents a Map, Not a Manual

The root `CLAUDE.md` / `AGENTS.md` should be a **concise map** (~100 lines / ~500-1500 tokens) that tells agents where things are and what the rules are. All the depth lives in other files that agents pull in on-demand. This is **progressive disclosure**: agents start with a small, stable entry point and are taught where to look next.

**Why the monolithic approach fails** (from OpenAI's experience):
1. **Context is scarce.** A giant instruction file crowds out the task, the code, and relevant docs — so the agent either misses key constraints or starts optimizing for the wrong ones.
2. **Too much guidance becomes non-guidance.** When everything is "important," nothing is. Agents pattern-match locally instead of navigating intentionally.
3. **It rots instantly.** A monolithic manual becomes a graveyard of stale rules. Agents can't tell what's still true, humans stop maintaining it.
4. **It's hard to verify.** A single blob doesn't lend itself to mechanical checks (coverage, freshness, ownership, cross-links), so drift is inevitable.

**What stays in the root file**:
- Project overview (2-3 sentences)
- Directory structure table
- Build/test/run commands
- Top-level architectural rules (with enforcement mechanism noted)
- Critical pitfalls
- Pointers to deeper docs (`docs/`, `ARCHITECTURE.md`, subdirectory CLAUDE.md files)

**What gets extracted**:
- Module-specific conventions → subdirectory `CLAUDE.md` files
- Full API documentation → `docs/` or generated docs
- Business rules → `docs/product-specs/` or domain-level docs
- Design decisions → `docs/design-docs/`
- Plans and execution tracking → `docs/exec-plans/`
- Historical decisions → `docs/design-docs/` or ADRs
- Code style details → linter/formatter config (enforce, don't document)
- External dependency docs → `docs/references/` (vendored `llms.txt` files)
- Quality tracking → `docs/QUALITY_SCORE.md`

**Rule of thumb**: If a rule can be a linter rule, make it a linter rule and remove it from the docs. If it only applies to one module, move it to that module's CLAUDE.md. The root file should only contain things that apply repo-wide and can't be enforced mechanically.

## The Four Pillars

### 1. Context Architecture

Agents can only reason about what's in their context window. Anything they can't access in-context doesn't exist to them.

**The 40% Rule**: Performance degrades beyond ~40% context utilization. Overloading agents with verbose docs, accumulated history, and every tool definition makes them *worse*, not better. Keep agents in the "smart zone" with focused, relevant context.

**Three-Tier Structure**:

| Tier | When Loaded | What Goes Here | Token Budget |
|------|-------------|----------------|--------------|
| **Hot (Tier 1)** | Every session, automatically | Project overview, quick reference, key constraints, commands | Minimal (~500-1500 tokens) |
| **Warm (Tier 2)** | When specific domain activates | Specialized docs per module/feature area | Moderate |
| **Cold (Tier 3)** | On-demand via search/locator | Research docs, full specs, session history | Unlimited on disk |

**Implementation**:
- `CLAUDE.md` / `AGENTS.md` at repo root = Tier 1 (always loaded)
- Domain-specific docs in `docs/agents/` or subdirectory CLAUDE.md files = Tier 2
- Research documents, ADRs, full specs = Tier 3 (accessed via grep/search)

**Writing Effective Agent Docs**:
- Be precise and specific — vague specs produce vague output
- State constraints as enforceable rules, not suggestions
- Include the "why" so agents can handle edge cases intelligently
- Provide exact file paths, commands, and patterns — not "see the docs"
- Keep Tier 1 docs ruthlessly concise; link to Tier 2/3 for depth
- Update docs when agents encounter failures (living feedback loop)

### 2. Architectural Constraints

Constraining the solution space makes agents *more* productive by reducing token waste on dead ends. Instead of telling agents "write good code," mechanically enforce what good code looks like.

**Constraint Types** (from cheapest to most expensive):

1. **Type systems** — Enforce boundaries at compile time. Agents respect types well.
2. **Linters (deterministic)** — ESLint, Ruff, clippy, etc. Fast, cheap, catches most structural issues.
3. **Structural tests** — Tests that enforce architecture (dependency direction, import rules, module boundaries).
4. **Pre-commit hooks** — Gate commits on passing lint + tests.
5. **CI validation** — Stricter checks that run on PR (full test suite, coverage, security scans).
6. **LLM-based auditors** — A second agent reviewing the first agent's output for compliance with design docs.

**Dependency Layering Pattern**:
Define clear layers and enforce direction:
```
Types -> Config -> Repository -> Service -> Runtime -> UI
```
Agents operate only within assigned layers. Structural tests validate compliance mechanically.

**Custom Lints with Remediation Messages**: Because lints are custom, write the error messages to **inject remediation instructions into agent context**. When an agent hits a lint failure, the error message itself tells it how to fix the problem. This is one of the highest-leverage patterns — the lint becomes both the constraint and the teaching.

**Enforce Boundaries Centrally, Allow Autonomy Locally**: Care deeply about boundaries, correctness, and reproducibility. Within those boundaries, allow agents significant freedom in how solutions are expressed. The resulting code doesn't always match human stylistic preferences — and that's okay, as long as it's correct, maintainable, and legible to future agent runs.

**Key Principle**: Rules that are mechanically enforced (linters, type checks, CI) are worth 10x rules that are only documented. Agents will drift from documented rules over long sessions; they cannot drift from a failing CI check. When documentation falls short, **promote the rule into code**.

### 3. Entropy Management

Agents replicate patterns that already exist in the repo — even uneven or suboptimal ones. Over time, this inevitably leads to drift. OpenAI's team initially spent every Friday (20% of the week) manually cleaning up "AI slop." That didn't scale.

**The "Garbage Collection" Approach**: Treat entropy management like garbage collection — continuous small increments rather than painful bursts. Technical debt is a high-interest loan; pay it down daily.

**Golden Principles**: Encode opinionated, mechanical rules that keep the codebase legible and consistent for future agent runs. Examples from OpenAI:
- Prefer shared utility packages over hand-rolled helpers (centralizes invariants)
- Don't probe data "YOLO-style" — validate boundaries or rely on typed SDKs
- Prefer "boring" technologies (composable, stable APIs, well-represented in training data)
- When an upstream library is opaque, sometimes reimplementing a subset is cheaper than fighting it

**Entropy Agents** (run on a recurring cadence):
- **Doc-gardening agent**: Scans for stale/obsolete documentation that doesn't reflect real code behavior, opens fix-up PRs
- **Constraint violation scanner**: Finds violations that slipped past initial checks
- **Quality grading agent**: Updates `QUALITY_SCORE.md` — grades each domain/layer, tracks gaps over time
- **Deduplication agent**: Prevents re-implementing existing functionality
- **Pattern enforcement agent**: Identifies deviations from established patterns, opens targeted refactoring PRs

Most of these PRs can be reviewed in under a minute and automerged. Human taste is captured once, then enforced continuously on every line of code.

**Practical Entropy Prevention**:
- Run linters on every commit, not just PRs
- Schedule periodic cleanup sweeps (daily or per-sprint)
- Track architectural metrics (coupling, cyclomatic complexity) and alert on drift
- When a review comment identifies a recurring issue, encode it as a lint rule or documentation update — don't just fix the one instance

### 4. Structured Execution

Separate thinking from doing. The research-plan-implement-verify sequence prevents agents from diving into code before understanding the problem.

**The Sequence**:
1. **Research** — Analyze codebase, document existing patterns, identify entry points and dependencies
2. **Plan** — Decompose into structured tasks with explicit dependencies. *Reviewing a plan is faster than reviewing code.*
3. **Implement** — Execute tasks in dependency order; parallelize independent work
4. **Verify** — Automated tests, linters, CI validation; human review gates between phases

**Human-in-the-Loop Gates**:
- Review research before spec generation
- Review spec/plan before implementation begins
- Review completed work before merge
- Catch mistakes at the planning stage — orders of magnitude cheaper than after code generation

**Task Decomposition**:
```json
[
  {"id": "#1", "content": "Add auth middleware", "status": "pending", "blockedBy": []},
  {"id": "#2", "content": "Create login endpoint", "status": "pending", "blockedBy": ["#1"]},
  {"id": "#3", "content": "Add integration tests", "status": "pending", "blockedBy": ["#2"]}
]
```
Explicit dependencies prevent race conditions in parallel agent execution and enable resumption if work is interrupted.

## Agent Legibility

From the agent's point of view, anything it can't access in-context while running **effectively doesn't exist**. Knowledge that lives in Google Docs, chat threads, or people's heads is invisible. Repository-local, versioned artifacts are all it can see.

**Push context into the repo**: That Slack discussion that aligned the team on an architectural pattern? If it isn't discoverable to the agent, it's illegible — just like it would be unknown to a new hire joining three months later. Encode decisions as markdown, ADRs, or code comments in the repo.

**Make the application itself legible to agents**:
- **Per-worktree app instances**: Let agents boot and drive one instance per change, isolated from other work
- **Browser automation**: Wire Chrome DevTools Protocol (or Playwright) so agents can take DOM snapshots, screenshots, navigate the UI, reproduce bugs, and validate fixes
- **Local observability stack**: Expose logs, metrics, and traces per-worktree. Agents query with LogQL/PromQL. Prompts like "ensure service startup completes in under 800ms" become tractable when agents can measure the result
- **Tear down after task**: Ephemeral observability stacks get cleaned up when the task completes

**Favor agent-legible dependencies**: Technologies often described as "boring" tend to be easier for agents to model — composable, stable APIs, well-represented in training data. Favor dependencies and abstractions that can be fully internalized and reasoned about in-repo.

## Agent Specialization

A focused agent with restricted tools outperforms a general-purpose agent with full access.

**Why Specialize**:
- Reduced irrelevant context keeps each agent in the smart zone
- Clear boundaries prevent unsolicited refactoring or scope creep
- Parallel execution becomes safer when each agent's blast radius is contained

**Specialization Patterns**:
- **Read-only researchers**: Explore codebase, produce analysis docs. No write tools.
- **Planners**: Create task breakdowns and specs. Read + plan tools only.
- **Workers**: Implement specific tasks. Scoped to relevant files/modules.
- **Reviewers/verifiers**: Check output against spec. Read + test tools only.
- **Documentarians**: Explain code. Never suggest improvements.

**Schema-Level Constraints > Runtime Checks**: Remove unavailable tools from the agent's schema entirely, rather than checking permissions at runtime. An agent that never *sees* a write tool won't attempt writes — this is more reliable than blocking attempts after the fact.

## Scaling Patterns

| Codebase Size | Approach |
|---------------|----------|
| < 10K LOC | Single agent with full context; simple CLAUDE.md |
| 10K-50K LOC | Research + planning + implementation with human gates |
| 50K-100K+ LOC | Parallel specialized agents with persistent memory and tiered context |

As the codebase grows, evolve from a single general-purpose agent to a specialized team. Each specialization reduces irrelevant context and focuses attention.

## Implementation Levels

### Level 1: Individual (1-2 hours)
- [ ] Create `CLAUDE.md` / `AGENTS.md` with project overview, key commands, architecture summary
- [ ] Ensure linter + formatter are configured and runnable
- [ ] Verify test suite runs with a single command
- [ ] Organize directory structure with clear module boundaries

### Level 2: Team (1-2 days)
- [ ] Add subdirectory-level agent docs for complex modules
- [ ] CI enforces lint, type-check, and tests on every PR
- [ ] Document architectural constraints as enforceable rules (not just prose)
- [ ] Create PR checklist / template that agents can follow
- [ ] Move tribal knowledge from Slack/Confluence into repo docs

### Level 3: Production (1-2 weeks)
- [ ] Tiered context architecture (hot/warm/cold)
- [ ] Specialized sub-agents with scoped tool access
- [ ] Entropy management agents running on schedule
- [ ] Observability integration (agents use telemetry to debug)
- [ ] Harness versioning and performance dashboards

## The Feedback Loop Philosophy

When something fails, the fix is almost never "try harder." Instead, ask: **"what capability is missing, and how do we make it both legible and enforceable for the agent?"**

When agents struggle, treat it as a signal — identify what's missing (tools, guardrails, documentation) and feed it back into the repository, ideally by having agents write the fix. Human taste is fed back into the system continuously: review comments, refactoring PRs, and user-facing bugs are captured as documentation updates or encoded directly into tooling.

**The autonomy ladder** — as you encode more of the development loop, agents can handle progressively more:
1. Implement a fix from a well-scoped prompt
2. Reproduce a bug, implement and validate the fix
3. Record before/after videos demonstrating the issue and resolution
4. Open a PR, respond to feedback, iterate until reviewers are satisfied
5. Detect and remediate build failures autonomously
6. Escalate to humans only when judgment is required
7. Merge the change

Each rung requires more harness investment (testing, validation, review automation, feedback handling, recovery). Don't skip rungs.

## Common Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|--------------|-----|
| **1000-page instruction manual** | Blows past 40% context utilization | Give agents a map, not an encyclopedia. Tier your docs. |
| **Vague documentation** | "Follow best practices" produces random output | Be specific: exact files, patterns, commands, constraints |
| **No feedback loops** | Agents can't self-correct without verification signals | Add tests, linters, CI checks that agents can run |
| **Human-only knowledge** | Decisions in Slack/meetings are invisible to agents | Write decisions into the repo (ADRs, CLAUDE.md, code comments) |
| **Static harness** | Model capabilities change; harness must evolve | Review and update harness quarterly or when switching models |
| **Over-engineering control flow** | Complex orchestration breaks when models improve | Build rippable systems; prefer simple constraints over elaborate pipelines |
| **No entropy management** | Agent output drifts from patterns over time | Schedule periodic audits; track architectural metrics |

## Auditing an Existing Repo

When asked to audit agent-readiness, check these areas (see `references/audit-checklist.md` for the full checklist):

1. **Documentation**: Does CLAUDE.md/AGENTS.md exist? Is it accurate and concise?
2. **Constraints**: Are linters, formatters, type-checkers configured and in CI?
3. **Tests**: Can the full suite run with one command? Is coverage meaningful?
4. **Architecture**: Are module boundaries clear? Are dependencies enforced?
5. **Context**: Is critical knowledge in the repo, or trapped in external tools?
6. **Feedback loops**: Can agents verify their own output before requesting review?

For each gap found, recommend the cheapest fix that provides the most constraint value.

## Further Reading

**Bundled references**:
- `references/audit-checklist.md` — Detailed audit checklist with scoring (12 areas, 0-24 scale)
- `references/agents-md-patterns.md` — Patterns, templates, and extraction hierarchy for AGENTS.md/CLAUDE.md files

**Source articles** (this skill synthesizes these):
- OpenAI: "Harness engineering: leveraging Codex in an agent-first world" (Feb 2026)
- OpenAI: "Custom instructions with AGENTS.md" (developers.openai.com)
- OpenAI: "Building an AI-Native Engineering Team" (developers.openai.com)
- Martin Fowler: "Harness Engineering" (martinfowler.com)
- Alex Lavaee: "How to Harness Coding Agents with the Right Infrastructure"
- Vasilopoulos et al: "Building AI Coding Agents for the Terminal" (arxiv, 2026)

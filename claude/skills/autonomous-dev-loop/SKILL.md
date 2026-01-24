---
description: Use when running fully autonomous development loops, building features without user intervention, or working in continuous iteration mode
---

# Everything Loop

A fully autonomous software development system combining self-referential loop mechanism with structured TDD workflow.

## Overview

Everything Loop enables Claude to work autonomously on software projects through continuous iteration until completion. It uses a **two-level loop system**:

- **Outer Loop**: Project planning, backlog management, feature prioritization
- **Inner Loop**: Feature implementation using TDD (7 phases)

## Commands

| Command | Description |
|---------|-------------|
| `/everything <description> [flags]` | Start autonomous development |
| `/everything-status` | Check current status |
| `/everything-cancel` | Cancel and cleanup |

### Flags

- `--fixed-scope`: All features defined upfront, exits when all complete
- `--continuous`: (default) Generates new work when backlog empty
- `--max-iterations N`: Maximum iterations before auto-stop (default: 100)
- `--parallel`: Enable parallel feature development (experimental)

## How It Works

### Stop Hook Mechanism

The plugin uses a Stop hook that intercepts Claude's exit attempts:

1. Reads current state from markdown files
2. Checks completion conditions
3. If not complete: blocks exit, increments iteration, re-injects appropriate prompt
4. If complete: allows exit, cleans up state

### State Files

All state persists to markdown files in `state/` directory (survives auto-compact):

- `{session_id}-project.md` - Project configuration and current state
- `{session_id}-backlog.md` - Feature backlog with status tracking
- `{session_id}-decisions.md` - Autonomous decisions with rationale
- `{session_id}-feature-{id}.md` - Per-feature implementation state

## Workflow

### Outer Loop Phases

```text
PLANNING -> FEATURE_SELECTION -> [inner loop] -> PLANNING...
```

1. **Planning**: Break requirements into features, create backlog
2. **Feature Selection**: Pick next feature based on priority/dependencies
3. **Delegate**: Hand off to inner loop for implementation
4. **Return**: After feature complete, back to planning for next

### Inner Loop Phases (Per Feature)

```text
DISCOVERY -> EXPLORATION -> CLARIFICATION -> ARCHITECTURE -> IMPLEMENTATION -> REVIEW -> COMPLETE
```

1. **Discovery**: Parse feature requirements from backlog
2. **Exploration**: Launch code-explorer agents to understand codebase
3. **Clarification**: Make all decisions autonomously (NO user questions)
4. **Architecture**: Design implementation approach via code-architect agents
5. **Implementation**: TDD cycle - write tests first, implement until green
6. **Review**: Parallel review with code-reviewer and red-team-agent
7. **Complete**: Update backlog, return to outer loop

## Agents

### Exploration and Design

| Agent | Purpose | Model |
|-------|---------|-------|
| code-explorer | Deep codebase analysis, trace execution paths | sonnet |
| code-architect | Design architecture blueprints, decisive choices | sonnet |

### Quality and Review

| Agent | Purpose | Model |
|-------|---------|-------|
| code-reviewer | Quality review, confidence >= 80 threshold | sonnet |
| red-team-agent | Security/adversarial review, edge cases | opus |

### Autonomous Decision Making

| Agent | Purpose | Model |
|-------|---------|-------|
| requirements-analyst | Autonomous requirement decisions | opus |
| test-architect | TDD test strategy before implementation | sonnet |
| work-generator | Generate work for continuous projects | opus |

## Key Principles

### Autonomous Decisions

Everything Loop makes ALL decisions autonomously. It NEVER asks the user questions during execution. All decisions are documented in the decisions log with:

- The decision made
- Alternatives considered
- Confidence score (0-100)
- Rationale

### TDD Mandatory

Every feature must:

1. Have test strategy designed by test-architect
2. Write failing tests FIRST
3. Implement until tests pass
4. Achieve >= 80% coverage
5. Pass code-reviewer audit of test quality

### Quality Gates

Code cannot proceed to completion without:

- All review agents returning confidence >= 80
- No critical issues from red-team-agent
- Tests passing with adequate coverage

## Completion Conditions

The loop exits when:

- **Fixed scope**: All features marked complete (outputs `<promise>ALL_FEATURES_DONE</promise>`)
- **Continuous**: max_iterations reached
- **Any time**: User runs `/everything-cancel`

## User Settings

Customize defaults via `.local.md` files (YAML frontmatter):

**Locations** (project-level overrides global):
- `.claude/everything-loop.local.md` - project settings
- `~/.claude/everything-loop.local.md` - global settings

**Available Settings**:

```yaml
---
default_project_type: continuous    # "fixed" or "continuous"
default_max_iterations: 100         # 0 = unlimited
default_parallel: false             # parallel feature development
review_confidence_threshold: 80     # code review quality gate
tdd_coverage_target: 80             # test coverage percentage
auto_generate_work: true            # work-generator in continuous mode
---
```

Command-line flags always override settings.

## Example Usage

```bash
# Build a complete feature set (fixed scope)
/everything "Build a user authentication system with login, signup, password reset, and session management" --fixed-scope

# Continuous improvement mode
/everything "Improve test coverage and code quality across the codebase" --continuous --max-iterations 50

# Check progress
/everything-status

# Stop early
/everything-cancel
```

## Troubleshooting

### Loop not continuing

Check:

1. Session ID is available (`$CLAUDE_SESSION_ID`)
2. State files exist in `state/` directory
3. Hook is registered in `hooks/hooks.json`

### State corrupted

If state files become corrupted:

1. Run `/everything-cancel` to cleanup
2. Start fresh with `/everything`

### Max iterations reached unexpectedly

Increase with `--max-iterations N` flag, or the loop may be stuck. Check the decisions log for patterns.

## Acceptance Checks

- [ ] User invoked `/everything` with a description
- [ ] State files created in `state/` directory
- [ ] Stop hook registered and blocking exits appropriately
- [ ] Outer loop cycles through PLANNING -> FEATURE_SELECTION -> inner loop
- [ ] Inner loop follows 7-phase TDD workflow
- [ ] All decisions logged with confidence scores
- [ ] Quality gates enforced (confidence >= 80, tests passing)
- [ ] Loop exits correctly based on completion conditions

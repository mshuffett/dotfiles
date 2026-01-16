---
description: Start fully autonomous software development with continuous iteration
argument-hint: <description> [--fixed-scope|--continuous] [--max-iterations N] [--parallel]
---

# Everything Loop - Autonomous Development

You are starting an **Everything Loop** - a fully autonomous software development session that will continuously iterate until completion.

## Arguments Received

$ARGUMENTS

## Check for Local Settings

Before parsing arguments, check for user settings files (command-line flags override these):

1. **Project-level**: `.claude/everything-loop.local.md` (in current working directory)
2. **Global**: `~/.claude/everything-loop.local.md`

If found, read YAML frontmatter for defaults:
- `default_project_type`: "fixed" or "continuous"
- `default_max_iterations`: number
- `default_parallel`: boolean
- `review_confidence_threshold`: number (0-100)
- `tdd_coverage_target`: number (percentage)

## Parse Arguments

Extract from the arguments (flags override local settings):
- **description**: The project/feature description (everything before flags)
- **project_type**: `fixed` (--fixed-scope) or `continuous` (--continuous, default from settings or "continuous")
- **max_iterations**: Number from --max-iterations (default from settings or 100)
- **parallel_enabled**: true if --parallel flag present (default from settings or false)

## Session Setup

**Session ID**: ${CLAUDE_SESSION_ID}

**State Directory**: ${CLAUDE_PLUGIN_ROOT}/state/

## Initialize State Files

### 1. Create Project State File

Create `state/${CLAUDE_SESSION_ID}-project.md`:

```yaml
---
session_id: "${CLAUDE_SESSION_ID}"
project_type: "<fixed|continuous>"
iteration: 1
max_iterations: <N>
completion_promise: "ALL_FEATURES_DONE"
current_loop: "outer"
current_phase: "planning"
active_feature_id: ""
parallel_enabled: <true|false>
# Quality settings (from local settings or defaults)
review_confidence_threshold: 80
tdd_coverage_target: 80
---
# Project: <Title from description>

## Description
<Full project description>

## Requirements
<Parsed requirements from description>

## Constraints
<Any constraints mentioned>
```

### 2. Create Backlog File

Create `state/${CLAUDE_SESSION_ID}-backlog.md`:

```yaml
---
total_features: 0
completed_features: 0
---
# Feature Backlog

## In Progress

## Ready

## Blocked

## Completed

---

## Assumptions Log
_Decisions made autonomously during development_

## Improvements Backlog
_Ideas discovered during development for future work_
```

### 3. Create Decisions Log

Create `state/${CLAUDE_SESSION_ID}-decisions.md`:

```yaml
---
total_decisions: 0
---
# Autonomous Decisions Log

All decisions made without user input are documented here with rationale.

## Decisions

```

## Your Task

1. **Parse the arguments** to extract description, project_type, max_iterations, parallel_enabled
2. **Create all three state files** with proper YAML frontmatter
3. **Use TodoWrite** to create initial task list:
   - Parse project requirements
   - Break down into features
   - Create feature backlog
   - Begin first feature

4. **Start the outer loop** by analyzing the project description and creating an initial feature backlog

## Loop Behavior

Once you complete this initial setup and your first actions, the **Stop Hook** will intercept your exit and feed you the next prompt based on current state. This continues until:

- **Fixed scope**: All features marked complete → output `<promise>ALL_FEATURES_DONE</promise>`
- **Continuous**: max_iterations reached OR `/everything-cancel` called
- **Any time**: Output `<promise>ALL_FEATURES_DONE</promise>` when genuinely complete

## Critical Rules

1. **NO USER QUESTIONS** - Make all decisions autonomously and document them
2. **TDD MANDATORY** - Write tests before implementation
3. **QUALITY GATES** - Code review confidence >= 80 before completion
4. **DOCUMENT EVERYTHING** - All decisions in decisions log
5. **STATE IS TRUTH** - Always read state files before acting

## Begin Now

Parse the arguments and create the state files. Then begin analyzing the project requirements to create your feature backlog.

Good luck. You've got this.

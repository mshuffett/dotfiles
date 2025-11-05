---
description: Consult OpenAI Codex (GPT-5) for extended reasoning on hard problems
allowed-tools: Bash(codex exec:*)
argument-hint: <task description>
---

# Deep Reasoning Consultation with OpenAI Codex

You are consulting OpenAI Codex (GPT-5 high thinking) for extended reasoning.

## When to Use This
- Claude Code has tried 3+ approaches without success
- User explicitly says: "stumped", "stuck", "ask codex", "consult gpt-5"
- Complex architectural decisions requiring deep analysis
- User explicitly invokes this command

## Task

**Problem**: $ARGUMENTS

## Context

CLAUDE.md contains all project invariants and patterns. Apply those rules to any solution Codex suggests.

## Execution

Run Codex consultation:

!`codex exec --full-auto "$ARGUMENTS"`

## After Codex Responds

1. **Synthesize insights** from Codex's response
2. **Apply to our codebase** following project invariants
3. **Verify solution** with tests
4. **Document any new patterns** discovered for memory files

## Output Format

Provide:
- **Summary**: What Codex suggested
- **Application**: How you're applying it to our code
- **Verification**: Test results and proof it works
- **Learnings**: Any patterns to document in memory

Execute the consultation now.

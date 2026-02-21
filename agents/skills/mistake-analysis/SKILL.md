---
name: mistake-analysis
description: Use when analyzing failures or performing root cause analysis. Covers immediate response, escalation, RCA framework, severity, prevention strategy, and subagent validation.
---

# Mistake Analysis Protocol

When a mistake occurs, follow this protocol to ensure proper understanding and prevention.

**Related skills**:
- `mistake-tracking` — logging JSONL events, promote/demote guardrails
- Project-level `mistakes` skill — catalog of known anti-patterns for the current repo

## Immediate Response
1. **Stop and acknowledge** the mistake
2. **Consider escalation** — should I ask for clarification before proceeding?
3. **Document the immediate context** before it's lost
4. **Identify the impact** — what was affected?

## Escalation Guidelines

### When to Escalate Immediately
- **Uncertain about requirements**: If interpretation could go multiple ways
- **Missing critical knowledge**: If you need information not in documentation
- **High-risk changes**: If the change could break existing functionality
- **Architectural decisions**: If the approach affects system design

### How to Escalate
Instead of guessing or making assumptions:
```
"I notice [specific issue/uncertainty]. Before proceeding, could you clarify:
- [Specific question 1]
- [Specific question 2]
This will help me avoid [potential mistake]."
```

## Root Cause Analysis

### 1. Chain of Events
Document the sequence that led to the mistake:
- What was the initial request/task?
- What assumptions were made?
- What decisions led to the error?
- What information was missing or misunderstood?

### 2. Categories of Mistakes

#### Knowledge Gaps
- **Missing Information**: Didn't know about existing functionality/file
- **Outdated Information**: Used deprecated patterns or old approaches
- **Domain Knowledge**: Lacked understanding of the technology/framework

#### Decision Errors
- **Wrong Assumption**: Made incorrect assumption instead of verifying
- **Poor Judgment**: Chose suboptimal approach despite having information
- **Skipped Verification**: Didn't test or check before proceeding
- **Over-confidence**: Proceeded without adequate caution

#### Process Failures
- **Skipped Steps**: Missed important workflow steps (e.g., creating branch)
- **Tool Misuse**: Used wrong tool or used tool incorrectly
- **Pattern Violation**: Didn't follow established patterns
- **Context Loss**: Failed to maintain important context

#### Communication Failures
- **Misunderstood Intent**: Interpreted request incorrectly
- **Didn't Clarify**: Failed to ask for clarification when needed
- **Incomplete Response**: Didn't fully address the request

### 3. Mistake Severity
Rate the mistake's severity:
- **Critical**: Could cause data loss, security issues, or major breakage
- **High**: Breaks functionality or violates important patterns
- **Medium**: Causes inconvenience or requires rework
- **Low**: Minor issue with minimal impact

### 4. Prevention Strategy
For each mistake, determine:
- Could existing memories have prevented this?
- What new memory/check would prevent recurrence?
- Should this trigger earlier escalation in similar situations?
- Is this a one-off or systematic issue?

#### Escalation Triggers to Add
Based on the mistake, add escalation rules like:
- "When seeing pattern X, always ask about Y first"
- "Before modifying Z, always verify approach"
- "If unsure about A vs B, escalate for clarification"

## After Analysis: Log and Route

Once RCA is complete, **log the event** via `mistake-tracking` and **route prevention** using `memory-placement`:

1. **Log**: Append a JSONL event to `<repo>/logs/mistakes.jsonl` (or `~/.claude/mistakes.jsonl` for global)
2. **Route prevention** (aligned with `mistake-tracking` escalation ladder):
   - First occurrence → improve or create the relevant skill
   - First recurrence → strengthen skill and add anti-miss cues
   - 2+ in same repo (14 days) → Hot Rule in repo's CLAUDE.md
   - 2+ repos (14 days) → universal guardrail in root CLAUDE.md
   - 14-30 quiet days → propose removing one-liners; skill remains canonical

## Testing Prevention

### Subagent Validation
Before finalizing the prevention strategy:

1. **Create test prompt** that reproduces the original scenario
2. **Update relevant skill files** with prevention info
3. **Launch subagent** with the test prompt:
   ```
   Task: "Test if the following scenario would trigger the mistake: [scenario]
   Check available skills and follow all protocols.
   Report what action you would take."
   ```
4. **Verify** the subagent avoids the mistake

## Continuous Improvement
- Review `logs/mistakes.jsonl` periodically for patterns
- Consolidate repeated mistakes into core principles
- Remove outdated mistakes after successful prevention period

## Acceptance Checks

- [ ] Chain of events documented
- [ ] Root cause categorized (knowledge gap, decision error, process failure, communication failure)
- [ ] Severity assessed
- [ ] Prevention strategy defined with routing target
- [ ] JSONL event logged via `mistake-tracking`
- [ ] Prevention tested via subagent if high severity

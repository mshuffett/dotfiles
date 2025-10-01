---
description: Start continuous Claude runner with periodic check-ins
---

# Continuous Runner Command

First, read the full documentation:

@~/.claude/docs/continuous-runner.md

After reading that documentation, you MUST follow this protocol:

## Protocol (MANDATORY)

1. **Explain what will happen**:
   - "I'll start the continuous runner in background mode"
   - "It will send auto-check-ins every 3 minutes to keep this session active"
   - "Logs will be saved to claude_continuous.log"
   - "Runtime stats will be tracked"

2. **Ask for explicit approval**:
   - "Should I start the continuous runner? (yes/no)"
   - WAIT for user response
   - Only proceed if user says "yes", "go", "start", or similar affirmative

3. **If user says NO**:
   - Explain how they can start it manually
   - Show the command: `nohup claude-continuous background "" "" 180 start > /dev/null 2>&1 &`
   - Do NOT run anything

4. **If user says YES**:
   - Run: `nohup claude-continuous background "" "" 180 start > /dev/null 2>&1 &`
   - Confirm it started with the PID
   - Remind them: "View logs with: tail -f claude_continuous.log"

## IMPORTANT RULES

- **NEVER run without explicit "yes"** - This is a long-running background process
- **ALWAYS ask first** - Even if user seems to be requesting it
- **NEVER assume approval** - User must explicitly confirm
- **Background mode by default** - Unless user specifically asks for new-session mode

This ensures user is always in control of long-running processes.

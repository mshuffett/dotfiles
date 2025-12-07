---
name: Port Safety
description: Use when about to kill a process on a port, when a port is busy and you need to free it, or when suspecting a dev server is still running. Prevents accidentally killing user's processes.
version: 0.1.0
---

# Port Safety Protocol

IMPORTANT: Never kill a process running on a port unless you started it yourself or have explicit permission from the user.

## When This Applies
- A port is busy and you need to free it
- You suspect a dev server is still running
- Any `kill` or `lsof -i` followed by kill operation

## Acceptance Checks
- [ ] Process identified with `lsof -i :<PORT>` (PID and command noted)
- [ ] If you did not start the process, explicit permission obtained from the user
- [ ] If you started it, safe to terminate confirmed

## Safe Workflow

1. **Check if you started it** — Did you run the process in this session?
2. **If you didn't start it** — Ask the user for explicit permission before killing it.
3. **Never assume** — Just because a port is in use doesn't mean it's safe to kill.

## How to Check What's Running

```bash
lsof -i :<PORT>
```

Report to the user what process is using the port. Wait for explicit permission to kill it.

## Examples

**Acceptable** (no permission needed):
- You started `pnpm run dev` on port 5173 — you can kill it later without asking.

**Requires permission**:
- Port 3000 is busy; identify process and ask user before terminating.
- Any process you didn't start in this session.

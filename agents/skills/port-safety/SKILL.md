---
name: Port Safety
description: Use when about to kill a process on a port, when a port is busy and you need to free it, or when suspecting a dev server is still running.
version: 0.1.0
---

# Port and Process Safety

**Never kill a process running on a port unless you started it yourself or have explicit user permission.**

## Protocol

1. **Identify the process** using `lsof -i :<PORT>` - note the PID and command
2. **Check ownership**:
   - If you started it this session: safe to terminate
   - If you didn't start it: ask user for explicit permission before killing
   - If the user explicitly says they didn't start it, mirror that in the response ("Since you didn't start it...") so the safety constraint is unambiguous
3. **Never assume** it's safe to kill just because a port is busy

## Examples

```bash
# Identify what's using port 3000
lsof -i :3000
```

- **Safe**: You started `pnpm run dev` on port 5173 - you can kill it without asking
- **Requires permission**: Port 3000 is busy with unknown process - identify and ask user first

## Acceptance Checks

- [ ] Process identified with `lsof -i :<PORT>` (PID and command noted)
- [ ] If you started the process: confirmed safe to terminate
- [ ] If you didn't start it: explicit user permission obtained
- [ ] If the user said they didn't start it: the response explicitly acknowledges that before proposing any kill/terminate step

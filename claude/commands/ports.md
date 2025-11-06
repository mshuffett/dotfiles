---
description: Safe protocol for managing processes on ports; requires explicit permission before killing processes you didn’t start.
---

# Port and Process Management

IMPORTANT: Never kill a process running on a port unless you started it yourself or have explicit permission from the user.

Protocol:
1. If you need to stop a process on a port:
   - First check if you started it in this session.
   - If you didn't start it, ask the user for explicit permission before killing it.
   - Never assume it's safe to kill a process just because a port is in use.

2. When checking for processes on ports:
   - Use `lsof -i :<PORT>` or similar to identify what's running.
   - Report to the user what process is using the port.
   - Wait for explicit permission to kill it.

Examples:
- Acceptable: You started `pnpm run dev` on port 5173 — you can kill it later without asking.
- Requires permission: Port 3000 is busy; identify process and ask user before terminating.


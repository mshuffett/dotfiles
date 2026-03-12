---
name: tmux-worktree-session
description: Use when creating or switching to a git worktree inside tmux while keeping session continuity. Supports codex and claude by auto-detecting the current session and launching resume, fork, or new sessions in a split pane.
---

# Tmux Worktree Session

Use this skill when the user wants to:
- create a worktree from an active session without losing context
- split tmux and continue in the new worktree
- resume or fork Codex or Claude session state in the new pane

## Command

Use global command `wts` from any git repo.

```bash
wts <name> [options]
```

## Defaults

- worktree path: sibling directory `../<repo>.worktrees/<name-with-slashes-replaced>`
- split orientation: horizontal
- mode: `resume`
- agent: `auto` (detects `codex` or `claude` from env/pane process)

## Common Flows

1. Resume current session in a new worktree pane:

```bash
wts feature/my-task
```

2. Fork instead of resume:

```bash
wts feature/my-task --mode fork
```

3. Start a fresh session:

```bash
wts feature/my-task --mode new
```

4. Preview without changes:

```bash
wts feature/my-task --dry-run
```

## Key Options

- `--agent auto|codex|claude`
- `--mode resume|fork|new`
- `--orientation h|v`
- `--branch <branch-name>`
- `--base <base-branch>`
- `--copy-env` (copy `.env*` from main repo to new worktree)
- `--no-create` (error if worktree does not exist)
- `--no-select` (leave cursor in original pane)

## Safety Notes

- Run inside tmux only.
- Keep sibling worktrees to avoid nested instruction-file recursion issues.
- Avoid driving the exact same resumed session in two panes at once.

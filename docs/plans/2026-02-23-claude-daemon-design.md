# Claude Daemon (`cq`) Design

**Date:** 2026-02-23
**Status:** approved

## Problem

Claude Code has ~3-5s cold start latency per invocation. For quick questions this is annoying.

## Solution

A pre-warm daemon that keeps a Claude Code process spawned and ready. Questions are instant because the process is already initialized.

## Architecture

```
┌──────────┐    Unix Socket     ┌──────────────┐   stdin (stream-json)   ┌─────────────────┐
│  cq CLI  │ ────────────────→  │  daemon      │ ──────────────────────→ │ claude -p        │
│ (client) │ ←──────────────── │  (bun)       │ ←────────────────────── │ --stream-json    │
└──────────┘    streamed text   └──────────────┘   stdout (stream-json)  └─────────────────┘
```

### Pre-warm Pattern

1. Daemon spawns Claude process on startup → process loads configs, MCP servers, connects to API, waits for stdin
2. Question arrives → daemon writes to warm process stdin → streams response to client
3. Response complete → process hangs (known issue #25629) → daemon kills it
4. Daemon pre-spawns fresh process → ready for next question
5. Session continuity via `--resume <session-id>`

### Components

**Single file: `bin/cq`** (Bun/TypeScript)

- `cq <question>` — send question, stream answer to stdout
- `cq --start` — start daemon in background
- `cq --stop` — stop daemon
- `cq --status` — check if running
- `cq --restart` — fresh context
- `cq --daemon` — internal, run daemon in foreground

### State

```
~/.claude/daemon/
  daemon.sock     # Unix socket
  daemon.pid      # daemon PID
  daemon.log      # logs
  session-id      # current session UUID for --resume
```

### Socket Protocol

```
Client → Daemon:  {"type":"question","content":"..."}\n
Daemon → Client:  {"type":"text","content":"..."}\n  (streaming chunks)
Daemon → Client:  {"type":"done"}\n
Daemon → Client:  {"type":"error","content":"..."}\n  (on failure)
```

### Key Decisions

- **Bun/TypeScript**: Matches existing CLI tools (claude-schedule.ts)
- **Pre-warm**: Hides startup latency by spawning next process while user reads previous answer
- **Accumulated context**: Questions build on each other via `--resume`
- **Single file**: `cq` is both client and daemon (--daemon flag for internal use)
- **stream-json**: Enables real-time streaming of response tokens to terminal

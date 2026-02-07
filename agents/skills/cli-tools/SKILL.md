---
name: CLI Tools
description: This skill should be used when the user asks to "create a CLI tool", "build a command line app", "add a dev command", "write a CLI script", or when editing files in ~/.dotfiles/bin/. Provides guidance on the preferred stack for building CLI tools.
---

# CLI Tools Development

Build CLI tools using Bun + citty for the optimal balance of developer experience and performance.

## Preferred Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Runtime | **Bun** | Fast startup (~13ms), TypeScript native, no compile step |
| CLI Framework | **citty** | Clean declarative API, auto-colored help, minimal |
| Alternative | **Rust + clap** | When startup time is critical (<2ms) or binary size matters |

## When to Use Each

**Bun + citty** (default):
- Personal dev tools
- Scripts that will be modified frequently
- When compile step is unwanted friction
- Commands that involve network calls (latency dwarfs startup)

**Rust + clap** (for special cases):
- Performance-critical CLIs run thousands of times
- Distribution to users (small binary, no runtime needed)
- When 1ms vs 13ms matters

## Citty Example

```typescript
#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: { name: "tool", version: "1.0.0", description: "Tool description" },
  args: {
    verbose: { type: "boolean", alias: ["v"], description: "Verbose output" },
  },
  subCommands: {
    start: defineCommand({
      meta: { description: "Start something" },
      run: async () => {
        console.log("Starting...");
      },
    }),
  },
  run: async ({ args }) => {
    // Default action when no subcommand
  },
});

runMain(main);
```

## Setup Pattern

For tools in `~/.dotfiles/bin/`:

1. Create the TypeScript file: `~/.dotfiles/bin/tool.ts`
2. Make executable: `chmod +x ~/.dotfiles/bin/tool.ts`
3. Create wrapper script `~/.dotfiles/bin/tool`:
   ```bash
   #!/bin/bash
   exec bun ~/.dotfiles/bin/tool.ts "$@"
   ```
4. Install citty globally: `bun add -g citty`

## Citty Features

- **Auto-colored help**: Commands and options highlighted automatically
- **Subcommands**: Use `subCommands` object for nested commands
- **Aliases**: `alias: ["v"]` for short flags
- **Types**: `boolean`, `string`, `number` for argument types
- **Default command**: The `run` function executes when no subcommand given

## Shell Integration with Bun

```typescript
import { $ } from "bun";

// Simple command
await $`ls -la`;

// Capture output
const { stdout } = await $`git status`.quiet();

// Handle errors without throwing
const result = await $`command`.nothrow();
if (result.exitCode !== 0) { /* handle */ }

// Spawn with stdin
const proc = Bun.spawn(["cmd"], { stdin: "pipe" });
proc.stdin.write(data);
proc.stdin.end();
await proc.exited;
```

## Benchmarks Reference

Measured on macOS ARM:

| Implementation | Startup Time |
|----------------|--------------|
| Bash | 1.1ms |
| Rust (clap) | 1.1ms |
| Bun native | 7.6ms |
| Bun + citty | 12ms |
| Bun + commander | 16ms |
| Python + typer | 80ms |

For tools involving network/disk I/O, the startup difference is negligible.

## Related Notes (Deep Dives)

- `agents/knowledge/atoms/claude-skill-archive/tmux-patterns/SKILL.md`
- `agents/knowledge/atoms/claude-skill-archive/terminal-images/SKILL.md`

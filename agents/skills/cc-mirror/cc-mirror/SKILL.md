---
name: cc-mirror
description: Create and manage isolated Claude Code variants with custom providers (Z.ai, Kimi, MiniMax, OpenRouter, Ollama, etc.) using cc-mirror. Use when the user wants to set up a new Claude Code instance, create an isolated Claude variant, switch providers, configure a cc-mirror variant, manage cc-mirror installations, or troubleshoot cc-mirror issues. Triggers on mentions of "cc-mirror", "claude variant", "isolated claude", "claude with openrouter/kimi/zai/minimax/ollama", or provider-specific Claude Code setups.
---

# cc-mirror

Create isolated Claude Code variants with custom LLM providers and themed branding.

## Quick Reference

```bash
# Interactive TUI
npx cc-mirror

# Fast setup (most common)
npx cc-mirror quick --provider <provider> --name <command-name>

# Full wizard
npx cc-mirror create

# Run a variant (after creation)
<command-name>
```

## Creating a Variant

### Fastest Path

```bash
# Mirror (standard Anthropic API, isolated config)
npx cc-mirror quick --provider mirror --name mclaude

# With a specific provider
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY" --name kimi
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" --name orclaude
npx cc-mirror quick --provider zai --api-key "$ZAI_API_KEY" --name zai
npx cc-mirror quick --provider ollama --api-key "ollama" --model-sonnet "qwen3-coder" --name local
```

### CLI Options

| Flag | Purpose |
|------|---------|
| `--provider <name>` | Provider preset (see references/providers.md) |
| `--name <name>` | CLI command name for the variant |
| `--api-key <key>` | Provider authentication key |
| `--base-url <url>` | Custom API endpoint |
| `--model-sonnet <id>` | Override Sonnet model mapping |
| `--model-opus <id>` | Override Opus model mapping |
| `--model-haiku <id>` | Override Haiku model mapping |
| `--brand <preset>` | Theme preset |
| `--no-tweak` | Skip theming |
| `--no-prompt-pack` | Skip provider-specific prompts |
| `--claude-version <v>` | `stable`, `latest`, or pinned (e.g., `2.1.37`) |
| `--verbose` | Show full output |

## Managing Variants

```bash
# List all variants
npx cc-mirror list

# Update a specific variant
npx cc-mirror update <name>

# Update all variants
npx cc-mirror update

# Pin Claude Code version
npx cc-mirror update <name> --claude-version 2.1.37

# Re-apply theme
npx cc-mirror apply <name>

# Customize theme
npx cc-mirror tweak <name>

# Remove a variant
npx cc-mirror remove <name>

# Health check
npx cc-mirror doctor
```

## File Layout

Each variant is fully isolated under `~/.cc-mirror/`:

```
~/.cc-mirror/
├── <variant-name>/
│   ├── native/          # Claude Code installation
│   ├── config/          # API keys, sessions, MCP servers
│   ├── tweakcc/         # Theme customization
│   └── variant.json     # Metadata
```

Binaries go to `~/.local/bin/` (macOS/Linux).

## Troubleshooting

- **Variant won't start**: Run `npx cc-mirror doctor` to check health
- **Provider auth fails**: Verify API key with `--verbose` flag
- **Theme not applied**: Re-apply with `npx cc-mirror apply <name>`
- **Version mismatch**: Pin version with `--claude-version <version>`

## Resources

For the full list of supported providers, models, and auth methods, see [references/providers.md](references/providers.md).

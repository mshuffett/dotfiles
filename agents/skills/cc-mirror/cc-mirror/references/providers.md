# cc-mirror Providers

## Provider Table

| Provider | Key | Default Models | Auth |
|----------|-----|---------------|------|
| `mirror` | Mirror Claude | Direct Anthropic API models | OAuth or API key |
| `kimi` | Kimi | kimi-for-coding | API Key |
| `minimax` | MiniMax | MiniMax-M2.5 | API Key |
| `zai` | Z.ai | GLM-5, GLM-4.7, GLM-4.5-Air | API Key |
| `openrouter` | OpenRouter | 100+ models (map via flags) | Auth Token |
| `vercel` | Vercel AI Gateway | Multi-provider | Auth Token |
| `ollama` | Ollama | Local models (qwen3-coder, etc.) | `"ollama"` as key |
| `nanogpt` | NanoGPT | Claude Code endpoint | Auth Token |
| `ccrouter` | CCRouter | Ollama, DeepSeek, etc. | Optional |
| `gatewayz` | GatewayZ | Multi-provider gateway | Auth Token |

## Provider Setup Examples

### Mirror (isolated standard Claude)
```bash
npx cc-mirror quick --provider mirror --name mclaude
```
Uses standard Anthropic API. Good for isolating config/sessions without changing models.

### Kimi
```bash
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY" --name kimi
```

### Z.ai
```bash
npx cc-mirror quick --provider zai --api-key "$ZAI_API_KEY" --name zai
```

### OpenRouter (custom model mapping)
```bash
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --model-sonnet "anthropic/claude-sonnet-4-20250514" \
  --model-haiku "anthropic/claude-haiku-3.5" \
  --name orclaude
```

### Ollama (local models)
```bash
npx cc-mirror quick --provider ollama --api-key "ollama" \
  --model-sonnet "qwen3-coder" --name local
```

### MiniMax
```bash
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY" --name minimax
```

### Custom base URL (any OpenAI-compatible endpoint)
```bash
npx cc-mirror quick --provider mirror --name custom \
  --base-url "https://my-proxy.example.com/v1" \
  --api-key "$MY_KEY"
```

## Theme Presets

Each provider includes branded terminal themes:

| Provider | Theme Colors |
|----------|-------------|
| kimi | Teal/cyan gradient |
| minimax | Coral/red/orange |
| zai | Dark carbon + gold |
| openrouter | Silver/chrome + electric blue |
| vercel | Monochrome + green |
| ollama | Warm sandstone |
| nanogpt | Aurora green + cyan |
| ccrouter | Sky blue |
| gatewayz | Violet gradients |

Skip theming with `--no-tweak` or customize after with `npx cc-mirror tweak <name>`.

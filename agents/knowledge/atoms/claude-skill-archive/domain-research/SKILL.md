---
description: Use when searching for domain names, checking availability, or brainstorming domain ideas. Uses tldx CLI for fast bulk checks.
---

# Domain Research with tldx

## Tool Location

```
~/bin/tldx
```

Installed from [github.com/brandonyoungdev/tldx](https://github.com/brandonyoungdev/tldx).

## Basic Usage

```bash
# Check specific words across TLDs
~/bin/tldx word1 word2 word3 -t com,io,ai,dev,app,bot -a --show-stats

# -a = only show available domains
# --show-stats = show summary at end
# -t = TLDs to check (comma-separated)
```

## Key Flags

| Flag | Description |
|------|-------------|
| `-t` | TLDs to check: `com,io,ai,dev,app,bot` |
| `-a` | Only show available domains |
| `-p` | Prefixes to prepend: `get,use,my,the,go` |
| `-s` | Suffixes to append: `bot,hq,lab,ai,app,hub,run` |
| `-f` | Output format: `text,json,csv,grouped,grouped-tld` |
| `-m` | Max domain length |
| `-r` | Enable regex pattern matching |
| `-i` | Read keywords from file |
| `--tld-preset` | Use preset: `popular`, `tech` |
| `--show-stats` | Show search/available/taken counts |
| `--no-color` | Disable colors (useful for piping) |

## Common Patterns

### Single TLD check
```bash
~/bin/tldx myword -t bot -a --show-stats
```

### Bulk brainstorm with prefixes/suffixes
```bash
~/bin/tldx keyword1 keyword2 -p get,use,my,the,go -s bot,hq,lab -t com,io,ai -a --show-stats
```

### Export to CSV
```bash
~/bin/tldx keyword -t com,io,ai -a -f csv > results.csv
```

### Check from file
```bash
~/bin/tldx -i keywords.txt -t bot -a --show-stats
```

## TLD Presets

Run `~/bin/tldx show-tld-presets` to see available presets.

## Pricing Reference

| TLD | Typical Price |
|-----|--------------|
| .com | $10-12/yr |
| .io | $30-40/yr |
| .ai | $50-80/yr |
| .dev | $12-15/yr |
| .app | $12-15/yr |
| .bot | $12-15/yr (Amazon Registry) |

## Tips

- Run with `--show-stats` to see hit rate
- Start broad, then narrow. Check a category of words against one TLD first.
- Short, real, common English words are the most valuable
- `.bot` TLD has high availability -- Amazon dropped verification requirements Oct 2023

## Acceptance Checks

- [ ] tldx binary exists at ~/bin/tldx
- [ ] Search results shown with availability status
- [ ] `--show-stats` flag included for summary

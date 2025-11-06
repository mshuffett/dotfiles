---
description: Environment variables & secrets policy; locations, loading, and example .env.local.
---

# Environment Variables and Secrets

Global secrets (used across all projects):
- Store in `~/.env.zsh`.
- This file is sourced automatically by `.zshrc` on shell startup.
- Use for API keys, tokens, and credentials needed system‑wide.

Project‑specific secrets:
- Store in `.env.local` in the project root.
- Add `.env.local` to `.gitignore` to prevent accidental commits.
- Use `direnv` (already enabled in `.zshrc`) to auto‑load when entering project directory.
- Create `.env.example` to document required variables without exposing values.

Example `.env.local`:
```bash
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=your_secret_key_here
```


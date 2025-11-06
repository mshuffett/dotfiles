---
description: Use when adding or updating environment variables/secrets; store in ~/.env.zsh or .env.local and document names in .env.example.
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

## When to Use (Triggers)
- Adding or updating secrets or environment variables

## Acceptance Checks
- [ ] Secrets stored in `~/.env.zsh` (global) or `.env.local` (project)
- [ ] `.env.example` updated with variable names (no values)
- [ ] `direnv` loads when entering the project directory

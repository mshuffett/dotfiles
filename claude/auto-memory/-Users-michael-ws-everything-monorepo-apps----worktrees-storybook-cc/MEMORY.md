# Storybook CC Worktree Memory

## Turbo Cache Bug Pattern
When adding new tsup-based workspace packages (`@workspace/*`), the `turbo.json` default `build` task has `outputs: [".next/**"]` which doesn't match `dist/**`. This means turbo cache hits restore `.next/` (empty for tsup packages) instead of `dist/`. Fix: always add an explicit task entry for tsup packages with `"outputs": ["dist/**"]`.

## CI provider-auth
`@workspace/provider-auth` must be built before: lint (ESLint import/no-unresolved), typecheck (tsc), tests (vitest), and build (next build). It's in `.github/workflows/pr-quality.yml` - all 4 jobs need it.

## Storybook Setup
- Storybook 10.2.8 with `@storybook/nextjs-vite` framework
- Firebase isolated via Vite aliases in `.storybook/main.ts viteFinal`
- Postgres mock uses Proxy-based no-op (not throwing)
- `staticDirs` uses `{ from: "../public", to: "/public" }` to avoid EEXIST collision with Vite's assets dir
- `config.define` shims `__dirname`/`__filename` for CJS globals leaking from Next.js internals
- Story export names must not shadow globals (use `ErrorState` not `Error`, `MapIcon` not `Map`)

## Vercel Build Logs
To access Vercel deployment build logs via API:
```bash
VERCEL_TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
TEAM_ID="team_TinYymN6hcQ21Z8Bt3CgfRUr"
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v2/deployments/<dpl_ID>/events?teamId=$TEAM_ID"
```

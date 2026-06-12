# Compose Patterns

## Structure

- Generate one `docker-compose.yml` unless the repo already depends on layered
  compose files.
- Name services after their runtime role: `web`, `api`, `worker`, `postgres`,
  `redis`.
- Keep the compose file close to the app root or repo root where the build
  context makes sense.

## Build Context Rules

- Use the repo root as build context for monorepos with shared packages.
- Use the app directory as build context only when the app has no runtime
  dependency on sibling packages.
- Reuse an existing `Dockerfile` when it already matches the target service.

## Service Rules

- Add only the services required to run the target flow.
- Add a dedicated migration step when schema setup is required before the app is
  healthy.
- Use named volumes for stateful services unless the environment should be
  disposable by default.
- Add health checks for every user-facing service and every critical backing
  service.

## Commands

- Prefer repo-native commands such as `pnpm -C apps/web start` or
  `bun run --cwd apps/api start`.
- Avoid shell wrappers unless the repo already uses them.
- For test environments, favor deterministic production-like startup over hot
  reload unless the user explicitly wants live reload.

## Health Checks

- Check a real route whenever possible, not just port-open probes.
- For web apps, prefer `/`, `/health`, `/api/health`, or another fast route.
- For Postgres, use `pg_isready`.
- Keep health checks simple and visible in compose so failures are diagnosable
  from `docker compose ps`.

## Common Shapes

### Next.js + Postgres

- Web app service
- Postgres service
- Optional one-shot migration command before verifying the app

### API + Postgres

- API service
- Postgres service
- Optional seed or migration step

### Multi-service monorepo

- Web or frontend service
- API or worker service
- Shared datastore service
- Explicit `depends_on` and health order

## What To Avoid

- Multiple compose files for a small stack
- New env variable names when existing names already work
- Container-internal service names in browser-only variables
- Rebuilding the whole monorepo when only one app and a few packages are
  required

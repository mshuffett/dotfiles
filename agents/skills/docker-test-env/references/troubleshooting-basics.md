# Troubleshooting Basics — docker-test-env

Classify the failure first, then apply the right quick checks. Do not guess — read the output.

---

## Failure Classification

### 1. Build Failure
**Symptom**: `docker compose build` (or `up --build`) fails. No container is created.

**Quick checks:**
```bash
# Build with full output (no cache, verbose)
docker compose build --no-cache --progress=plain <service>
```

Common causes:
- `COPY` path doesn't exist relative to build context
- `RUN npm install` / `pip install` fails (network issue, bad package version, missing system dep)
- Multi-stage `COPY --from=<stage>` references a stage that failed
- Wrong base image (e.g. `FROM node:20` but node binary not at expected path in next stage)
- Build arg not passed (`ARG NEXT_PUBLIC_URL` with no default and no `--build-arg`)

**Fix pattern**: Read the first failing line in `docker compose build` output. Fix that line only. Rebuild.

---

### 2. Startup Failure
**Symptom**: Container is created but exits immediately (code ≠ 0), or health check never passes.

**Quick checks:**
```bash
# See exit codes
docker compose ps -a

# Read logs for the failing service
docker compose logs <service>

# Run interactively to see crash in real time
docker compose run --rm --entrypoint sh <service>
# Then manually run: node index.js   (or python app/main.py, etc.)
```

Common causes:
- `CMD` is wrong (typo, wrong working directory, missing executable)
- Required env var is missing or set to wrong value (`DATABASE_URL=localhost:5432` inside Docker)
- Dependent service (DB, Redis) not ready — app crashes on first connection attempt
- Port already in use on the host
- App binds to `127.0.0.1` instead of `0.0.0.0` — healthcheck can't reach it

**Fix pattern**: Read the crash log. If it's a missing env var, add it. If it's a connection refused to a dependency, add `depends_on` + healthcheck. If it's a wrong `CMD`, fix the Dockerfile.

---

### 3. Runtime / Health Failure
**Symptom**: Container is `running` but the app returns errors (4xx/5xx), data is wrong, or a downstream service call fails.

**Quick checks:**
```bash
# Check app logs for errors after startup
docker compose logs --tail=100 <service>

# Verify env vars inside the running container
docker compose exec <service> env | grep -E "URL|HOST|PORT|KEY"

# Test inter-service connectivity
docker compose exec <service> curl -s http://<other-service>:<port>/health

# Inspect DB state
docker compose exec db psql -U postgres -c "\dt"     # list tables
docker compose exec db psql -U postgres -c "SELECT count(*) FROM users;"
```

Common causes:
- Migrations didn't run (tables missing) — add a `migrate` one-shot service
- App can reach DB but DB has wrong schema (ran `generate` not `migrate deploy`)
- Worker service can't reach broker (Celery: `CELERY_BROKER_URL` uses `localhost`)
- Service A can't call service B — env var `SVC_B_URL` set to `http://localhost:8081` instead of `http://svc-b:8081`
- Secrets missing or placeholder values (`NEXTAUTH_SECRET=changeme` causes auth errors)

**Fix pattern**: Isolate which service is failing and why. Fix env vars first (cheapest). Then check migration state. Then check inter-service networking.

---

## Decision Tree

```
docker compose up fails?
├── Build error?
│   └── Run: docker compose build --no-cache --progress=plain <service>
│       Read first failing RUN/COPY line → fix Dockerfile
│
├── Container exits immediately?
│   ├── Check: docker compose logs <service>
│   ├── Missing env var? → add to environment: block
│   ├── Connection refused? → add healthcheck + depends_on condition
│   └── CMD wrong? → fix Dockerfile CMD/ENTRYPOINT
│
└── Container running but app broken?
    ├── Check: docker compose logs <service>
    ├── Missing tables? → add migrate one-shot service
    ├── localhost in URL? → replace with service name
    └── Can't reach other service? → verify same network, use service name
```

---

## BuildKit Stall Workaround

If `docker compose build` hangs at:
```
resolve image config for docker-image://docker.io/docker/dockerfile:1.4
```

The Dockerfile uses `# syntax=docker/dockerfile:1.4` which pulls a remote BuildKit frontend image. If Docker Hub is slow, this stalls indefinitely.

**Fix:** Use the legacy builder:
```bash
DOCKER_BUILDKIT=0 docker compose build
```

Or remove the `# syntax=` line from the Dockerfile if you don't need BuildKit features.

---

## Cross-Platform `node_modules` Mismatch

If a bind-mounted repo reuses host `node_modules`, Linux containers can fail on
native packages such as `esbuild` with errors like:

```text
You installed esbuild for another platform than the one you're currently using
```

**Fix:**
- Do not reuse host `node_modules` from macOS or Windows inside a Linux container
- Mount a named volume at `/app/node_modules`
- Run the package manager inside the container so native binaries are installed
  for Linux
- Share a pnpm or npm cache volume if repeated installs are expensive

Example pattern:

```yaml
volumes:
  - .:/app
  - node_modules:/app/node_modules
  - pnpm_store:/pnpm-store
```

Then install inside the container:

```bash
pnpm config set store-dir /pnpm-store
pnpm install --frozen-lockfile
```

---

## Local Base Image Fallback

If upstream base-image pulls are blocked or unreasonably slow, prefer a local
prebuilt base image or runtime image over waiting indefinitely.

This is especially useful for repo-native workflows where the goal is to verify
that the app can run locally in Docker, not to benchmark image-build purity.

Safe fallback pattern:
- Use a local image with `pull_policy: never`
- Bind-mount the repo
- Run the repo's native install, migrate, build, and start commands in the
  container
- Keep the Docker-specific env overrides in `.env.docker` or compose

---

## Golden Rules

1. **Never use `localhost` for inter-service URLs.** Always use the compose service name (e.g. `db`, `redis`, `svc-b`).
2. **Always add healthchecks to stateful services** (postgres, redis) and use `condition: service_healthy` in `depends_on`.
3. **Run migrations before the app starts** — either as a one-shot service or as an entrypoint script.
4. **Fix before retry** — do not `docker compose restart` without making a code or config change first.
5. **Verify with `docker compose config`** before `up` — catches YAML syntax errors and missing variables early.

---

## See Also

- [`error-patterns.md`](error-patterns.md) — log signature → fix mapping table
- [`post-start-checks.md`](post-start-checks.md) — 5-step verification checklist after `up`

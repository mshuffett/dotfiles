# Health Checks and Container Verification

How to verify the docker-compose test environment is running correctly after `docker compose up`.

---

## Verification Ladder

Run checks in order — stop at the first failure and diagnose before proceeding:

| Level | Command | What it proves |
|---|---|---|
| 1 | `docker compose config` | Valid YAML, env vars resolved |
| 2 | `docker compose ps` | All services running (not exited) |
| 3 | `docker compose up --wait` | All healthchecks passing |
| 4 | App smoke test (HTTP/CLI) | App is functional end-to-end |
| 5 | Inter-service check | Services can reach each other |

---

## Level 1: YAML Validation

```bash
docker compose config
```

Validates the compose file and prints the resolved configuration. Catches:
- Invalid YAML syntax
- Unknown fields
- Unresolved `${VAR}` references (warns, doesn't error)

---

## Level 2: Container Status

```bash
docker compose ps
```

All services should show `running`. If any show `exited`, check logs immediately:

```bash
docker compose logs <service-name>           # All logs for a service
docker compose logs --tail=50 <service-name> # Last 50 lines
docker compose logs -f <service-name>        # Follow (stream)
docker compose logs                          # All services
```

---

## Level 3: Healthcheck Status

### Using --wait (recommended)

```bash
docker compose up -d --wait
```

Starts all services and blocks until all healthchecks pass (or times out). Exit code 0 = all healthy.

Check individual healthcheck status:
```bash
docker inspect <container-name> --format='{{.State.Health.Status}}'
# Returns: starting | healthy | unhealthy
```

Check healthcheck logs:
```bash
docker inspect <container-name> --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

### Healthcheck Definitions to Include in Compose

```yaml
# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 10s

# Redis
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  retries: 5

# MySQL
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 5s
  retries: 10
  start_period: 30s

# HTTP app with /health endpoint
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# HTTP app without health endpoint (fallback)
healthcheck:
  test: ["CMD-SHELL", "curl -fs http://localhost:3000/ || exit 1"]
  interval: 10s
  retries: 5
  start_period: 30s
```

---

## Level 4: Smoke Tests

Run after all containers are healthy:

### HTTP smoke tests
```bash
# Basic reachability
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health
# Expected: 200

# With response body check
curl -sf http://localhost:3000/health | grep -q '"status":"ok"' && echo "OK" || echo "FAIL"

# For APIs: test a real endpoint
curl -sf http://localhost:3000/api/ping
```

### Per-framework health endpoint patterns

| Framework | Typical health path |
|---|---|
| Express/Fastify | `/health` or `/ping` |
| FastAPI | `/health` (or `/docs` always available) |
| Django | `/health/` (if django-health-check installed) or `/admin/` |
| Next.js | `/api/health` or `/api/ping` |
| Go (gin/echo/chi) | `/health` or `/ping` |
| Rails | `/up` (Rails 7.1+) |

### Database connectivity check
```bash
# Check postgres is accepting connections
docker compose exec db psql -U postgres -c "SELECT 1" -q -t

# Check redis
docker compose exec redis redis-cli ping
# Expected: PONG

# Check from app container (verifies app→db connectivity)
docker compose exec app sh -c 'psql $DATABASE_URL -c "SELECT 1" -q -t 2>&1'
```

---

## Level 5: Inter-Service Connectivity

Verify services can reach each other using service names (not localhost):

```bash
# From app container, reach db by service name
docker compose exec app sh -c 'nc -z db 5432 && echo "DB reachable" || echo "DB unreachable"'

# From app container, reach redis
docker compose exec app sh -c 'nc -z redis 6379 && echo "Redis reachable" || echo "Redis unreachable"'

# From svc-a, reach svc-b (for multi-service repos)
docker compose exec svc-a curl -sf http://svc-b:4000/health
```

---

## Diagnosing Failures

### Container exiting immediately
```bash
docker compose logs <service>        # Look for the error message
docker compose run --rm <service>    # Run interactively to debug
```

Common causes:
- Missing env var → `Error: DATABASE_URL is required`
- Bad command → `exec: "node": executable file not found in $PATH`
- Port already in use → `Error: listen EADDRINUSE`
- DB not ready → `ECONNREFUSED` (fix: add `depends_on` with `service_healthy`)

### Healthcheck failing
```bash
# Check what the healthcheck actually runs
docker inspect <container> --format='{{json .Config.Healthcheck}}'

# Run the healthcheck command manually in the container
docker compose exec <service> pg_isready -U postgres
docker compose exec <service> redis-cli ping
docker compose exec <service> wget -qO- http://localhost:3000/health
```

### App can't reach database
```bash
# Confirm service name resolves inside the app container
docker compose exec app nslookup db
docker compose exec app ping -c 1 db

# Confirm the DATABASE_URL uses the service name
docker compose exec app env | grep DATABASE_URL
```

---

## Quick Reference

```bash
# Start and wait for healthy
docker compose up -d --wait

# Check status
docker compose ps

# View logs
docker compose logs --tail=50 <service>

# Run a command inside a container
docker compose exec <service> <cmd>

# Tear down (keep volumes)
docker compose down

# Tear down and remove volumes
docker compose down -v

# Rebuild images
docker compose build --no-cache

# Check a specific container's health
docker inspect $(docker compose ps -q <service>) --format='{{.State.Health.Status}}'
```

# Post-Start Verification Checklist

Run these checks after `docker compose up -d` (or `docker compose up --wait`).
Stop at the first failure and fix before continuing — do not proceed to later steps if earlier ones fail.

---

## Step 1 — Confirm All Containers Are Running

```bash
docker compose ps
```

**Expected**: Every service shows `running` (or `healthy` if healthchecks are defined). One-shot services (e.g. `migrate`) should show `exited (0)`.

**If a service shows `exited` with non-zero code:**
```bash
docker compose logs <service>        # read the error
docker compose ps -a                 # see exit codes
```

→ Fix the root cause (missing env var, bad CMD, DB not ready). Do not restart blindly.

---

## Step 2 — Verify Health Endpoint Responds

Test the primary web service with a real HTTP request:

```bash
# Generic
curl -sf http://localhost:<PORT>/health && echo "OK" || echo "FAILED"

# With response body
curl -s http://localhost:<PORT>/health | jq .

# For apps without /health, try root or a known endpoint
curl -sf http://localhost:<PORT>/ -o /dev/null -w "%{http_code}"
```

**Expected**: HTTP 200. Any 4xx/5xx or connection refused means the app is not serving.

**If connection refused**: Service may still be starting. Wait 5s and retry. If persistent, check logs (Step 1).

---

## Step 3 — Scan Logs for Errors

Even when the health check passes, scan logs for non-fatal errors that indicate misconfiguration:

```bash
docker compose logs --tail=50 <web-service>
docker compose logs --tail=50 <worker-service>   # if applicable
```

**Watch for:**
- Stack traces or exceptions after startup
- "Warning: using fallback" or "defaulting to" messages (often indicate missing env vars with defaults)
- Retry/reconnection loops (service is up but can't reach its dependency)
- `deprecated` warnings that may become errors in future builds

---

## Step 4 — Verify Env Vars Loaded Correctly

Confirm critical env vars are set to the right values inside the container (service names, not `localhost`):

```bash
# Check database URL
docker compose exec <service> env | grep DATABASE_URL

# Check any service URLs
docker compose exec <service> env | grep URL

# Check all env vars (pipe to less if many)
docker compose exec <service> env | sort
```

**Common mistake**: `DATABASE_URL=postgresql://localhost:5432/db` — this will fail inside Docker. Must use the db service name: `postgresql://db:5432/db`.

---

## Step 5 — Verify Inter-Service Connectivity

If your stack has multiple services, confirm they can actually reach each other:

```bash
# From web/api service, curl the db service port
docker compose exec <app-service> sh -c "nc -zv db 5432 && echo reachable || echo unreachable"

# From svc-a, call svc-b's health endpoint
docker compose exec svc-a curl -s http://svc-b:8081/health

# From api, verify redis is reachable
docker compose exec api sh -c "redis-cli -h redis ping"

# From api, verify postgres is accepting connections
docker compose exec api sh -c "pg_isready -h db -p 5432"
```

**If unreachable**: Services must be on the same Docker network. Verify compose creates a default network (no explicit network config needed unless you added `network_mode: host` or `external: true`).

---

## Teardown

After verification, clean up fully:

```bash
# Stop and remove containers, networks
docker compose down

# Also remove volumes (data) — use for full reset
docker compose down -v

# Idempotency check: bring up again and re-run steps 1-3
docker compose up -d && docker compose ps
```

A clean teardown with `down -v` followed by a successful `up` confirms idempotency.

# Docker Compose Spec Reference

Reference for generating valid `docker-compose.yml` files for test environments.

---

## Top-Level Structure

```yaml
version: "3.9"   # Optional in modern Compose; include for compatibility

services:         # Required: map of service definitions
  <name>: ...

volumes:          # Optional: named volumes for persistence
  <name>: {}

networks:         # Optional: custom networks (define when 2+ services)
  <name>:
    driver: bridge
```

---

## Service Definition Fields

### Required

| Field | Purpose | Example |
|---|---|---|
| `image` | Pre-built image | `postgres:16-alpine` |
| `build` | Build from Dockerfile | `build: .` or see below |

### Common Optional

| Field | Purpose | Example |
|---|---|---|
| `ports` | Host:container port mapping | `- "3000:3000"` |
| `environment` | Env vars (use service names for URLs) | `DATABASE_URL: postgres://...@db:5432/app` |
| `env_file` | Load vars from file | `- .env` |
| `volumes` | Mount paths or named volumes | `- postgres_data:/var/lib/postgresql/data` |
| `depends_on` | Startup ordering | see below |
| `healthcheck` | Container health probe | see below |
| `restart` | Restart policy | `unless-stopped` |
| `networks` | Network membership | `- app-net` |
| `command` | Override CMD | `python manage.py runserver 0.0.0.0:8000` |
| `entrypoint` | Override ENTRYPOINT | rarely needed |

---

## Build Configuration

```yaml
services:
  app:
    build: .                          # Simple: Dockerfile in current dir

  app:
    build:
      context: .                      # Build context path
      dockerfile: Dockerfile          # Explicit Dockerfile path
      args:                           # Build-time ARGs
        NODE_ENV: production
        NEXT_PUBLIC_API_URL: http://api:4000
      target: production              # Multi-stage target
```

**Monorepo pattern** (build context is repo root):
```yaml
services:
  web:
    build:
      context: ../..                  # Repo root
      dockerfile: apps/web/Dockerfile
```

---

## depends_on Patterns

### Simple (just ordering, no health wait)
```yaml
depends_on:
  - db
```

### With health condition (preferred)
```yaml
depends_on:
  db:
    condition: service_healthy       # Wait for healthcheck to pass
  redis:
    condition: service_healthy
```

### For one-shot services (migrations)
```yaml
depends_on:
  migrate:
    condition: service_completed_successfully  # Wait for exit 0
  db:
    condition: service_healthy
```

---

## Healthcheck Patterns

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

# HTTP service (app with health endpoint)
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# HTTP service (no health endpoint, root path)
healthcheck:
  test: ["CMD-SHELL", "curl -fs http://localhost:3000/ || exit 1"]
  interval: 10s
  retries: 5
  start_period: 30s
```

---

## Volume Patterns

```yaml
# Named volume (persists across compose down; removed with -v flag)
volumes:
  postgres_data:

services:
  db:
    volumes:
      - postgres_data:/var/lib/postgresql/data

# Bind mount (syncs local files into container — useful for dev)
services:
  app:
    volumes:
      - ./src:/app/src                # Sync source for hot reload

# Anonymous volume (ephemeral)
services:
  app:
    volumes:
      - /app/node_modules             # Prevent host node_modules from shadowing
```

**Test environment default**: Use named volumes for DB data, no bind mounts for app source (build fresh images).

---

## Network Patterns

```yaml
networks:
  app-net:
    driver: bridge

services:
  app:
    networks: [app-net]
  db:
    networks: [app-net]
  redis:
    networks: [app-net]
```

**Inter-service DNS**: Compose sets up DNS so each service is reachable by its service name within shared networks. `db` resolves to the Postgres container IP, `redis` to the Redis container IP.

**Never use** `localhost` or `127.0.0.1` for inter-service URLs — they refer to the container's own loopback, not other services.

---

## One-Shot Migration Service Pattern

```yaml
services:
  migrate:
    build: .
    command: npx prisma migrate deploy    # or your ORM's migrate command
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: "no"                         # Run once and exit

  app:
    build: .
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy
```

---

## Restart Policies

| Policy | Use For |
|---|---|
| `unless-stopped` | Long-running services (app, worker) |
| `"no"` | One-shot services (migrate, seed) |
| `on-failure` | Retry on crash but not manual stop |
| `always` | Always restart (including after `compose down` + `up`) |

---

## Worker Service Pattern (no exposed ports)

```yaml
  worker:
    build: .
    command: celery -A app.celery worker --loglevel=info
    environment:
      CELERY_BROKER_URL: redis://redis:6379/0
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      redis:
        condition: service_healthy
      db:
        condition: service_healthy
    restart: unless-stopped
    # No ports: — worker doesn't expose HTTP
```

---

## Environment Variable Strategy

1. **Hardcoded non-secrets** → `environment:` block in compose
2. **Secrets needed at runtime** → `.env` file (gitignored) loaded via `env_file: - .env`
3. **Secrets needed at build time** → `build.args:` (baked into image layer — avoid for real secrets)
4. **Pass-through from host** → `environment: - MY_KEY` (no value = inherits from host shell)

**Always document** required secrets in `.env.example` (committed, no real values).

---

## Complete Multi-Service Template

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
      interval: 10s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    networks: [app-net]

  migrate:
    build: .
    command: npx prisma migrate deploy
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
    networks: [app-net]

  worker:
    build: .
    command: node worker.js
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks: [app-net]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5
    restart: unless-stopped
    networks: [app-net]

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5
    restart: unless-stopped
    networks: [app-net]

volumes:
  postgres_data:

networks:
  app-net:
    driver: bridge
```

---

## Validation

Always validate before starting:
```bash
docker compose config        # Validates YAML and resolves env vars
docker compose build         # Builds images (surface Dockerfile errors early)
docker compose up --wait     # Start + wait for all healthchecks to pass
```

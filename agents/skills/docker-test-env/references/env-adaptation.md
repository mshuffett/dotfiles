# Environment Variable Adaptation for Docker

When adapting a codebase's env vars for a docker-compose test environment, the key rule is:

> **Any URL that points to another service must use the service name, not `localhost` or `127.0.0.1`.**

Docker Compose sets up internal DNS so each service is reachable by its service name within the shared network.

---

## The Core Substitution Table

| Original (local dev) | Docker Compose equivalent |
|---|---|
| `localhost:5432` | `db:5432` |
| `127.0.0.1:5432` | `db:5432` |
| `localhost:6379` | `redis:6379` |
| `localhost:3306` | `db:3306` |
| `localhost:27017` | `mongo:27017` |
| `localhost:5672` | `rabbitmq:5672` |
| `localhost:4000` | `worker:4000` (or whatever service name) |

---

## Database URL Formats by Driver

### PostgreSQL
```
# Local dev (breaks in compose):
DATABASE_URL=postgres://user:pass@localhost:5432/mydb

# Compose (service named "db"):
DATABASE_URL=postgres://postgres:postgres@db:5432/app

# With explicit driver prefixes:
DATABASE_URL=postgresql://postgres:postgres@db:5432/app   # also valid
POSTGRES_URL=postgresql://postgres:postgres@db:5432/app   # Vercel/Next.js convention
```

### MySQL / MariaDB
```
DATABASE_URL=mysql://root:root@db:3306/app
```

### MongoDB
```
MONGODB_URI=mongodb://mongo:27017/app
# With auth:
MONGODB_URI=mongodb://root:password@mongo:27017/app?authSource=admin
```

### Redis
```
REDIS_URL=redis://redis:6379
REDIS_URL=redis://redis:6379/0           # with DB index
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

### RabbitMQ
```
AMQP_URL=amqp://guest:guest@rabbitmq:5672/
CLOUDAMQP_URL=amqp://guest:guest@rabbitmq:5672/
```

---

## Build-Time vs Runtime Env Vars

### Runtime vars (set in `environment:` block)
Standard env vars read at process startup. Always use service names here.

```yaml
services:
  app:
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
      REDIS_URL: redis://redis:6379
      SECRET_KEY: dev-secret-not-for-prod
```

### Build-time vars (Next.js `NEXT_PUBLIC_*`, etc.)
Baked into the image at `docker build` time. Must be passed as `build.args`.

```yaml
services:
  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_API_URL: http://api:4000     # inter-service: service name
        NEXT_PUBLIC_APP_URL: http://localhost:3000  # browser-facing: localhost OK here
```

**Important distinction**: `NEXT_PUBLIC_*` vars consumed by browser JS must use `localhost` (the browser accesses via the host machine's port mapping, not inside Docker's network). `NEXT_PUBLIC_*` vars consumed server-side (SSR) should use service names.

---

## Secrets Strategy

### For test environments

Use simple placeholder values that are safe to commit:
```yaml
environment:
  SECRET_KEY: dev-secret-change-in-prod
  JWT_SECRET: dev-jwt-secret
  AUTH_SECRET: dev-auth-secret
```

For API keys that must be real (e.g., `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`):
```yaml
services:
  app:
    env_file:
      - .env           # gitignored, contains real keys
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app   # hardcoded safe values
```

Maintain `.env.example` with all required keys documented:
```bash
# .env.example — copy to .env and fill in real values
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
# These are set automatically by docker-compose.yml:
# DATABASE_URL=postgres://postgres:postgres@db:5432/app
# REDIS_URL=redis://redis:6379
```

---

## Detecting Required Env Vars from Source

Scan the codebase before generating compose to avoid missing vars:

```bash
# Node/TypeScript — find all process.env references
grep -r "process\.env\." src/ --include="*.ts" --include="*.js" \
  | grep -oP 'process\.env\.\K\w+' | sort -u

# Python — find os.environ and os.getenv calls
grep -r "os\.environ\|os\.getenv" . --include="*.py" \
  | grep -oP '[\x27\x22]\K[A-Z_]+(?=[\x27\x22])' | sort -u

# Go — find os.Getenv calls
grep -r 'os\.Getenv' . --include="*.go" \
  | grep -oP '"\K[A-Z_]+(?=")' | sort -u

# Also check .env.example if it exists — it's the ground truth
cat .env.example 2>/dev/null || cat .env.sample 2>/dev/null
```

---

## Common Pitfalls

| Mistake | Fix |
|---|---|
| `DATABASE_URL=postgres://...@localhost:5432/...` | Use `@db:5432` (service name) |
| API key left as placeholder when service requires real value | Use `env_file: .env` for real secrets |
| `NEXT_PUBLIC_API_URL=http://api:4000` for browser calls | Browser can't resolve Docker DNS — use `http://localhost:4000` |
| DB credentials differ between app and DB service definitions | Use same values in both; default to `postgres`/`postgres` for test |
| Missing `DATABASE_URL` when ORM reads from different var name | Check ORM docs: Prisma reads `DATABASE_URL`, Django reads `DATABASE_URL` via dj-database-url, etc. |

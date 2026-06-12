# Service Patterns

Docker-compose service type patterns mapped from common app architectures.

## Web Service (HTTP API / frontend)

Publicly accessible via host port mapping. Most common pattern.

```yaml
app:
  build: .
  ports:
    - "${PORT:-3000}:3000"
  environment:
    NODE_ENV: production
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
    interval: 10s
    start_period: 30s
    retries: 3
  restart: unless-stopped
```

## Worker Service (background processor)

No ports exposed. Processes jobs from a queue.

```yaml
worker:
  build: .
  command: celery -A app worker --loglevel=info
  environment:
    CELERY_BROKER_URL: redis://redis:6379/0
  depends_on:
    redis:
      condition: service_healthy
  restart: unless-stopped
```

## Cron / Scheduler

Runs periodic tasks. Two patterns:

**Always-on scheduler (Celery Beat, node-cron):**
```yaml
scheduler:
  build: .
  command: celery -A app beat --loglevel=info
  depends_on:
    redis:
      condition: service_healthy
  restart: unless-stopped
```

**One-shot via host cron:**
```bash
# In host crontab:
*/5 * * * * docker compose exec -T app node scripts/cleanup.js
```

## Static Site (nginx)

Serves pre-built static files via nginx.

```yaml
web:
  build:
    context: .
    target: runner
  ports:
    - "80:80"
  restart: unless-stopped
```

## Private / Internal Service

Accessible only to other compose services. No host port mapping.

```yaml
internal-api:
  build: ./internal-api
  expose:
    - "8080"
  # No 'ports:' — only reachable via compose network
  restart: unless-stopped
```

Other services reach it via `http://internal-api:8080`.

## Database Services

```yaml
# PostgreSQL
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: myapp
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 5s
    timeout: 5s
    retries: 5

# Redis
redis:
  image: redis:7-alpine
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    retries: 5

# MySQL
db:
  image: mysql:8
  environment:
    MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-password}
    MYSQL_DATABASE: myapp
  volumes:
    - mysql_data:/var/lib/mysql
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 5s
    retries: 5

# MongoDB
mongo:
  image: mongo:7
  volumes:
    - mongo_data:/data/db
  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
    interval: 5s
    retries: 5
```

## Migration One-Shot

Runs DB migrations before the app starts.

```yaml
migrate:
  build: .
  command: npx prisma migrate deploy
  environment:
    DATABASE_URL: postgresql://postgres:password@db:5432/myapp
  depends_on:
    db:
      condition: service_healthy
  restart: "no"

app:
  depends_on:
    migrate:
      condition: service_completed_successfully
```

## Pattern Selection Guide

| Detected in Codebase | Service Pattern |
|----------------------|----------------|
| HTTP server, listens on port | Web Service |
| Celery, BullMQ, Sidekiq, Faktory | Worker Service |
| Cron schedule, Beat scheduler | Cron/Scheduler |
| Static build output (dist/, build/) | Static Site |
| Internal API, no public access needed | Private Service |
| `prisma migrate`, `alembic upgrade`, `rails db:migrate` | Migration One-Shot |

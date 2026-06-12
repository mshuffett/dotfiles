# Codebase Analysis (Docker Test Env)

Use this reference when inspecting a codebase to determine what services, images, ports, and environment variables to include in a `docker-compose.yml` test environment.

The goal differs from deployment analysis: we need **all services** the app depends on (databases, caches, workers), not just build/start commands for a single app.

---

## What to Extract

For each codebase, determine:

1. **App service(s)**: runtime, Dockerfile presence, exposed port, build context
2. **Backing services**: databases, caches, queues (Postgres, Redis, MySQL, MongoDB, RabbitMQ, etc.)
3. **One-shot services**: migration runners, seed scripts
4. **Inter-service URLs**: which env vars wire services together (must use service name, never `localhost`)
5. **Healthcheck path**: for `docker compose up --wait` to work correctly

---

## Node.js Projects

Read `package.json`:
- `dependencies` / `devDependencies` for DB clients (pg, mysql2, mongodb, redis, ioredis, amqplib)
- `scripts.start` / `scripts.dev` for the app start command
- `engines.node` or `.nvmrc` / `.node-version` for Node version → base image tag

Detect package manager:
- `bun.lockb` → `bun install --frozen-lockfile` / `bun run start`
- `pnpm-lock.yaml` → `pnpm install --frozen-lockfile` / `pnpm start`
- `yarn.lock` → `yarn install --frozen-lockfile` / `yarn start`
- `package-lock.json` → `npm ci` / `npm start`
- `package.json` only → `npm install` / `npm start`

ORM detection (implies migration one-shot service):
- `prisma` dep + `prisma/schema.prisma` → `npx prisma migrate deploy`
- `sequelize` / `sequelize-cli` → `npx sequelize-cli db:migrate`
- `typeorm` → `npx typeorm migration:run`
- `drizzle-orm` / `drizzle-kit` → `npx drizzle-kit migrate`
- `knex` → `npx knex migrate:latest`

Port detection:
- Look for `process.env.PORT` in entry point → use `PORT=3000` env var and expose `3000`
- Fallback: check `package.json` scripts for explicit port flags

---

## Python Projects

Check for dependency files (in priority order):
- `uv.lock` → `uv sync` / `uv run`
- `poetry.lock` → `poetry install --no-dev` / `poetry run`
- `Pipfile.lock` → `pipenv install --deploy` / `pipenv run`
- `requirements.txt` → `pip install -r requirements.txt`
- `pyproject.toml` only → check `[tool.uv]` or `[tool.poetry]`, fallback to pip

Framework detection:
- `django` in deps → Django app; check `manage.py` for migrations (`python manage.py migrate`)
- `fastapi` + `uvicorn` → `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- `flask` → `flask run --host 0.0.0.0` or `gunicorn`
- `celery` → separate `worker` service; `celery -A <module> worker`

Python version:
- `.python-version` (uv/pyenv)
- `pyproject.toml` `requires-python` field
- `runtime.txt`

DB client detection from requirements:
- `psycopg2` / `psycopg` / `asyncpg` → Postgres
- `pymysql` / `mysqlclient` → MySQL
- `pymongo` → MongoDB
- `redis` / `aioredis` → Redis

---

## Go Projects

Read `go.mod`:
- Module path and Go version → base image tag (`golang:1.22-alpine`)
- Dependencies: `github.com/lib/pq` / `jackc/pgx` → Postgres; `go-redis/redis` → Redis

Build pattern: `go build -o /app ./cmd/...` or `go build -o /app .`
Start command: `/app` (compiled binary)

Web framework detection (informational only, doesn't change compose structure):
- `gin-gonic/gin`, `labstack/echo`, `go-chi/chi`, `gofiber/fiber`

---

## Dockerfile Projects

When a `Dockerfile` exists, use it as the build source:
```yaml
services:
  app:
    build: .
```

Extract from Dockerfile:
- `EXPOSE <port>` → container port to map
- `FROM <image>` → confirms runtime (informs image choices for backing services)
- `RUN ... migrate` patterns → may not need a separate migrate service

If no Dockerfile exists, generate a minimal one based on runtime detection above.

---

## Backing Service Detection

### PostgreSQL
**Signals**: `pg`, `psycopg2`, `pgx`, `ActiveRecord`, `Prisma`, `TypeORM`, Sequelize
**Image**: `postgres:16-alpine`
**Required env vars on app service**:
```
DATABASE_URL=postgres://postgres:postgres@db:5432/app
```
Note: use service name (`db`) not `localhost`.

**Healthcheck**:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  retries: 5
```

### Redis
**Signals**: `redis`, `ioredis`, `aioredis`, `go-redis`, `Celery`, `Sidekiq`, `BullMQ`, `rq`
**Image**: `redis:7-alpine`
**Required env vars on app service**:
```
REDIS_URL=redis://redis:6379
```

**Healthcheck**:
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  retries: 5
```

### MySQL / MariaDB
**Signals**: `mysql2`, `pymysql`, `mysqlclient`, `go-sql-driver/mysql`
**Image**: `mysql:8` or `mariadb:11`
**Required env vars**: `DATABASE_URL=mysql://root:root@db:3306/app`

### MongoDB
**Signals**: `mongodb`, `mongoose`, `pymongo`, `mongo-go-driver`
**Image**: `mongo:7`
**Required env vars**: `MONGODB_URI=mongodb://mongo:27017/app`

### RabbitMQ
**Signals**: `amqplib`, `pika`, `amqp091-go`
**Image**: `rabbitmq:3-management-alpine`
**Required env vars**: `AMQP_URL=amqp://guest:guest@rabbitmq:5672/`

---

## One-Shot Migration Services

When an ORM migration command is detected, add a `migrate` service:

```yaml
migrate:
  build: .
  command: <migration-command>
  depends_on:
    db:
      condition: service_healthy
  restart: "no"
```

App service then depends on migrate completing:
```yaml
app:
  depends_on:
    migrate:
      condition: service_completed_successfully
```

Common migration commands by stack:
- Prisma: `npx prisma migrate deploy`
- Django: `python manage.py migrate`
- Sequelize: `npx sequelize-cli db:migrate`
- TypeORM: `npx typeorm migration:run -d src/data-source.ts`
- Alembic (SQLAlchemy): `alembic upgrade head`
- Flyway: `flyway migrate`
- golang-migrate: `migrate -path /migrations -database $DATABASE_URL up`

---

## Port Mapping Rules

| Situation | Rule |
|---|---|
| Single-service app | Map app container port to same host port (e.g., `3000:3000`) |
| Multiple services | Assign distinct host ports to avoid conflicts (e.g., `3000:3000`, `3001:3000`) |
| Backing services (DB, Redis) | Expose host port for local debugging (e.g., `5432:5432`) |
| Inter-service communication | **Never use host-mapped ports.** Use service name + container port (e.g., `db:5432`) |

---

## Network Rules

- Define a custom bridge network when there are 2+ services
- All services join the same network
- Use service names as hostnames — Docker Compose DNS resolves them automatically
- Never set `network_mode: host`

```yaml
networks:
  app-net:
    driver: bridge

services:
  app:
    networks: [app-net]
  db:
    networks: [app-net]
```

---

## Healthcheck Path Detection

Look for health/ping endpoints to use with `docker compose up --wait`:
- Express/Fastify: routes matching `/health`, `/ping`, `/status`, `/ready`
- FastAPI: `/health`, `/docs` (always present)
- Django: check `urls.py` for health endpoint; fallback to `/admin/` (redirects to login = 302, not ideal)
- Go: look for `GET /health` or `GET /ping` handler
- Next.js: `/api/ping` or `/api/health` in `pages/api/` or `app/api/`

If no health endpoint found, note in compose as a comment and use TCP check:
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:3000/ || exit 1"]
```

---

## Multi-Service / Monorepo Detection

Signs of a monorepo:
- Multiple `package.json` files in subdirectories
- Multiple `go.mod` files
- `docker-compose.yml` already present (read it as ground truth)
- `services/`, `apps/`, `packages/` directory structure

For monorepos:
- Use `build.context` to point to each service's subdirectory
- Each service gets its own `build` block with explicit `context` and `dockerfile`
- Shared network connects all services

---

## Environment Variable Naming Patterns

Scan source files for common patterns to avoid missing required env vars:

```bash
# Node
grep -r "process\.env\." src/ --include="*.ts" --include="*.js" | grep -oP 'process\.env\.\K\w+'

# Python
grep -r "os\.environ\|os\.getenv" . --include="*.py" | grep -oP '[\'"]\K[A-Z_]+'

# Go
grep -r 'os\.Getenv' . --include="*.go" | grep -oP '"\K[A-Z_]+'
```

Any env var referencing a service (DB, Redis, etc.) must use the **service name** as the hostname.

---

## Edge Cases Discovered in E2E Testing

1. **Pre-built artifact Dockerfiles**: Some Dockerfiles `COPY dist/` or `COPY build/` expecting pre-built output. Detect `COPY dist` / `COPY build` patterns and offer to generate a source-build Dockerfile instead.

2. **Migration embedded in build script**: If `package.json` scripts.build includes a migration command (e.g., `tsx lib/db/migrate && next build`), the migration must be separated into a one-shot compose service that runs against the live DB.

3. **Non-standard env var names**: Not all projects use `DATABASE_URL`. Vercel projects use `POSTGRES_URL`, Rails uses `DATABASE_URL`, Django uses `DATABASES` dict. Always read `.env.example` to infer actual env var names rather than assuming standard names.

4. **Monorepo build context**: If the Dockerfile references paths outside the current directory (e.g., `COPY packages/db ./packages/db`), the build context must be set to the repo root, not the app subdirectory.

5. **BuildKit syntax directive**: Dockerfiles with `# syntax=docker/dockerfile:1.4` cause BuildKit to pull a remote frontend image, which can stall. See troubleshooting-basics.md for the `DOCKER_BUILDKIT=0` workaround.

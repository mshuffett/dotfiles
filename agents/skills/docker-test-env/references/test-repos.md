# Test Repos for docker-test-env Skill

Audited 2026-04-12. Four repos for validating the docker-test-env skill across complexity levels.

---

## 1. `~/ws/last-mono/apps/web` — Last.dev Web Frontend

**Complexity**: High (multi-service monorepo)

### Framework / Runtime
- Next.js 16.1.6, Bun 1.3.10 (build), Node 22 (runtime)
- Monorepo: `apps/web`, `apps/gateway` (worker), `apps/worker`, `packages/db`
- Standalone output (`output: "standalone"`)

### Database Needs
- **None directly** — web app is a pure frontend that proxies `/api/*` to a `worker` service
- Database lives in `apps/worker` or `packages/db` (not audited here)

### Required Env Vars
| Variable | Default / Notes |
|----------|----------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` — URL of the worker/gateway service |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` — public URL of this web app |
| `NEXT_PUBLIC_GITHUB_APP_SLUG` | `last-dev-development` — GitHub App identifier |
| `SHOW_WAITLIST` | `false` |

`NEXT_PUBLIC_*` vars are baked in at build time as `ARG`/`ENV` in the Dockerfile.

### Ports
- **3000** — web app
- **4000** — worker service (external dependency, not in this app's Dockerfile)

### Build / Start Commands
```bash
# Build (Dockerfile multi-stage: deps → build → production)
bun install --frozen-lockfile
bun run build              # from apps/web

# Runtime (node:22-alpine, standalone output)
node server.js             # in apps/web
```

### What docker-compose.yml Would Need
```yaml
services:
  web:
    build:
      context: .           # repo root (monorepo Dockerfile copies multiple apps/)
      dockerfile: apps/web/Dockerfile
      args:
        NEXT_PUBLIC_BACKEND_URL: http://worker:4000
        NEXT_PUBLIC_APP_URL: http://localhost:3000
        NEXT_PUBLIC_GITHUB_APP_SLUG: last-dev-development
    ports:
      - "3000:3000"
    depends_on:
      - worker
    environment:
      SHOW_WAITLIST: "false"

  worker:
    # worker service at port 4000 (separate image/build)
    image: ...
    ports:
      - "4000:4000"
```

**Key challenge**: True monorepo — the Dockerfile context is the repo root. The skill must handle this case. Build args baked at compile time require `ARG` handling.

---

## 2. `gothinkster/realworld` (cloned to `/tmp/realworld-test/`) — Conduit API Spec

**Complexity**: Low-Medium (well-defined API contract, no specific implementation in this repo)

### Framework / Runtime
- **Meta-repo only** — contains API specs, E2E tests, and documentation
- No `apps/` or `implementations/` directories — actual backends are separate repos
- Recommended node-express implementation: `gothinkster/node-express-realworld-example-app`

### API Contract
All conforming implementations expose a REST API at `/api` prefix:
- `GET /api/articles` — list articles
- `POST /api/users/login` — auth
- Standard "Conduit" API (users, articles, comments, tags)
- E2E tested via Hurl: `HOST=http://localhost:3000/api ./specs/api/run-api-tests-hurl.sh`

### Database Needs
- Varies by implementation
- PostgreSQL most common (reference implementations use it)
- Some use SQLite (simpler for testing)

### Required Env Vars (typical node-express implementation)
| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `SECRET` | JWT signing secret |
| `PORT` | Usually 3000 |

### Ports
- **3000** — API server (standard), API served at `/api`

### Build / Start Commands (typical node-express)
```bash
npm install
npm start   # or node index.js / node server.js
```

### What docker-compose.yml Would Need
```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/realworld
      SECRET: some-jwt-secret
      PORT: "3000"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: realworld
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5
```

**Key insight**: The meta-repo itself is not dockerizable — the skill needs to detect "no Dockerfile / no package.json at root" and handle this gracefully, or use a known implementation URL.

---

## 3. `docker/awesome-compose` → `django/` (at `/tmp/awesome-compose/django/`)

**Complexity**: Low (single service, no external database)

### Framework / Runtime
- Django 3.2.13, Python 3.7-alpine
- Single service, no worker/celery
- Dev-mode only (`manage.py runserver`)

### Database Needs
- **None explicitly configured** — Django's default SQLite (file-based, in container)
- No database service in compose.yaml

### Required Env Vars
- None documented in `.env.example`
- Uses `environs==7.3.1` for environment variable loading
- Standard Django: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` (likely have defaults)

### Ports
- **8000** — Django dev server

### Build / Start Commands
```bash
# Build
pip3 install -r requirements.txt

# Start
python3 manage.py runserver 0.0.0.0:8000
```

**Dependencies**: `Django==3.2.13`, `environs==7.3.1`

### Existing compose.yaml
```yaml
services:
  web:
    build:
      context: app
      target: builder
    ports:
      - '8000:8000'
```

### What a Full docker-compose.yml Would Need
```yaml
services:
  web:
    build:
      context: app
      target: builder
    ports:
      - "8000:8000"
    environment:
      SECRET_KEY: dev-secret-key-change-in-prod
      DEBUG: "True"
      ALLOWED_HOSTS: "*"
    # No database service needed — SQLite is file-based
```

**Key insight**: This is the simplest case — single service, no external deps. Good "happy path" test for the skill.

---

## 4. `~/ws/waycraft-web` — Waycraft AI Chat

**Complexity**: High (Next.js + PostgreSQL + Redis + multiple AI APIs)

### Framework / Runtime
- Next.js 15.3.6, TypeScript, pnpm 9.12.3
- Vercel AI SDK 5.0.26 (`ai` package) with multiple providers (Anthropic, xAI)
- Drizzle ORM for database migrations
- next-auth 5.0.0-beta.25 for authentication

### Database Needs
- **PostgreSQL** — primary database via `@vercel/postgres` + `drizzle-orm`
- **Redis** — session/caching via `@vercel/kv` and `redis` packages
- **Supabase** — also integrated (`@supabase/supabase-js`)
- **Vercel Blob** — file storage (`@vercel/blob`)

### Required Env Vars
| Variable | Purpose | Required |
|----------|---------|----------|
| `AUTH_SECRET` | NextAuth JWT signing secret | Yes |
| `POSTGRES_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `AI_GATEWAY_API_KEY` | AI Gateway API key (non-Vercel deployments) | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage | Yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (default: `https://us.i.posthog.com`) | Optional |
| `NEXT_PUBLIC_DEBUG_PANEL` | Enable debug panel | Optional |

### Ports
- **3000** — Next.js app (`next dev` / `next start`)

### Build / Start Commands
```bash
pnpm install

# Dev
pnpm dev   # next dev --turbo

# Production (runs migrations first!)
pnpm build  # = tsx lib/db/migrate && next build
pnpm start  # next start
```

**Critical**: Migrations run as part of `build` via `tsx lib/db/migrate`. In Docker, must run against the live DB before/during build or at startup.

### What docker-compose.yml Would Need
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      AUTH_SECRET: dev-secret-change-in-prod
      POSTGRES_URL: postgresql://postgres:password@db:5432/waycraft
      REDIS_URL: redis://redis:6379
      AI_GATEWAY_API_KEY: ${AI_GATEWAY_API_KEY}
      BLOB_READ_WRITE_TOKEN: ${BLOB_READ_WRITE_TOKEN}
      NEXT_PUBLIC_POSTHOG_KEY: ""
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: waycraft
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5

volumes:
  postgres_data:
```

**Key challenges**:
1. Migration step in build command requires live DB — may need a separate migration entrypoint
2. Multiple external API keys (`AI_GATEWAY_API_KEY`, `BLOB_READ_WRITE_TOKEN`) needed for full functionality — test env needs stubs or real keys

---

## Summary Matrix

| Repo | Framework | DB | Services | Complexity | Good For Testing |
|------|-----------|-----|----------|------------|-----------------|
| last-mono/apps/web | Next.js 16 + Bun | None (proxies to worker) | 2 (web + worker) | High | Multi-service detection |
| realworld (meta-repo) | N/A (spec only) | PostgreSQL (typical) | 2 (api + db) | Medium | Node.js API + DB |
| awesome-compose/django | Django 3.2 | None (SQLite) | 1 | Low | Happy path / single service |
| waycraft-web | Next.js 15 + AI SDK | PostgreSQL + Redis | 3 (app + db + redis) | High | Multi-DB + AI key handling |

## Recommended Test Order for Skill Development

1. **django** — single service, no DB, existing compose.yaml validates skill can work with existing setup
2. **realworld** (specific node-express impl) — two services (api + postgres), simple env vars
3. **waycraft-web** — three services, DB migrations, multiple API keys
4. **last-mono/apps/web** — monorepo Dockerfile, build args, multi-service dependency

# Configuration Guide

Best practices for environment variables, port binding, health checks, and database connections in docker-compose test environments.

## Environment Variables

### Three Categories

**1. Hardcoded values** — non-secret, same for all developers:
```yaml
environment:
  NODE_ENV: production
  LOG_LEVEL: info
  PORT: "3000"
```

**2. Secrets** — different per developer, never committed:
```yaml
# In docker-compose.yml, reference from .env:
environment:
  API_KEY: ${API_KEY}
  JWT_SECRET: ${JWT_SECRET}
```

```bash
# In .env (gitignored):
API_KEY=sk-test-xxx
JWT_SECRET=my-dev-secret

# In .env.example (committed):
API_KEY=sk-test-your-key-here
JWT_SECRET=generate-with-openssl-rand-hex-32
```

**3. Inter-service URLs** — auto-wired via Docker DNS:
```yaml
environment:
  DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-password}@db:5432/myapp
  REDIS_URL: redis://redis:6379/0
  BACKEND_URL: http://api:8080
```

### Critical Rule: Service Names, Not localhost

**Always** use the Docker service name for inter-service communication:
- ✅ `postgresql://postgres:password@db:5432/myapp`
- ❌ `postgresql://postgres:password@localhost:5432/myapp`

`localhost` inside a container refers to that container, not the host or other containers.

### .env File Convention

```
project/
├── docker-compose.yml    # References ${VAR} from .env
├── .env                  # Actual values (gitignored)
├── .env.example          # Template with documentation (committed)
└── .gitignore            # Must include .env
```

## Port Binding

### App Must Bind to 0.0.0.0

The app inside the container must listen on `0.0.0.0`, not `127.0.0.1`:

| Framework | How to Set |
|-----------|-----------|
| Express | `app.listen(PORT, '0.0.0.0')` |
| Next.js | Automatic (binds 0.0.0.0 by default) |
| Django | `python manage.py runserver 0.0.0.0:8000` |
| FastAPI/Uvicorn | `uvicorn app:app --host 0.0.0.0` |
| Go net/http | `http.ListenAndServe(":8080", ...)` (colon prefix = all interfaces) |
| Flask | `flask run --host 0.0.0.0` |

### Port Mapping

```yaml
ports:
  - "3000:3000"     # host:container — access via localhost:3000
  - "127.0.0.1:5432:5432"  # Restrict DB to localhost only
```

Use `expose:` (no host mapping) for internal-only services.

## Health Checks

### Infrastructure Services

Always add health checks to databases and caches:

```yaml
# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 5

# Redis
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  retries: 5

# MySQL
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 5s
  retries: 5
```

### App Services

Add if the app has a health endpoint:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
  interval: 10s
  start_period: 30s   # Grace period for slow startup
  timeout: 5s
  retries: 3
```

If `curl` is not in the image, use `wget`:
```yaml
test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
```

## Database Connections

### Connection String Patterns

| Database | URL Pattern |
|----------|------------|
| PostgreSQL | `postgresql://USER:PASS@db:5432/DBNAME` |
| MySQL | `mysql://USER:PASS@db:3306/DBNAME` |
| MongoDB | `mongodb://mongo:27017/DBNAME` |
| Redis | `redis://redis:6379/0` |

### Connection Pooling

For production-like testing, configure pool size:

| ORM | Setting |
|-----|---------|
| Prisma | `?connection_limit=5` in DATABASE_URL |
| SQLAlchemy | `pool_size=5` in create_engine |
| Drizzle | `max: 5` in pool config |
| TypeORM | `extra: { max: 5 }` |

### SSL in Docker

Usually **disabled** for local Docker — both app and DB are on the same network:
- Prisma: `?sslmode=disable`
- SQLAlchemy: `?sslmode=disable`
- pg (node): `ssl: false` or omit

## Volumes

### Persistent Data
```yaml
volumes:
  postgres_data:    # Named volume — survives docker compose down
```

Destroyed by: `docker compose down -v`

### Source Code Mounting (Dev Mode)
```yaml
volumes:
  - .:/app          # Mount source for hot reload
  - /app/node_modules  # Exclude node_modules (use container's copy)
```

Only use for development. For test environments, prefer `build:` (bakes code into image).

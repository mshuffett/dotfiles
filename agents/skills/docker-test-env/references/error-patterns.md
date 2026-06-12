# Error Patterns — docker-test-env

Compact log-signature → likely cause → quick fix table.
When a container fails to start or behaves unexpectedly, scan logs with `docker compose logs <service>` and match below.

---

## Application / Environment Errors

| Log Signature | Likely Cause | Quick Fix |
|---|---|---|
| `KeyError: 'VAR'` / `environment variable not defined` / `undefined` (Node) | Missing env var | Add to `environment:` block or `.env` file; check `.env.example` |
| `ECONNREFUSED 127.0.0.1:5432` / `Connection refused (localhost)` | Inter-service URL uses `localhost` instead of service name | Change to service name: `DATABASE_URL=postgresql://postgres:password@db:5432/myapp` |
| `ECONNREFUSED <service-name>:PORT` | Dependent service not ready yet | Add `depends_on: <service>: condition: service_healthy` and a `healthcheck:` to the dependency |
| `could not connect to server` (postgres) / `dial tcp ... connection refused` | DB container not yet ready when app starts | Add healthcheck to `db` service; use `condition: service_healthy` in `depends_on` |
| `password authentication failed` | Wrong DB password in connection string | Ensure `POSTGRES_PASSWORD` in db service matches password in `DATABASE_URL` |
| `database "appdb" does not exist` | DB not initialized | Add `POSTGRES_DB: appdb` env var to postgres service |
| `Cannot find module` / `ModuleNotFoundError` | Dependency missing from image | Add `RUN npm install` / `RUN pip install -r requirements.txt` to Dockerfile; rebuild |
| `exit code 137` / `OOM killed` | Out of memory | Add `mem_limit: 512m` (or higher) to compose service |
| `Command failed` / `non-zero exit code` in build | Bad `RUN` step in Dockerfile | Run `docker compose build <service>` alone and read full output |

---

## Docker / Container Errors

| Log Signature | Likely Cause | Quick Fix |
|---|---|---|
| `No such file or directory` inside container | `COPY` path wrong in Dockerfile | Check paths relative to build context; verify `WORKDIR` |
| `permission denied` | File ownership issue — root wrote files, non-root runs them | Add `RUN chown -R <user>:<user> /app` or use `USER` instruction correctly |
| `network not found` / `network <name> declared as external but could not be found` | Missing network definition | Add `networks:` block to compose file, or remove `external: true` |
| `port is already allocated` / `address already in use` | Host port conflict with another running container or local process | Change host-side port: `"3001:3000"` instead of `"3000:3000"` |
| Container exits immediately (exit 0 or 1, no logs) | `CMD`/`ENTRYPOINT` wrong, or app crashes on startup before logging | Run `docker compose run --rm <service>` interactively; check for startup crash |
| `exec: "node": executable file not found` | Wrong base image or PATH issue | Verify `FROM` image includes the runtime; check multi-stage copy |
| `Dockerfile not found` | Wrong build context path | Check `build.context` in compose — must point to directory containing `Dockerfile` |
| `COPY failed: no source files were specified` | Glob pattern in `COPY` matches nothing | Verify files exist at the path relative to build context |

---

## Migration / Startup Ordering Errors

| Log Signature | Likely Cause | Quick Fix |
|---|---|---|
| `relation "users" does not exist` / `table not found` | App started before migrations ran | Add a one-shot `migrate` service; `app` must `depends_on: migrate: condition: service_completed_successfully` |
| `migrate exited with code 1` | Migration script failed (bad SQL, missing env var, DB not ready) | Check `docker compose logs migrate`; ensure `migrate` also `depends_on` db with healthcheck |
| `prisma: error: P1001` | Prisma can't reach DB | Verify `DATABASE_URL` uses service name and `?sslmode=disable` for local postgres |
| Celery worker `[ERROR/MainProcess] consumer: Cannot connect` | Broker not ready | Add healthcheck to redis; worker must `depends_on: redis: condition: service_healthy` |

---

## Quick Diagnosis Commands

```bash
# View logs for a specific service
docker compose logs --tail=50 <service>

# Follow logs in real time
docker compose logs -f <service>

# Check exit code of a one-shot container
docker compose ps -a

# Shell into a running container
docker compose exec <service> sh

# Verify env vars loaded inside container
docker compose exec <service> env | grep DATABASE_URL

# Check inter-service connectivity from inside a container
docker compose exec app curl -s http://db:5432  # or the relevant port
```

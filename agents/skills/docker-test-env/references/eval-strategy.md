# Eval Strategy: docker-test-env Skill

## Goal

Verify the skill reliably produces a working `docker-compose.yml` test environment for diverse codebases — from simple Node apps to multi-service monorepos — and that the generated environment actually boots and passes a smoke test.

---

## Eval Dimensions

| Dimension | What We're Testing |
|---|---|
| **Detection accuracy** | Skill correctly identifies runtime(s), services, and dependencies from the codebase |
| **Compose correctness** | Generated `docker-compose.yml` is valid YAML and booting it succeeds (`docker compose up --wait`) |
| **Service wiring** | Services can reach each other (DB migrations run, app starts without connection errors) |
| **Smoke test** | A real HTTP request or CLI command returns the expected result |
| **Idempotency** | Running the skill twice produces a stable, non-conflicting environment |
| **Teardown** | `docker compose down -v` fully cleans up — no orphaned volumes or networks |

---

## Test Fixture Repos

Four representative repos covering the main variation axes:

### Fixture 1: Simple Node/Express + Postgres
- **Repo**: `fixtures/node-express-pg/`
- **Stack**: Node 20, Express, pg (no ORM), single DB
- **Why**: Most common pattern; baseline correctness check
- **Expected compose services**: `app`, `db` (postgres:16)
- **Smoke test**: `GET /health` → 200

### Fixture 2: Python/FastAPI + Redis + Celery
- **Repo**: `fixtures/python-fastapi-celery/`
- **Stack**: Python 3.12, FastAPI, Celery, Redis
- **Why**: Multi-service with a background worker; tests service dependency ordering
- **Expected compose services**: `api`, `worker`, `redis`
- **Smoke test**: `POST /tasks` → task enqueued; worker picks it up

### Fixture 3: Next.js (full-stack) + Prisma + Postgres
- **Repo**: `fixtures/nextjs-prisma/`
- **Stack**: Node 20, Next.js 14, Prisma ORM, Postgres
- **Why**: Tests ORM migration step as a compose `depends_on` + `command` pattern
- **Expected compose services**: `app`, `db`, `migrate` (one-shot)
- **Smoke test**: `GET /api/ping` → 200

### Fixture 4: Go microservices (2 services + shared DB)
- **Repo**: `fixtures/go-microservices/`
- **Stack**: Go 1.22, two HTTP services, shared Postgres, internal DNS via compose network
- **Why**: Multi-repo monorepo pattern; tests network aliasing and inter-service calls
- **Expected compose services**: `svc-a`, `svc-b`, `db`
- **Smoke test**: `svc-a` calls `svc-b` via internal hostname → both healthy

---

## Eval Cases (evals.json structure)

```json
[
  {
    "id": 1,
    "fixture": "node-express-pg",
    "prompt": "Set up a docker-compose test environment for this codebase.",
    "expectations": [
      "Generates a valid docker-compose.yml",
      "Includes postgres service with correct image tag",
      "App service has DATABASE_URL env var pointing to db service",
      "docker compose up --wait succeeds",
      "GET /health returns 200"
    ]
  },
  {
    "id": 2,
    "fixture": "python-fastapi-celery",
    "prompt": "Create a local test environment with docker-compose for this project.",
    "expectations": [
      "Generates api, worker, redis services",
      "worker depends_on redis",
      "CELERY_BROKER_URL points to redis service",
      "docker compose up --wait succeeds",
      "POST /tasks enqueues successfully"
    ]
  },
  {
    "id": 3,
    "fixture": "nextjs-prisma",
    "prompt": "I need to run this app locally in docker for testing.",
    "expectations": [
      "Includes a migrate one-shot service that runs prisma migrate deploy",
      "app depends_on migrate (condition: service_completed_successfully)",
      "DATABASE_URL correctly formed for prisma",
      "docker compose up --wait succeeds",
      "GET /api/ping returns 200"
    ]
  },
  {
    "id": 4,
    "fixture": "go-microservices",
    "prompt": "Set up a docker-compose environment for this multi-service Go repo.",
    "expectations": [
      "Both services defined with correct build contexts",
      "Services share a custom network",
      "svc-a has env var pointing to svc-b by service name",
      "docker compose up --wait succeeds",
      "svc-a /health returns 200, svc-b /health returns 200"
    ]
  }
]
```

---

## RED-GREEN-REFACTOR Plan

### RED Phase (Baseline)

Run each eval **without** the skill loaded. Document:
- Does the agent produce a `docker-compose.yml` at all?
- Does `docker compose up --wait` succeed?
- What rationalizations appear when the compose fails to boot?

**Expected baseline failures:**
- Missing `depends_on` for migration services
- Wrong port mappings (using host port instead of container port for inter-service communication)
- Missing network declarations for multi-service repos
- Incorrect DATABASE_URL format (e.g., `localhost` instead of service name)

### GREEN Phase

Write the SKILL.md to address the documented failures. Key sections needed:
- **Service discovery**: how to read `package.json`, `pyproject.toml`, `go.mod`, Dockerfile to infer services
- **Network wiring rule**: always use service names, never `localhost`, for inter-service URLs
- **Migration pattern**: one-shot migrate service with `depends_on` condition
- **Healthcheck guidance**: add healthchecks so `--wait` works reliably

### REFACTOR Phase

After GREEN, test edge cases:
- Repo with no Dockerfile (skill must generate one)
- Monorepo with mixed languages
- Service that needs a build arg at compose time

Capture any new rationalizations and add counters.

---

## Verification Ladder

| Level | Check | Tool |
|---|---|---|
| 1 (cheapest) | Valid YAML | `docker compose config` |
| 2 | Services boot | `docker compose up --wait` |
| 3 | Smoke test passes | `curl` / language-specific health check |
| 4 (full) | Idempotency + teardown | Run twice, `docker compose down -v` |

Default: run levels 1-3 for each eval. Level 4 on final validation only.

---

## Acceptance Criteria

The skill is considered ready when:
1. All 4 fixture evals pass levels 1-3 verification
2. No rationalization loopholes remain (agent never outputs `localhost` for inter-service URLs)
3. `quick_validate.py` passes on the skill directory

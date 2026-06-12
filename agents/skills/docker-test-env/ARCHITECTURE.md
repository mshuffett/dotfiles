# docker-test-env Skill — Architecture Document

Source: render-deploy skill (render-oss/skills @ skills/render-deploy/)
Adapted for: Creating local docker-compose test environments from codebases

---

## Overview

The render-deploy skill is a structured, multi-file Claude skill that:
1. Analyzes a codebase to detect runtime/framework/deps
2. Generates a `render.yaml` Blueprint (IaC) OR creates services via MCP
3. Validates, commits, and deploys to Render's cloud platform
4. Verifies health post-deploy

The docker-test-env skill will follow the same architecture but target **local docker-compose environments** instead of a cloud platform. The core analysis pipeline is directly reusable; the output artifacts change from `render.yaml` to `docker-compose.yml` (+ `Dockerfile`s if needed).

---

## File-by-File Analysis

### SKILL.md (Main Entry Point)

**What it does:**
- Frontmatter: `name`, `description`, `license`, `compatibility`, `metadata`
- Happy path onboarding: short questions before deep analysis
- Dispatch logic: choose between Blueprint method vs Direct Creation
- Prerequisites checking (git remote, MCP, CLI, auth, workspace)
- Full step-by-step workflow for each method
- Post-deploy verification and triage sections
- Cross-references to all `references/` and `assets/` files

**Key structural patterns to reuse:**
- Frontmatter format (name, description, license, compatibility, metadata.version)
- "Happy path" section (2-3 upfront questions to reduce friction)
- "When to use this skill" section
- Method selection heuristic table
- Prerequisites check as an ordered numbered list
- Step-by-step workflow with `###` headers
- Cross-references using relative Markdown links: `[text](references/file.md)`
- Post-action verification section
- Triage/troubleshooting pointer at the end

**What to adapt:**
- Replace Render-specific prerequisites (MCP, CLI, API keys) with Docker prerequisites (`docker`, `docker compose` CLI check)
- Replace "Blueprint vs Direct Creation" with a simpler "auto-generate vs interactive" distinction
- Remove Git remote requirement (docker-compose works locally)
- Replace deeplink generation with `docker compose up` instructions
- Replace workspace/auth sections with local Docker daemon checks

**What to drop:**
- All MCP tool references (`list_services()`, `create_web_service()`, etc.)
- Git provider OAuth section
- Render Dashboard deeplink generation
- Preview environments section
- Render CLI installation instructions
- Workspace selection section

---

### references/codebase-analysis.md

**What it does:**
Checklists for detecting runtime, framework, package manager, build/start commands, env vars, datastores, and port binding from the codebase. Covers Node.js, Python, Go, static sites, Docker projects.

**Reuse: HIGH — nearly 1:1**
- Same detection logic applies: read `package.json`, `requirements.txt`, `go.mod`, `Dockerfile`, `docker-compose.yml` (if partial)
- Package manager detection (npm/pnpm/yarn/bun, pip/poetry/uv) maps directly to Docker image construction
- Port detection still needed (`$PORT` env var usage)
- Datastore detection (PostgreSQL, Redis) maps to docker-compose `services:` entries

**Adaptation needed:**
- Add detection for existing `Dockerfile` / `docker-compose.yml` in the repo
- Add: detect if app already has a health check endpoint or equivalent
- Add: detect multi-service repos (monorepos with multiple apps)
- Add: look for `.env.example` or `.env.sample` to infer required env vars
- Remove Render-specific sections (Render `runtime.txt`, Render env var formats)

---

### references/blueprint-spec.md

**What it does:**
Full specification for `render.yaml` — service types, runtimes, env var patterns, database definitions, scaling, health checks, build filters, projects/environments, preview environments.

**Reuse: LOW — replace with docker-compose spec**
- The concept of "spec reference" (a document describing the output artifact schema) maps directly
- Service type concepts (web, worker, cron, static, private) map to docker-compose service patterns
- Env var patterns (hardcoded, secrets, generated, from-database) map to docker-compose `environment:` and `.env` files
- Database/Redis sections map to official Docker Hub images

**Replacement document: `references/compose-spec.md`**
Should document:
- `docker-compose.yml` schema (version, services, volumes, networks)
- Service definition fields: `image`, `build`, `ports`, `environment`, `env_file`, `volumes`, `depends_on`, `healthcheck`, `restart`
- How to wire services together (internal DNS via service names)
- How to declare databases (postgres, redis official images)
- Volume patterns for persistence
- Network patterns for isolation
- Override files (`docker-compose.override.yml`) for local dev vs test

---

### references/configuration-guide.md

**What it does:**
Best practices for env vars (hardcoded vs secrets vs generated vs DB refs), port binding requirements, build command patterns (non-interactive flags), DB connection pooling examples, free-tier limits, health check implementation.

**Reuse: MEDIUM**

Reusable sections:
- Port binding requirement (`0.0.0.0:$PORT`) and code examples per language — identical for Docker
- Build command non-interactive flags — directly applicable to `RUN` statements in Dockerfiles
- Health check endpoint implementation examples (Node/Python/Go) — reuse verbatim
- DB connection patterns (connection pooling, SSL) — reuse verbatim

Adaptation needed:
- Replace "3 categories of env vars" (hardcoded / sync:false / generateValue) with docker-compose patterns:
  - `environment:` block for hardcoded values
  - `.env` file with `.env.example` for secrets
  - No "sync: false" concept — secrets go in `.env` (gitignored)
- Replace DB fromDatabase references with compose service name DNS (e.g., `postgresql://postgres:5432/db`)
- Remove free-tier limits section entirely
- Replace "render.yaml checklist" with "docker-compose.yml checklist"

**Replacement document: `references/configuration-guide.md`** (adapted, same name)

---

### references/deployment-details.md

**What it does:**
Quick reference for MCP tools, CLI commands, framework template pointers, and common issues.

**Reuse: LOW — mostly Render-specific**

Reusable:
- "Common Issues" section patterns (port binding, missing env vars, build hangs, DB connection failures, SPA 404s) — same root causes, adapt the fixes
- Template pointers section structure

**Replacement: `references/quickref.md`**
Should contain:
- `docker compose` CLI quick reference (`up`, `down`, `logs`, `exec`, `ps`, `build`)
- Template pointers (same structure, pointing to adapted asset files)
- Common issues with docker-compose-specific fixes

---

### references/direct-creation.md

**What it does:**
MCP tool call examples for creating web services, static sites, cron jobs, databases, and key-value stores directly without a render.yaml.

**Reuse: DROP**
No equivalent concept for docker-compose. The docker-test-env skill generates `docker-compose.yml` directly (there's no "direct creation" API). Remove entirely.

---

### references/error-patterns.md

**What it does:**
Compact table mapping log signatures to likely causes and quick fixes.

**Reuse: HIGH — adapt the table**

Keep these patterns (same root causes in Docker):
- `KeyError` / `not defined` / `missing environment` → missing env var
- `EADDRINUSE` → port binding conflict (but fix is `ports:` mapping, not bind address)
- `Cannot find module` / `ModuleNotFoundError` → missing dependency in image
- `ECONNREFUSED` / `connection refused` → service not ready, need `depends_on` + healthcheck
- `exit 137` / `out of memory` → OOM, add `mem_limit` to compose service
- `Command failed` / `build failed` → bad Dockerfile RUN step

Add Docker-specific patterns:
- `No such file or directory` in container → COPY path wrong in Dockerfile
- `permission denied` → file ownership issue in container
- `network not found` → missing network definition in compose
- Container exits immediately → CMD/ENTRYPOINT wrong or app crashes on startup
- `port is already allocated` → host port conflict, change `ports:` mapping

---

### references/post-deploy-checks.md

**What it does:**
5-step post-deploy verification: confirm deploy status, verify health endpoint, scan error logs, verify env vars + port binding, redeploy only after fixing.

**Reuse: HIGH — adapt terminology**

Adapted version (`references/post-start-checks.md`):
1. Confirm all containers are running: `docker compose ps`
2. Verify service health endpoint or root URL responds 200
3. Scan logs for errors: `docker compose logs --tail=50 <service>`
4. Verify env vars loaded: `docker compose exec <service> env | grep KEY`
5. Check inter-service connectivity: `docker compose exec <service> curl http://<other-service>:<port>/health`

---

### references/runtimes.md

**What it does:**
Per-language runtime guide: supported versions, version specification methods, package managers, build/start commands, popular frameworks, example render.yaml snippet.

**Reuse: MEDIUM — repurpose as Dockerfile patterns**

The framework detection and build/start command patterns are directly useful for generating Dockerfiles. The structure maps to:
- Base image selection (e.g., `node:20-alpine`, `python:3.11-slim`, `golang:1.22-alpine`)
- `RUN` commands for dependencies
- `CMD` for start command

**Replacement: `references/dockerfile-patterns.md`**
Per-language Dockerfile templates covering:
- Node.js (with multi-stage build)
- Python (pip/poetry/uv)
- Go (multi-stage, static binary)
- Ruby
- Rust (multi-stage)
- Static sites (nginx serving)

---

### references/service-types.md

**What it does:**
Detailed explanation of 5 service types (web, worker, cron, static, pserv) with use cases, characteristics, required config, best practices, comparison table.

**Reuse: MEDIUM — adapt service type concepts**

Service type mapping to docker-compose patterns:

| Render type | docker-compose equivalent |
|-------------|---------------------------|
| `web` | service with `ports:` exposed, `healthcheck:` |
| `worker` | service with no ports, `restart: unless-stopped` |
| `cron` | service with no ports, run via `docker compose run` or host cron + `docker compose exec` |
| `static` | nginx service serving built files from a volume |
| `pserv` | service with no ports exposed to host, only on internal network |

**Replacement: `references/service-patterns.md`**
Document the 5 docker-compose service patterns with example snippets.

---

### references/troubleshooting-basics.md

**What it does:**
Classify failure (build/startup/runtime), quick checks per class, pointer to error-patterns.md.

**Reuse: HIGH — adapt terminology**

Adapted version (`references/troubleshooting-basics.md`):
- Build failure → `docker compose build` errors, bad Dockerfile
- Startup failure → container exits immediately, check `docker compose logs`
- Runtime/health failure → service up but returning errors

---

### assets/docker.yaml (render-deploy template)

**What it does:**
render.yaml template for Docker-runtime services. Includes web service with `runtime: docker`, Dockerfile path, env vars (DB refs, secrets), postgres + redis databases, and a commented multi-stage Dockerfile example.

**Reuse: PARTIAL**
The commented Dockerfile example is very useful as a reference. The render.yaml structure itself is replaced, but the docker-compose equivalent template is the primary asset.

**Replacement: `assets/docker-app/docker-compose.yml`** + `assets/docker-app/Dockerfile`

---

### assets/go-api.yaml

**Replacement: `assets/go-api/docker-compose.yml`** — Go web service + postgres, multi-stage Dockerfile

---

### assets/nextjs-postgres.yaml

**Replacement: `assets/nextjs-postgres/docker-compose.yml`** — Next.js + postgres

---

### assets/node-express.yaml

**Replacement: `assets/node-express/docker-compose.yml`** — Express API, simple single-service

---

### assets/python-django.yaml

**Replacement: `assets/python-django/docker-compose.yml`** — Django web + Celery worker + Celery beat + postgres + redis. Most complex template; very useful for multi-service compose patterns.

---

### assets/static-site.yaml

**Replacement: `assets/static-site/docker-compose.yml`** — nginx serving built static files, with volume mount of build output

---

## Structural Summary: What to Reuse, Adapt, Drop

| Component | Reuse | Adapt | Drop |
|-----------|-------|-------|------|
| SKILL.md structure/workflow | ✅ | ✅ | |
| SKILL.md Render prerequisites | | | ✅ |
| SKILL.md MCP tools | | | ✅ |
| SKILL.md Git remote requirement | | ✅ | |
| codebase-analysis.md | ✅ | ✅ (add Docker detection) | |
| blueprint-spec.md | | | ✅ → new compose-spec.md |
| configuration-guide.md | ✅ | ✅ (replace Render patterns) | |
| deployment-details.md (MCP cmds) | | | ✅ → new quickref.md |
| direct-creation.md | | | ✅ |
| error-patterns.md | ✅ | ✅ (add Docker patterns) | |
| post-deploy-checks.md | ✅ | ✅ (docker compose cmds) | |
| runtimes.md | ✅ | ✅ → dockerfile-patterns.md | |
| service-types.md | ✅ | ✅ → service-patterns.md | |
| troubleshooting-basics.md | ✅ | ✅ (minimal changes) | |
| assets/*.yaml (templates) | ✅ | ✅ → docker-compose equivalents | |

---

## Proposed File Structure for docker-test-env

```
~/.dotfiles/agents/skills/docker-test-env/
├── SKILL.md                          # Main entrypoint (adapted from render-deploy)
├── ARCHITECTURE.md                   # This file
├── references/
│   ├── codebase-analysis.md          # Adapted (add Docker detection)
│   ├── compose-spec.md               # New — docker-compose.yml schema reference
│   ├── configuration-guide.md        # Adapted (replace Render env var patterns)
│   ├── dockerfile-patterns.md        # New — per-language Dockerfile templates
│   ├── error-patterns.md             # Adapted (add Docker-specific patterns)
│   ├── post-start-checks.md          # Adapted from post-deploy-checks.md
│   ├── quickref.md                   # New — docker compose CLI quick reference
│   ├── service-patterns.md           # Adapted from service-types.md
│   └── troubleshooting-basics.md     # Adapted (minimal changes)
└── assets/
    ├── node-express/
    │   └── docker-compose.yml
    ├── nextjs-postgres/
    │   └── docker-compose.yml
    ├── python-django/
    │   └── docker-compose.yml
    ├── go-api/
    │   └── docker-compose.yml
    ├── static-site/
    │   └── docker-compose.yml
    └── docker-app/
        ├── docker-compose.yml
        └── Dockerfile.example
```

---

## Key Design Decisions for docker-test-env SKILL.md

### Workflow (adapted from render-deploy Blueprint method)

1. **Check prerequisites** — `docker --version`, `docker compose version`
2. **Analyze codebase** — use codebase-analysis.md
3. **Detect services needed** — web app + any datastores (postgres, redis, etc.)
4. **Generate docker-compose.yml** — using compose-spec.md + appropriate asset template
5. **Generate Dockerfile(s)** — if none exist, using dockerfile-patterns.md
6. **Generate .env.example** — all required env vars documented
7. **Validate** — `docker compose config` to check YAML validity
8. **Start environment** — `docker compose up -d`
9. **Verify** — post-start-checks.md checklist

### Env Var Strategy (replacing Render's sync:false / generateValue)
- Hardcoded non-secret values → `environment:` block in compose
- Secrets → `.env` file (gitignored) + `.env.example` (committed)
- Auto-generated secrets → document in `.env.example` with a `openssl rand -hex 32` suggestion
- Inter-service URLs → compose service name DNS (e.g., `DATABASE_URL=postgresql://postgres:5432/db`)

### Service Wiring (replacing fromDatabase / fromService)
- Database services use official images (`postgres:15`, `redis:7`)
- `depends_on` with `condition: service_healthy` for startup ordering
- Internal DNS: `http://<service-name>:<internal-port>`

### No Git Remote Required
Unlike render-deploy, docker-test-env works entirely locally. No Git push needed.

### Scope Boundary
This skill generates a **test/development** docker-compose environment. It is NOT:
- A production deployment skill
- A Kubernetes/cloud deployment skill
- A CI/CD pipeline configuration skill

---

## Critical render-deploy Patterns to Preserve

1. **Happy path onboarding** — ask 2 questions before deep analysis (reduces friction)
2. **Cross-reference structure** — `[see references/file.md](references/file.md)` keeps SKILL.md readable
3. **Asset templates** — per-framework starting points avoid re-generation from scratch every time
4. **Error pattern table** — compact log-signature → fix mapping is very high-signal
5. **Verification-first** — always verify after generating (docker compose config + up + health check)
6. **Fix before retry** — explicitly instruct not to restart without a code change

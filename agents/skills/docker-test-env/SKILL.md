---
name: docker-test-env
description: Create or update a reproducible local Docker test environment for an existing codebase, then launch and verify it with real HTTP / user-facing checks. Use when the user wants to dockerize a repo, replace managed dev infrastructure with local containers, stand up a preview stack, or prove a codebase actually runs locally in Docker.
license: MIT
metadata:
  author: local
  version: "2.1.0"
  category: local-dev
---

# Docker Test Environment

This skill creates working local Docker environments for existing repos. The
goal is not just a syntactically valid `docker-compose.yml`; the goal is a stack
that boots, responds, and can be exercised like a user would use it.

## When To Use It

Use this skill when the user wants to:
- Dockerize an app or monorepo for local testing
- Replace managed Postgres, Redis, or similar services with local containers
- Add missing Docker assets to a repo that already mostly works
- Prove an app can launch in a reproducible local environment

## First Questions

Before deep work, answer these:
1. What is the exact app or service under test?
2. Does the repo already have any Docker assets worth reusing?
3. Which supporting services are actually required for the verified flow?

If the target app is unclear in a monorepo, stop and identify the minimum
workspace slice before generating anything.

## Prerequisites

```bash
docker --version
docker compose version
```

If `docker compose` is missing but `docker-compose` is installed, use that and
note the limitation.

## Workflow

### 1. Inspect The Repo Before Editing

Start with direct repo reading. Do not generate Docker assets first and
reverse-engineer later.

- Read the actual manifests and runtime files: `package.json`, lockfiles, env
  files, Docker assets, app entrypoints, workspace config, migration config,
  and health routes.
- Inventory the real app shape: runtime, framework, package manager, build and
  start commands, monorepo boundaries, existing Docker assets, env files,
  datastores, background workers, migrations, health endpoints, and browser-
  visible routes.
- Prefer a short repo-local audit artifact such as
  `docs/docker-test-environment-audit.md`, but write it from direct inspection.
- Read [references/codebase-analysis.md](references/codebase-analysis.md) for
  stack-specific checks.

The audit note should capture:
- Target scope
- Existing runtime commands
- Required supporting services
- Current env sources
- Existing Docker assets
- Proposed changes
- Verification plan
- External systems that must stay external

### 2. Choose The Smallest Viable Compose Scope

Generate one `docker-compose.yml` for the environment under test.

- Reuse existing `Dockerfile`, `docker-compose.yml`, or service fragments if
  they are already close to correct.
- For monorepos, containerize only the minimum workspace graph needed to run the
  target app. Do not drag unrelated packages into the stack.
- If there is no `Dockerfile`, add the smallest deterministic Dockerfile that
  can build and run the target app.
- `scripts/generate_compose.py` may be used as a starting point for simple
  repos, but treat its output as a draft only. The source of truth is the repo
  itself.

Read [references/compose-patterns.md](references/compose-patterns.md) before
writing or revising the compose file.

### 3. Reuse Env Names; Only Change Targets

Do not rename environment variables unless the repo is already inconsistent and
you are intentionally fixing that inconsistency.

- Start from `.env.local`, `.env`, `.env.example`, docs, and runtime validation
  code.
- Keep names such as `DATABASE_URL`, `POSTGRES_URL`, `REDIS_URL`,
  `NEXT_PUBLIC_APP_URL`, and `BETTER_AUTH_URL` intact.
- Override only the values needed for the Docker environment. Prefer a dedicated
  `.env.docker` or compose `environment:` block.
- Rewrite hosts to Docker service names only for container-to-container traffic.
  Browser-visible URLs often still need `localhost`.
- Do not invent secrets when the repo already has usable local values.

Read [references/env-reconciliation.md](references/env-reconciliation.md) before
touching URLs or secrets.

### 4. Add Only The Dependencies The App Really Needs

- Add Postgres, Redis, MongoDB, MySQL, or other services only when the app
  actually uses them.
- Add a one-shot migration or seed step when schema setup is required before the
  first request succeeds.
- Prefer explicit health checks and `depends_on` health conditions.
- Persist stateful services with named volumes unless the user asked for a
  fully disposable stack.
- Keep ports predictable and documented.

Use the starter assets only as templates:
- [assets/node-express/](assets/node-express/)
- [assets/nextjs-postgres/](assets/nextjs-postgres/)
- [assets/python-django/](assets/python-django/)
- [assets/go-api/](assets/go-api/)
- [assets/static-site/](assets/static-site/)
- [assets/docker-app/](assets/docker-app/)

### 5. Launch And Verify Like A User

Bring the stack up, then prove it works.

- Run `docker compose config` and fix any schema errors first.
- Run `docker compose up --build -d` or `docker compose up -d --wait` when
  health checks are complete.
- Run migrations or seed steps when required.
- Wait for readiness with `scripts/wait_for_http.py <url>` or
  `scripts/health_check.sh`.
- Prefer existing Playwright, Cypress, or repo-native smoke tests when they
  cover the target flow.
- If there are no browser tests, hit a real app route and perform one meaningful
  action path when safe.
- For APIs, hit a real endpoint, not just a container health probe.
- Inspect logs after the first successful request to catch hidden runtime
  failures.

Use [references/post-start-checks.md](references/post-start-checks.md) and
[references/troubleshooting-basics.md](references/troubleshooting-basics.md)
during iteration.

### 6. Deliverables

Leave behind a usable environment, not just a draft file.

- `docker-compose.yml`
- Any `Dockerfile` or startup-script changes required to run the stack
- Any env template or override file needed for local or test use
- An audit note describing architecture, gaps, and modifications
- Verification evidence: exact commands, URLs checked, tests run, and unresolved
  limitations

## Decision Rules

- Prefer reusing existing Docker assets over generating new ones from scratch.
- Prefer one compose file over layered files unless the repo already depends on
  layering.
- Prefer repo-native commands over custom shell glue.
- Prefer fixing one failing dependency at a time over broad speculative rewrites.
- Stop and surface the constraint if a required external provider cannot be
  mocked, stubbed, or safely reused locally.

## References

- [references/codebase-analysis.md](references/codebase-analysis.md)
- [references/compose-patterns.md](references/compose-patterns.md)
- [references/env-reconciliation.md](references/env-reconciliation.md)
- [references/docker-compose-spec.md](references/docker-compose-spec.md)
- [references/dockerfile-patterns.md](references/dockerfile-patterns.md)
- [references/service-patterns.md](references/service-patterns.md)
- [references/configuration-guide.md](references/configuration-guide.md)
- [references/error-patterns.md](references/error-patterns.md)
- [references/post-start-checks.md](references/post-start-checks.md)
- [references/troubleshooting-basics.md](references/troubleshooting-basics.md)

---
name: agent-deploy-loop
description: Everything Agent ECS deployment workflow and pitfalls — build, push, deploy, and test iteration
type: feedback
---

Agent deploy iteration is slow (~10 min per cycle). Must be faster.

**Why:** Build → push → ECS rolling update → health check → test requires waiting for 4 ECS tasks to cycle. Apple Silicon builds need `--platform linux/amd64` via buildx or the image won't run on ECS.

**How to apply:**
- Always use `docker buildx build --platform linux/amd64` — never bare `docker build` on Mac
- Consider running the task watcher locally for testing (`pnpm --filter everything-agent dev`) before deploying. Needs env vars: `ORGANIZATION_ID`, `DAYTONA_API_KEY`, `DAYTONA_BASE_URL`, `GOOGLE_APPLICATION_CREDENTIALS`, `ENABLE_CONTAINER_EXECUTION=true`, `CONTAINER_PROVIDER=daytona`
- For agent code changes, test the specific module with unit tests FIRST before deploying
- The Daytona sandbox provider in `packages/sandbox` does NOT allow sending `resources` when creating from a snapshot — this was a production bug
- ECS deploy command: `aws ecs update-service --cluster everything-agent-cluster --service everything-agent-service --force-new-deployment`
- Dockerfile is `Dockerfile.agent` at repo root (NOT `apps/everything-agent/Dockerfile`)
- ECR: `636160605813.dkr.ecr.us-east-1.amazonaws.com/everything-agent:latest`

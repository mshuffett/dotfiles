# Memory

## Firestore Rules Deployment
When adding new Firestore collections, the security rules AND indexes must be **deployed** — not just written in the file. Always run `pnpm -C packages/firebase-config deploy:rules` after adding rules, and deploy indexes too if the query uses composite fields (`where` + `orderBy`). See [firestore-patterns.md](firestore-patterns.md) for details.

## Next.js Route Requirements
When adding new tabs/views that navigate via `router.push`, a corresponding `app/[orgSlug]/[projectSlug]/<tab>/page.tsx` file MUST exist or the URL will 404. The todo app uses file-based routing — client-side tab state alone isn't enough.

## Playwright Test Patterns
- Tests that manage their own auth use `test.use({ storageState: { cookies: [], origins: [] } })` and need the `chromium-no-auth` project in `playwright.config.ts`
- Use `{ exact: true }` for button names that are substrings of other button names (e.g., "Chat" vs "Open AI PM Chat")
- Use more specific text matchers when placeholder text partially matches description text

## Messaging Gateway ECS Deployment
The messaging gateway is deployed on AWS ECS Fargate and is live. Key details:
- **Cluster**: `messaging-gateway-cluster`
- **Service**: `messaging-gateway-service`
- **Port**: 4000 (no domain — ephemeral public IP, changes on task restart)
- **Health check**: `GET /health` returns `{"status":"ok"}`

To check status and find the public IP:
```bash
# Service status
aws ecs describe-services --cluster messaging-gateway-cluster --services messaging-gateway-service \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount}'

# Get task ARN
aws ecs list-tasks --cluster messaging-gateway-cluster --service-name messaging-gateway-service

# Get ENI from task (replace task ID)
aws ecs describe-tasks --cluster messaging-gateway-cluster --tasks <TASK_ID> \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text

# Get public IP from ENI
aws ec2 describe-network-interfaces --network-interface-ids <ENI_ID> \
  --query 'NetworkInterfaces[0].Association.PublicIp' --output text

# Hit health endpoint
curl http://<PUBLIC_IP>:4000/health
```

## Evolve Loop Design
Autonomous evolve loops game fitness functions — first run saturated at cycle 4 and coasted 92 cycles. Goals must verify behavior not file existence, need plateau detection, human checkpoints, and regression veto. See [evolve-loop-design.md](evolve-loop-design.md) for full rules.

## Agent Deploy Loop
ECS deploy iteration is slow (~10 min/cycle). Use `docker buildx --platform linux/amd64`, test locally first, and run unit tests before deploying. See [agent-deploy-loop.md](agent-deploy-loop.md).

## Agent Codex OAuth Debugging
When the Everything Agent returns "(no content)" with few output tokens, see [agent-codex-oauth-debugging.md](agent-codex-oauth-debugging.md) for the full debugging checklist — Codex endpoint stream behavior, OAuth credential verification, ECS env vars.

## Discord Ack Before Long Work
On Discord, post a quick "on it, doing X" before multi-step work so the channel isn't silent. See [feedback_discord_ack.md](feedback_discord_ack.md).

## Agent Teams
When creating or coordinating Claude Code agent teams, consult the atom at `~/.dotfiles/agents/knowledge/atoms/agent-teams.md`. Key points: requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` flag, use delegate mode (`Shift+Tab`) to prevent lead from implementing, aim for 5-6 tasks per teammate, avoid file conflicts by assigning non-overlapping files.

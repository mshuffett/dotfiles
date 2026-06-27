# Puffin Monorepo Memory

## Key Files (Committed, Source of Truth)

- **Instance inventory**: `infra/instances.yml` — production instance only; dev instances are Terraform-managed
- **Deploy script**: `scripts/deploy.sh` — automated build → backup → deploy → verify
- **Deploy docs**: `docs/deploying.md` — deploy, backup, rollback, troubleshooting
- **Infrastructure docs**: `docs/infrastructure.md` — AWS account, SSM access, health endpoints, IAM, networking, Terraform
- **Onboarding**: `docs/onboarding.md` — new developer setup
- **Terraform (prod)**: `infra/terraform/openclaw-ec2/` — production instance, IAM, SG (state committed)
- **Terraform (dev)**: `infra/terraform/dev-instance/` — dev instances via workspaces (state local-only)

## Deployments (Ephemeral State)

- **Production EC2** (`puffin-openclaw`): ACTIVE — READ-ONLY, never deploy without explicit confirmation
- **Dev instances**: Terraform-managed via `infra/terraform/dev-instance/` (workspace per developer). No active dev instances as of 2026-02-23.
- **Railway**: STOPPED since Feb 2025. No longer used.

**Default to dev instance for deployments/testing.** Only touch production with explicit user confirmation.
**Never create instances via raw `aws ec2 run-instances`** — always use Terraform.

## Team

| Member | GitHub | IAM User | Policy |
|---|---|---|---|
| Michael | mshuffett | `michael` | Full account |
| Jeremy | jkarmel | `jeremy` | `PuffinDevAccess` |

## Model / Auth (prod agents)

- Agents run on **AWS Bedrock Opus 4.6** via long-term Bedrock API key (`AWS_BEARER_TOKEN_BEDROCK`). See [puffin-bedrock-model](puffin-bedrock-model.md). Old `openai-codex/gpt-5.4` broke (refresh_token_reused).
- Operating the box via SSM: [puffin-ssm-runshell](puffin-ssm-runshell.md) (avoid parens; base64|bash; state dir `/data/.moltbot`).

## Channels (last checked 2026-05-21)

| Channel | Account | Status |
|---|---|---|
| Telegram | `main` (@art_owl_bot) | Healthy — now on Bedrock Opus 4.6 (2026-05-21) |
| Telegram | `michael-bot` (@Michael91Bot) | Healthy |
| WhatsApp | `default` (+17035173349) | **Logged out** (401 loop) — needs re-link via `openclaw channels login` |

## Containers on EC2

- `puffin-openclaw-1` — main OpenClaw instance
- `openclaw-sbx-agent-michael-bot-*` — sandboxed WhatsApp auto-provisioned agent

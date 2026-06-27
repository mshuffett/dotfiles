---
name: puffin-bedrock-model
description: Production OpenClaw agents run on AWS Bedrock Opus 4.6 via a long-term Bedrock API key; how auth/model is wired
metadata: 
  node_type: memory
  type: project
  originSessionId: 6219483b-ebc7-4702-92dd-97d2f601a02f
---

As of 2026-05-21 the production `puffin-openclaw` agents (incl. the Telegram `art` bot) run on **AWS Bedrock Claude Opus 4.6** (`amazon-bedrock/us.anthropic.claude-opus-4-6-v1`, fallback `...-opus-4-5-...:0`). Previously they used `openai-codex/gpt-5.4`, whose OAuth refresh broke (`refresh_token_reused`) → Telegram replied "something went wrong."

**Key wiring facts (verify before relying):**
- The runtime is `@mariozechner/pi-coding-agent` (embedded). It does **NOT** use the EC2 instance role for Bedrock and there's no flag to auto-mint. It requires **`AWS_BEARER_TOKEN_BEDROCK`** in the container env (also reads `AWS_REGION`).
- Auth = a **long-term Bedrock API key** (no expiry) from dedicated IAM user **`puffin-bedrock`** (inline policy `bedrock-invoke`: needs `bedrock:CallWithBearerToken` + `InvokeModel*`). Created via `aws iam create-service-specific-credential --service-name bedrock.amazonaws.com`.
- Secret lives in **SSM Parameter Store SecureString `/puffin/bedrock-api-key`** and is written to `/opt/puffin/puffin.env` as `AWS_BEARER_TOKEN_BEDROCK`. Instance role `puffin-openclaw-ec2` got inline policy `puffin-openclaw-ssm-bedrock-read` (ssm:GetParameter + kms:Decrypt via ssm) to fetch it on the box.
- **Per-agent model override** lives in `openclaw.json` → `agents.list[].model` (e.g. `art`), which takes precedence over `agents.defaults.model`. Both were set to 4.6/4.5. Changing only the default does nothing for `art`.
- **Opus 4.7 is NOT usable yet**: runtime catalog returns `Unknown model` (separate from AWS access). Its Bedrock agreement IS already accepted (so it'll work once OpenClaw's catalog updates — just bump the model ref). Setting 4.7 primary adds ~8s/msg penalty before fallback; don't.
- `[bedrock-discovery] Failed to discover Bedrock models` is harmless cosmetic noise; invocation works.

Config/IAM applied via AWS CLI + SSM, NOT Terraform (a `terraform apply` risks replacing the prod instance via `data.aws_ami.ubuntu` most_recent — see [[puffin-ssm-runshell]]). Reflect in `infra/terraform/openclaw-ec2/main.tf` only if importing to state.

Separate pre-existing issue: WhatsApp `default` (+17035173349) is logged out (401 loop) and needs re-link (`openclaw channels login`).

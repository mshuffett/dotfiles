---
name: waycraft-bedrock-iam-user
description: "The waycraft-web app's runtime AWS identity and how its Bedrock permissions are granted"
metadata: 
  node_type: memory
  type: project
  originSessionId: a2e38b67-3779-4141-abea-a2f8b8fa4410
---

The waycraft-web app (local `.env.local` AND Vercel prod) runs as IAM user **`arn:aws:iam::636160605813:user/waycraft-bedrock`** — not an admin. Locally `pnpm dev` can fall back to michael's admin profile via `~/.aws`, but **Vercel has no profile fallback**, so prod is strictly `waycraft-bedrock`.

**Why:** A model only works in prod if `waycraft-bedrock`'s IAM policy allows `bedrock:InvokeModel` on that model's inference-profile AND foundation-model ARNs. The original `BedrockInvokeClaude` inline policy hard-coded only Sonnet 4.5/4.0 ARNs, so when the homepage moved to Sonnet 4.6 it caused a 403 (`not authorized to perform bedrock:InvokeModel`) for a cofounder and would have broken prod.

**How to apply:** On 2026-06-05 a broad inline policy **`BedrockInvokeAny`** was added to this user — `bedrock:InvokeModel` + `bedrock:InvokeModelWithResponseStream` on `Resource: "*"` — so it can call any Bedrock model. The narrow `BedrockInvokeClaude` policy is now redundant. The admin user `michael` has `AdministratorAccess` (why models "work for Michael but not the cofounder/prod"). Account-level model access is separate — see [[bedrock-model-access-verification]].

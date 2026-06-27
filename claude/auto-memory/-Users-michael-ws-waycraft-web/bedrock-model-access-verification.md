---
name: bedrock-model-access-verification
description: How to truthfully check whether a Bedrock model is usable on the waycraft AWS account (636160605813)
metadata: 
  node_type: memory
  type: reference
  originSessionId: a2e38b67-3779-4141-abea-a2f8b8fa4410
---

To know whether an Anthropic model is actually usable on AWS Bedrock account **636160605813** (us-east-1), **run a live Converse call** — do not trust the status APIs.

- `aws bedrock get-foundation-model-availability` flags are **unreliable on this account**: they reported `authorizationStatus=AUTHORIZED`, `entitlementAvailability=AVAILABLE` for Opus 4.7 and 4.8 even though invocation fails with `permission_error: "... is not available for this account"`. Only a real Converse call tells the truth.
- Newer models require a **cross-region inference profile**, NOT the bare on-demand ID: call `us.anthropic.claude-sonnet-4-6` / `us.anthropic.claude-opus-4-6-v1` (note the `-v1` quirk on 4.6) / `global.*`, never `anthropic.claude-sonnet-4-6`. The bare ID returns `ValidationException: on-demand throughput isn't supported`.

Verified working on this account (as of 2026-06-05): Sonnet 4.6; Opus 4.6, 4.5, 4.1; Haiku 4.5.
Blocked at AWS account-model-access level (agreement accepted + IAM allows, but AWS gates them): **Opus 4.7 and 4.8** — open AWS support case `177961264200229` tracks enablement.

Two distinct failure modes seen — don't confuse them:
- `permission_error: "...not available for this account"` → **account-level model access** (AWS gate; fix via Bedrock console Model access / support case).
- `403 ... not authorized to perform bedrock:InvokeModel ... no identity-based policy` → **IAM** on the calling user (fix on the user's policy).

Related: [[waycraft-bedrock-iam-user]]

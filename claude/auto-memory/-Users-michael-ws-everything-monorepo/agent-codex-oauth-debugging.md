---
name: Agent Codex OAuth Debugging
description: How to diagnose Everything Agent returning empty "(no content)" responses — Codex subscription endpoint stream behavior and OAuth credential flow
type: reference
originSessionId: fc7039cb-5a92-4ac0-8e41-2469b084f56a
---
## Symptom

Tasks go ready → completed with no work done. Messages show `"(no content)"` with very few output tokens (6-28). The model name in the response is `gpt-5.4`.

## Root Cause (April 2026)

The OpenAI Codex **subscription endpoint** (`chatgpt.com/backend-api/codex/responses`) streams output items via `response.output_item.done` events but returns `output: []` in the final `response.completed` payload. The agent's `collectFinalResponse()` only read from `response.completed`, losing all tool calls.

**Why:** `normalizeContentFromAPI()` converts an empty content array to `"(no content)"`. The query loop sees no tool_use blocks and exits. The task auto-completes.

## Fix Applied

- `openai-codex-runtime-adapter.ts`: `collectFinalResponse()` now accumulates items from `response.output_item.done` and backfills when `response.completed` has empty output.
- `firestore-query-manager.ts`: Guard checks if all assistant messages are empty before auto-completing. Marks task FAILED with diagnostic message instead.

## Debugging Checklist (for similar future issues)

1. **Check the message in Firestore**: Query `messages` collection by `taskId`. Look at `message.content` for `"(no content)"` and `message.usage.output_tokens` for suspiciously low counts.
2. **Check ECS logs**: `aws logs filter-log-events --log-group-name "/ecs/everything-agent" --filter-pattern "<keyword>"`
   - `"EXECUTION SERVICE RESOLUTION"` — confirms Daytona/local/docker path
   - `"OpenAI"` — check for API key warnings
   - `"WARN"` — credential issues surface here
   - `"output_tokens"` — see actual token counts
3. **Check OAuth credentials**: `aws secretsmanager get-secret-value --secret-id "everything-agent/openai-oauth"` — verify token exists and isn't expired (decode JWT exp field)
4. **Test the endpoint directly**: Use curl with `stream: true` to hit `chatgpt.com/backend-api/codex/responses` with the OAuth token
5. **Check ECS env vars**: `aws ecs describe-task-definition --task-definition everything-agent --query 'taskDefinition.containerDefinitions[0].environment'`
   - `PRIMARY_PROVIDER` should match available credentials
   - `PROVIDER_AUTH_STORAGE=aws` enables Secrets Manager credential resolution
   - `LARGE_MODEL_NAME` is the model sent to the API

## Key Files

- `apps/everything-agent/src/services/llm-runtime/openai-codex-runtime-adapter.ts` — OpenAI SDK adapter, stream collection
- `packages/provider-auth/src/providers/openai.ts` — OAuth fetch wrapper, URL rewriting to Codex endpoint
- `packages/provider-auth/src/fetch-wrapper.ts` — Credential resolution order (AWS SM → env → file → fallback)
- `packages/provider-auth/src/storage-aws.ts` — AWS Secrets Manager credential storage
- `apps/everything-agent/src/task-watcher/services/firestore-query-manager.ts` — Task conversation loop, auto-completion logic
- `apps/everything-agent/src/utils/messages.tsx` — `normalizeContentFromAPI()`, `isEmptyMessageText()`

## Auth CLI Tools

- `pnpm auth:login <provider>` — Interactive OAuth login
- `pnpm auth:sync` — Sync local credentials to AWS Secrets Manager
- `pnpm auth:push` — Push credentials to AWS
- Credentials stored at `~/.everything-ai/auth.json` (local) or `everything-agent/<provider>-oauth` (AWS SM)

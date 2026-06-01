Found relevant prior work across two systems. Here's what we used before:

---

## Linq Pipeline — DB-backed queue with Drizzle/Postgres

The most complete queue implementation is in `apps/api/lib/linq/draft-queue.ts`. It uses a `linqReplyDrafts` table as the queue store rather than Redis or an in-memory queue. The pattern:

- **Enqueue**: `enqueueReplyDraft()` inserts a row with `status: "pending"` and uses `onConflictDoNothing` on the inbound message ID to deduplicate
- **Status states**: `pending | sent | edited_sent | manual_sent | dismissed | failed`
- **Processing**: fire-and-forget via `agent-trigger.ts` — `triggerInboundReplyWorkflow()` calls `processInboundReplyWorkflow().catch(console.error)` (no await, errors logged but not re-thrown)
- **Recovery**: `recovery-service.ts` runs as a cron/manual/startup job that scans for missed inbound messages and re-queues them with the same workflow function. Tracks `lastBackfillRunAt` in a settings table with a configurable overlap window to avoid gaps

Key decisions from that implementation:
- No Redis/BullMQ — used Postgres rows directly via Drizzle because the job payload was already there and throughput was low enough
- `onConflictDoNothing` is the dedup mechanism (idempotent inserts)
- Recovery/cron is a separate concern from the hot path — the webhook triggers fire-and-forget, the cron backstops missed events

---

## Everything Agent — Firestore task queue

Earlier (Jan 2026, `everything-monorepo`), we also designed a system where:
- Tasks live in Firestore with statuses: `todo → ready → in_progress → review → completed | failed | cancelled`
- Workers pull tasks off by watching/querying for `ready` status
- The discussion was: "worker would pull off the job queue and if it shut down it would try to release and the job would have the sandbox url on it basically and it would just keep that thing alive" — meaning the job holds a reference to a live sandbox container, and the worker is responsible for releasing it if it dies
- No explicit dead-letter in the Firestore version — failure was tracked via `TaskStatus.FAILED`

---

## What approach to use now

Depends on your infra and throughput:

**If you're already on Postgres (Drizzle):** Copy the linq pattern. A `jobs` table with `status` + `onConflictDoNothing` on a natural dedup key is simple, observable, and survives restarts. Add a cron recovery sweep if your trigger mechanism can miss events.

**If you need concurrency / prioritization / retry backoff:** BullMQ + Redis is the right call. We haven't built with it directly in these projects but it came up in the open_combinator discussion as the intended direction for "retry logic, network-aware, background queue, graceful failure."

**If you're extending the everything agent task system:** Firestore with status polling is already in place — use `TaskStatus` enum and query for `ready` tasks.

---

What's the new queue for specifically? That'll determine whether to extend one of these or start fresh.

Yes — found it. The decision is documented in `/Users/michael/ws/rehoboam.worktrees/session-0110-c4e0be/docs/agent/DECISIONS.md` as D004, dated 2025-01-10.

The specific reason was that four options were evaluated:

1. **BullMQ** — mature, Redis-backed, good DX
2. **Agenda** — MongoDB-based, but you weren't using Mongo
3. **pg-boss** — Postgres-based, which would add load to the main DB
4. **Custom Redis pub/sub** — ruled out as too much custom code

BullMQ won because:
- Redis was **already in the stack** for caching and locks, so no new infrastructure
- It has **built-in retries, delays, and rate limiting** out of the box
- Bull Board is available for a dashboard

The key deciding factors were (a) not wanting to add load to the main Postgres DB (which ruled out pg-boss), (b) not wanting to maintain a custom pub/sub solution, and (c) Redis already being present so BullMQ had no additional infrastructure cost.

The context was async processing for the redaction pipeline and webhook delivery in the rehoboam project.

---
name: release-process-next-steps
description: Plan to build a detailed release process with release branches, manual testing, and event verification for the behavioral analytics PR
type: project
---

When Michael returns, we need to create a more detailed release process that includes:

**Why:** The current `docs/release-process.md` is a high-level checklist with a TODO for CWS submission. It doesn't cover release branches, manual testing flows, or the specific verification needed for behavioral analytics (events reaching BigQuery).

**How to apply:**
1. Define release branch strategy (e.g., `release/v{VERSION}` cut from main)
2. Add manual testing steps Michael will personally run to verify events flow through to BigQuery
3. Include QA handoff to Michelle with the `qa-test-plan.md` we wrote
4. Document the CWS submission flow (still a TODO in the existing process)
5. Add E2E verification: Michael enables `behavioral_enabled` via Remote Config, browses, checks BigQuery for his events
6. Consider whether to update `docs/release-process.md` or create a separate behavioral-analytics-specific release checklist

**Current state (2026-03-17):**
- All infrastructure deployed (event-ingest prod+dev, BigQuery sinks, Remote Config on both Firebase projects)
- Full E2E verified: extension flush → Cloud Function → BigQuery (12 real events confirmed)
- QA test plan written at `apps/extension/docs/qa-test-plan.md`
- CDP interception bug documented: Fetch.enable in SW context consumes requests, so CDP-based tests don't verify server delivery
- New `flush-bigquery-verify.test.ts` runs without CDP and confirms events reach the server

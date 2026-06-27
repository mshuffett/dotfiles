# Open Batch Project Memory

## Safety Rules

- **Never toggle `companies_revealed` setting** in the `settings` table. This controls whether companies are visible to investors on the investor page. Changing it affects all real users immediately.
- **Never send emails to non-AgentMail addresses during testing.** Expressing interest triggers real introduction emails. Only express interest in companies whose founders have `@agentmail.to` emails. Always verify the founder's email before any interest action.
- When testing interest flows on prod, use badge profile pages (`/b/<badgeId>`) instead of the investor grid, since badge profiles work regardless of reveal setting.

## Test Accounts

- Test investor: `impossiblebutter702@agentmail.to` (user ID: `4536757f-90a0-46a5-a495-774bf2f289c0`)
- Test founder: `victoriouschart450@agentmail.to` (badge ID: `OB-TEST-001`)
- Test company: "TestIntro Corp" (ID: `468eb2d5-839b-4a5c-ad9c-6f9a609fe1bd`)

## AgentMail API Notes

- Message list returns `messageId` field (not `id`)
- `client.inboxes.messages.get()` may throw JSON errors; use raw `fetch` as fallback
- Magic link URLs are in the `preview` field of list responses, not in `text_body`/`html_body`
- Prod magic link endpoint: `POST https://www.openbatch.ai/api/auth/sign-in/magic-link`
- Must use `www.openbatch.ai` for API calls (non-www returns 307 redirect)

## Architecture

- Interest flow: investor expresses interest -> immediate two-way introduction email (no double opt-in)
- `lib/interests.ts` has shared `recordInterestAndIntroduce()` used by server action and API route
- `POST /api/interests` requires `Authorization: Bearer $ADMIN_API_SECRET`
- Interests table uses `company_id` (not `founder_id`), unique on `(investor_id, company_id)`)

## References

- [Vercel preview bypass](reference_vercel_bypass.md) — how to access preview deployments without SSO

# Alumni of YC — Project Memory

## Open Issues

### Magic link email may contain localhost URL
- **Symptom**: User reported sign-in link sending to localhost on production
- **Root cause candidates**:
  1. `BETTER_AUTH_URL` env var not read at runtime (line 74 in `lib/auth.ts`)
  2. Email sent from older deployment before env var was set
  3. User was on a Preview deployment (no `BETTER_AUTH_URL` set for Preview env)
- **Localhost fallback locations**:
  - `lib/auth.ts:74` — magic link email URL
  - `lib/actions/interests.ts:60` — founder dashboard link in interest notification emails
- **Verification needed**: Check actual email URL, confirm which deployment served it
- **Fix if Preview**: `vercel env add BETTER_AUTH_URL preview` → `https://alumniofyc.com`

## Key Architecture

- **Auth**: better-auth with magic link plugin, Resend for email delivery
- **DB**: Neon Postgres via drizzle-orm, `DATABASE_URL` env var
- **Deploy**: Vercel under composeai org, auto-deploy from main, domain: alumniofyc.com
- **Mobile UX**: Tinder-style swipe cards (framer-motion), vertical scrubber
- **Layout**: Flex-based dashboard shell, swipe view negates parent padding for full viewport

## Env Vars (Production)
- `BETTER_AUTH_URL` = `https://alumniofyc.com`
- `NEXT_PUBLIC_APP_URL` = `https://alumniofyc.com`
- `RESEND_API_KEY`, `BETTER_AUTH_SECRET`, Neon DB vars
- **Preview/Development missing**: `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`

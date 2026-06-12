# Env Reconciliation

Use the repo's existing env contract. The job is to make the values
local-friendly, not to invent a new naming scheme.

## Rules

- Keep existing env variable names.
- Prefer `.env.docker` or compose `environment:` overrides over editing
  `.env.local` destructively.
- Reuse existing secrets when the repo already has them locally.
- Use generated placeholders only for values that are safe to fake and not
  required for the verified flow.

## Connection String Rewrites

- `DATABASE_URL`, `POSTGRES_URL`:
  - Host should usually be the compose service name such as `postgres`
  - Port should be the container port, usually `5432`
  - Example: `postgres://postgres:postgres@postgres:5432/app`
- `REDIS_URL`:
  - Example: `redis://redis:6379`
- `MONGODB_URI`:
  - Example: `mongodb://mongo:27017/app`

If both `DATABASE_URL` and `POSTGRES_URL` exist, keep them aligned unless the
repo explicitly uses them differently.

## Browser URLs Vs Container URLs

This is the highest-risk source of false success.

- Browser-visible URLs usually need `localhost` or the public host port.
- Container-to-container URLs usually need the compose service name.
- `NEXT_PUBLIC_*` variables may be compiled into the browser bundle. Confirm
  whether the variable is used on the client, the server, or both before
  changing it.

Examples:

- Good server-side URL: `http://api:4000`
- Good browser-side URL: `http://localhost:4000`
- Risky browser-side URL: `http://api:4000`

## External Providers

- Keep external providers external when they are part of the intended flow and
  safe to reuse locally.
- Stub or gate them only when the verified flow does not depend on them.
- Do not silently break auth, email, blob storage, or payment paths by
  replacing a required secret with junk and claiming the stack works.

## Document The Decision

In the audit note, explain:

- Which variables were reused unchanged
- Which values were overridden for Docker
- Which services stayed external
- Which features were intentionally out of scope for the local test environment

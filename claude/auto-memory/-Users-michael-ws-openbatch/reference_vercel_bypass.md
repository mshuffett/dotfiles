---
name: Vercel preview bypass
description: How to access Vercel preview deployments without SSO — bypass tokens and URL pattern
type: reference
---

Vercel preview deployments for openbatch are protected by team SSO. Access without login by appending:

```
?x-vercel-protection-bypass=<token>
```

Two tokens exist (stored outside git, not in repo):
- Agent token: in `.env.local` as `VERCEL_PROTECTION_BYPASS`
- Michelle's token: separate, shared directly with her

**How to apply:** When using agent-browser to verify Vercel preview deployments, always append the bypass parameter. The token is in `.env.local`.

# Cloud Browsers & Human-in-the-Loop Takeover

agent-browser can drive a browser running **in the cloud** instead of locally, and
hand control to a human through a **live-view URL** (open it on any device — including
a phone — to click/type in the same session). This is the "agent drives, human steps
in for logins/CAPTCHAs/MFA, agent resumes" pattern.

## Choosing a provider

Set the provider per-command with `-p <name>` or globally with `AGENT_BROWSER_PROVIDER`:

| Provider | Env to authenticate | Notes |
|----------|--------------------|-------|
| `kernel` | `KERNEL_API_KEY` | Cloud Chromium, live view, profiles, CDP. **Primary** here. |
| `browserbase` | `BROWSERBASE_API_KEY` | Purpose-built mobile live-view iframe. |
| `browserless` | `BROWSERLESS_API_KEY` | Hosted Chrome. |
| `browseruse` | `BROWSER_USE_API_KEY` | browser-use cloud. |
| `agentcore` | AWS creds | AWS Bedrock AgentCore (see `agent-browser skills get agentcore`). |
| `ios` | — | Local iOS Simulator (see SKILL.md). |

Everything else in this skill (`open`, `snapshot -i`, `click`, `fill`, `screenshot`,
`@refs`, semantic locators, `eval`) works identically once a provider is selected —
only the launch + takeover differs.

## Kernel setup

`KERNEL_API_KEY` lives in `~/.env.zsh`, which your shell auto-sources — so it's already in
the environment. You normally just pick the provider:

```bash
export AGENT_BROWSER_PROVIDER=kernel   # KERNEL_API_KEY auto-loaded from ~/.env.zsh
```

Kernel-specific knobs (all optional except the key):

| Env var | Default | Why you'd set it |
|---------|---------|------------------|
| `KERNEL_API_KEY` | — | Required. Auto-loaded from `~/.env.zsh`. |
| `KERNEL_HEADLESS` | `true` (in agent-browser) | **Set `false` for live view / human takeover.** Headless has no viewable screen. |
| `KERNEL_TIMEOUT_SECONDS` | 60 | Inactivity timeout. CDP *and* live-view connections count as activity. Bump it (e.g. 1800) so a takeover URL stays alive until the human opens it. Max 259200 (72h). |
| `KERNEL_PROFILE_NAME` | — | Persistent profile: created if missing; cookies/logins are saved back when the session ends. Use this so the agent stays logged in across runs. |
| `KERNEL_STEALTH` | `false` | Reduce anti-bot detection. |
| `KERNEL_ENDPOINT` | `https://api.onkernel.com` | Override API base. |

> Gotcha worth internalizing: agent-browser launches Kernel **headless by default**
> (fast, fine for pure automation), but headless sessions have **no live view**. If
> you want a human to be able to take over, you must launch with `KERNEL_HEADLESS=false`
> *before the first `open`* — you can't flip an existing session.

## Drive a Kernel browser

```bash
export AGENT_BROWSER_PROVIDER=kernel KERNEL_HEADLESS=false KERNEL_TIMEOUT_SECONDS=1800

agent-browser open https://example.com     # boots the cloud browser (~2s) and navigates
agent-browser snapshot -i                   # same @ref workflow as local
agent-browser click @e1
agent-browser screenshot /tmp/shot.png
```

The session persists across separate `agent-browser` invocations (a local daemon holds
it), so follow-up commands attach to the same cloud browser without re-passing flags.

## Get the takeover (live-view) URL — no SDK needed

The live-view URL is embedded in the session's CDP URL. Decode the JWT for the host and
`liveSlug` and assemble it. This matches Kernel's authoritative URL exactly:

```bash
CDP="$(agent-browser get cdp-url | tail -1)"
LIVE="$(CDP="$CDP" node -e '
const u=new URL(process.env.CDP);
const p=JSON.parse(Buffer.from(u.searchParams.get("jwt").split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),"base64").toString());
const s=p.session||p;
console.log(`https://${u.host}/browser/live/${s.liveSlug||p.liveSlug}`);')"
echo "$LIVE"                 # open on any device, incl. phone
echo "$LIVE?readOnly=true"   # non-interactive (watch only)
```

`templates/kernel-takeover.sh` wraps exactly this.

Live-view URL properties:
- Interactive by default; append `?readOnly=true` to make it watch-only.
- Embeddable in an `<iframe>` (allow `autoplay; clipboard-read; clipboard-write`; CSP must permit `*.onkernel.com:8443`).
- Valid until the session times out or is deleted (not a fixed 5-minute window).

## The full human-in-the-loop pattern

1. Launch non-headless with a generous timeout (so the URL survives until the human acts).
2. Agent drives via `snapshot -i` + `click`/`fill` until it hits a wall (login, CAPTCHA, MFA).
3. Send the live-view URL to the human (e.g., via the messaging channel) and pause.
4. Human opens it (phone is fine), completes the step in the same session.
5. Agent resumes: re-`snapshot -i` (refs are invalid after the human navigated) and continue.

## Session lifecycle & cleanup (avoid surprise bills)

`agent-browser close --all` closes the **local daemon**, but the **cloud browser keeps
running** until its inactivity timeout. To free it immediately, delete the Kernel session
explicitly. Either let the timeout reap it, or use the SDK:

```bash
# one-time: npm i @onkernel/sdk in a scratch dir
node --input-type=module -e '
import Kernel from "@onkernel/sdk";
const c=new Kernel({apiKey:process.env.KERNEL_API_KEY});
for await (const b of c.browsers.list()) { await c.browsers.deleteByID(b.session_id); console.log("deleted",b.session_id); }'
```

The SDK (`@onkernel/sdk`) is also the richer path for listing/retrieving sessions,
managing profiles, proxies, and reading `browser_live_view_url` directly — reach for it
when bash + agent-browser isn't enough.

## Quick reference

```bash
# minimal takeover-ready session
export AGENT_BROWSER_PROVIDER=kernel KERNEL_HEADLESS=false KERNEL_TIMEOUT_SECONDS=1800
./templates/kernel-takeover.sh https://news.ycombinator.com
# -> prints the live-view URL; drive with snapshot/click/fill; close --all + delete to stop billing
```

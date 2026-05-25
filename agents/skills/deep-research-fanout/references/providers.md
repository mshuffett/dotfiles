# Providers — launch flows, selectors, reverse-engineered APIs

All flows were validated live (2026-05) driving the user's real Chrome via the
`mcp__claude-in-chrome__*` tools. UIs change often — prefer the **semantic `find` tool** and
text/role anchors over hardcoded coordinates, and **re-snapshot/read-page after every DOM
change** (refs invalidate). Get `tabs_context_mcp` once at the start.

## Driver options

- **Primary — Claude-in-Chrome extension** (`mcp__claude-in-chrome__*`): drives the user's real
  logged-in Chrome. No anti-bot fight (it's the real session), $0. Use for interactive runs.
- **Fallback — `agent-browser` CLI**: for headless/scheduled runs. `agent-browser --auto-connect`
  attaches to the user's running Chrome over CDP, or use a persistent `--session` profile;
  Kernel cloud + live-view takeover for unattended login. Same flows; use
  `agent-browser snapshot -i` for refs and `agent-browser eval --stdin` for the in-page fetches
  below. (See the `agent-browser` skill.)

---

## Claude — claude.ai

**UI flow**
1. Open `https://claude.ai/new`.
2. Click the composer **`+`** button (label: *"Add files, connectors, and more"*).
3. Click **Research** in the menu. It toggles on (turns blue + checkmark). **Web search** must
   also be on — it is by default and Research requires it.
4. Verify: reopen the `+` menu and confirm **Research** has a checkmark (a research icon also
   appears next to `+` in the toolbar). Sending without it = ordinary chat (wasted credit).
5. Type the prompt into the textbox *"Write your prompt to Claude"* and send.
6. **Connector-permission modal** — Claude Research pops *"Enable connectors for Claude to use
   in research"* (Gmail, Calendar, Notion, Todoist). For general/web research these personal
   connectors are irrelevant and a privacy exposure, so click **"Disable all tools"** then
   **Confirm** (web search is a separate toggle and stays on → web-only research). Only enable a
   connector if the user's query is explicitly about their own Gmail/Notion/etc.
   **CRITICAL: click these modal buttons via the `find` tool's element refs, NOT raw
   coordinates** — a missed coordinate click leaves the modal unanswered and the run **STOPS**
   with *"No response on which connectors to enable during research"* (observed failure). After a
   real Confirm the message shows it'll proceed and a research panel appears
   (*"Searching for sources…"*). Verify the panel appears before moving on; if the tab freezes
   with the modal still open, the run dies.
7. The conversation lives at `https://claude.ai/chat/{conv_id}` — record `{conv_id}`.

**Reverse-engineered API** (run via `javascript_tool` / `agent-browser eval` so it executes
*in the page* — it inherits the session cookies + browser TLS fingerprint and sails past
Cloudflare, which blocks external HTTP clients):

- Get org ID dynamically (don't hardcode): it appears in every `/api/organizations/{org}/...`
  request; capture via `read_network_requests` filtered to `/api/organizations/`, or
  `fetch('/api/organizations',{headers:{accept:'application/json'}})`.
- **Start** (what the UI does on send): `POST /api/organizations/{org}/chat_conversations/{conv}/completion`.
- **Poll / retrieve** (the high-value part — clean structured extraction):
  `GET /api/organizations/{org}/chat_conversations/{conv}?tree=True&rendering_mode=messages&render_all_tools=true`
  → JSON `{ chat_messages: [...] }`. Poll until an assistant message exists with `stop_reason`
  set; its `content[].text` is the report. See `extraction.md` for the exact call.

---

## ChatGPT — chatgpt.com

**UI flow**
1. Open `https://chatgpt.com/`.
2. Click the composer **`+`** button (label: *"Add files and more"*).
3. Click **Deep research**. A blue **Deep research** pill appears in the composer toolbar.
4. Type the prompt into the textbox (*"Ask anything" / "Chat with ChatGPT"*) and click the
   send (blue up-arrow) button.
5. ChatGPT builds a research plan and begins. With the *"proceed without clarifying questions"*
   instruction it starts immediately ("Starting…"); otherwise it may ask 1–3 clarifying
   questions first — answer them per the clarifying-question policy.
6. Conversation navigates to `https://chatgpt.com/c/{conv_id}` — record `{conv_id}`.

**Notes / gotchas**
- After send, the page can be briefly unresponsive — if `browser_batch` times out, fall back to
  a single `get_page_text`/screenshot rather than retrying a heavy batch.
- API is under `/backend-api/` (Cloudflare-fronted; in-page fetch works). DOM extraction is the
  reliable path here. **Native "Copy" strips citation URLs** — reconstruct links from the DOM
  (see `extraction.md`).

---

## Gemini — gemini.google.com

**UI flow** (the gate is easy to miss):
1. Open `https://gemini.google.com/app`.
2. **Select the Pro model FIRST.** Click the mode picker (*"Open mode picker, currently …"*)
   and choose **3.1 Pro**. Deep research does **not** appear under Flash.
3. Click **Upload & tools** (the `+`). Click **Deep research** — it may be a top-level item or
   nested under **More tools → Deep research** depending on viewport height. A **Deep research**
   chip appears in the composer.
4. Type the prompt into the textbox *"Enter a prompt for Gemini"* and send.
5. Gemini shows *"Generating research plan"*, then renders a plan. **You must click the
   "Start research" button** to actually begin (use `find` → "Start research button").
6. Conversation navigates to `https://gemini.google.com/app/{conv_id}` — record `{conv_id}`.

**Notes**
- The "Start research" gate is mandatory — without the click it just sits on the plan.
- Completion: Gemini shows progress, then renders the report inline with a Create/export
  affordance. See `extraction.md`.

---

## Observed IDs from the validation run (example only — derive dynamically)

| Provider | Conversation URL pattern | Example conv id (2026-05 test) |
|----------|--------------------------|-------------------------------|
| Claude | `claude.ai/chat/{id}` | `7c65d773-052a-46ab-9484-7e10fab47755` |
| ChatGPT | `chatgpt.com/c/{id}` | `6a12ba68-8b30-83ea-9385-8b184bad428b` |
| Gemini | `gemini.google.com/app/{id}` | `b7023601f6d09da1` |

Claude org id observed: `459de588-eb64-46d8-b73a-e9bc517395e7` — **derive at runtime**, don't
hardcode (it can differ per account/workspace).

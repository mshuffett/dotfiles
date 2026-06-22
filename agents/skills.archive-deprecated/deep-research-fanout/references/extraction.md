# Extraction — polling for completion and pulling the report

Deep research is asynchronous (5–30 min). The tabs keep running in the user's real Chrome across
your turns. Poll on a **relaxed cadence** (every few minutes), not every few seconds. Set a
**ceiling (~45 min)**; past that, mark the leg failed and proceed with what finished.

## CRITICAL: background tabs freeze + reports live in sandboxed iframes

Two hard-won lessons from live runs — ignore them and you'll read stale/empty data:

1. **Chrome freezes background tabs** (Memory Saver) after a few minutes. A JS/DOM probe on a
   frozen tab returns **stale** values (the page literally stops updating, and heavy report
   components unmount). **Wake the tab first** — take a `screenshot` of that tabId (and/or
   `scroll` it) immediately before reading. A poll loop that only runs `javascript_tool` will
   report "still researching" forever even after the report is done.
2. **ChatGPT and Gemini render the finished report inside a sandboxed cross-origin `<iframe>`**
   (e.g. `connector_openai_deep_research.web-sandbox.oaiusercontent.com`). The iframe URL carries
   a token and is **blocked** from the parent page, so you **cannot** scrape the report text via
   parent-page DOM/`innerText`. Use the product's **export** affordance instead (see per-provider
   below). Claude renders its report in the normal page DOM (scrapable once awake).

So the reliable extraction order is: **wake tab → try the product's export/share → fall back to
DOM (Claude only) → last resort, vision via screenshots.**

## Claude — in-page `fetch()` (cleanest)

Poll via `javascript_tool` (runs in-page → real session, passes Cloudflare). Derive `org` and
`conv` at runtime (see `providers.md`):

```js
(async()=>{const org='<ORG>',conv='<CONV>';
const r=await fetch(`/api/organizations/${org}/chat_conversations/${conv}?tree=True&rendering_mode=messages&render_all_tools=true`,{headers:{accept:'application/json'}});
const j=await r.json();const a=(j.chat_messages||[]).filter(m=>m.sender==='assistant').pop();
return JSON.stringify({stop:a&&a.stop_reason, textLen:a?(a.content||[]).filter(c=>c.type==='text').reduce((x,c)=>x+(c.text||'').length,0):0, hasTools:a?(a.content||[]).some(c=>c.type==='tool_use'):false});})()
```

**Important — `stop_reason` alone is NOT "done".** Claude Research is an agent loop that emits
intermediate assistant messages with `stop_reason` set (e.g. the ~500-char preamble shown right
before the *"Enable connectors"* modal). Reliable completion = **all** of:
- the last assistant message is **long** (a real report is many thousands of chars, e.g.
  `textLen` > ~3000) and preceded by research `tool_use`/`tool_result` blocks, **and**
- the **DOM no longer shows a "Researching…" progress indicator** and the finished report +
  sources are rendered.

When the API and DOM disagree, take a screenshot to confirm before declaring done.

**Extract (the report is a document artifact):** Claude Research puts the full report in a
**document artifact** ("Cultivating Originality in the Shadow…"); the inline assistant message is
only a short summary, and the conversation messages API returns just that summary. Click the
artifact card to open the artifact panel (renders as **normal DOM**, not a sandboxed iframe), then
either use its Copy/Download, or extract+download client-side: find the artifact container (the
ancestor whose `innerText` starts with the report title) and trigger a Blob download — this
sidesteps the per-call result-truncation that bites when you try to return a 30k+ char report
through one `javascript_tool` call:

```js
// run via javascript_tool on the claude.ai tab with the artifact panel open
const t=[...document.querySelectorAll('h1')].find(e=>/<REPORT TITLE>/i.test(e.textContent));
let el=t,box=null;for(let i=0;i<16&&el;i++){if((el.innerText||'').trim().startsWith('<REPORT TITLE>'))box=el;el=el.parentElement;}
const links=[...new Set([...box.querySelectorAll('a[href^="http"]')].map(a=>'- '+(a.textContent.trim()||a.href)+' — '+a.href))];
const md=box.innerText+'\n\n## Source links\n'+links.join('\n');
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([md],{type:'text/markdown'}));a.download='claude-original.md';document.body.appendChild(a);a.click();
```

`innerText` loses inline markdown/footnote markers but keeps structure; the appended link list
recovers citation URLs. Then read the file from `~/Downloads`.

## ChatGPT — export (report is in a sandboxed iframe, NOT scrapable)

- Header shows *"Research completed in Nm · N citations · N searches"* then the report card.
- **Done** when (wake the tab first): that "Research completed in …" header is present and the
  report card with a title + Download/expand icons is shown. The conversation backend-api
  (`/backend-api/conversation/{id}`, Bearer token from `/api/auth/session`) does **not** contain
  the report text — the final assistant message is empty; the report is the iframe artifact.
- **Extract (works reliably):** click the report card's **⬇ download icon** (top-right). It opens
  a menu — *Copy contents / Export to Markdown / Export to Word / Export to PDF*. **You must then
  click "Export to Markdown"** (the icon alone does nothing; an earlier attempt failed by not
  selecting the format). The file auto-saves to `~/Downloads` as `deep-research-report.md` (no
  Save-As dialog). Then read it from disk. Gotchas: the menu can close if there's any delay —
  screenshot to confirm it's open right before clicking the item, and the report card unmounts
  when the tab is backgrounded, so wake the tab (screenshot) before opening the menu.
- Extension-driven downloads DO fire (verified) — a programmatic click on the menu item is
  sufficient; it does not need to be a "real" user gesture.

## Gemini — export / immersive panel (also uses iframes)

- After **Start research**, shows *"Starting research…"*, then a thinking panel, then renders the
  report in an immersive side panel. Wake the tab before checking.
- **Done** when: the report panel is rendered with a Sources/Create/Export affordance and
  progress is gone.
- **Extract:** prefer Gemini's **Export** (e.g. Export to Docs) or the report panel's copy. If the
  report sits in a sandboxed iframe like ChatGPT, parent-DOM scraping won't work — use export or
  vision. Verify on first run which applies for the current Gemini build.

## Sanity check

A genuine deep-research report is typically several thousand words with many citations. If a leg
"finishes" short, it's usually not actually done (or it asked a question) — re-check the page
before storing it.

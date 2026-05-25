---
name: deep-research-fanout
description: Run real Deep Research across ChatGPT, Claude, and Gemini in parallel using the user's own logged-in browser, save each original report to Notion, then write a synthesis. Use whenever the user wants "deep research", a "deep dive", a thorough multi-source investigation, or asks to research a topic across the models / compare what each finds / get a synthesized report. Triggers: "deep research", "run deep research", "research this deeply", "deep dive on X", "fan out research", "research across ChatGPT/Claude/Gemini". This drives the subscription Deep Research products via the Chrome extension (zero marginal cost), NOT the paid API. NOT for quick single-fact lookups or ordinary web search — use the web-search skill for those.
allowed-tools: Bash, mcp__claude-in-chrome__*, mcp__claude_ai_Notion__*
---

# Deep Research Fanout

Run the **real** Deep Research feature of ChatGPT, Claude, and Gemini **in parallel**, in the
user's own logged-in Chrome, then store every original report in Notion and write a synthesis
on top. This is the deep-research analog of the `web-search` skill: more sources beat one
source, and three independent multi-step investigations surface more (and let you cross-check
claims) than any single one.

**Why browser, not API:** the subscription products (behind the user's ChatGPT/Claude/Gemini
plans) are reachable only through their web UIs — there is no usable unofficial API, and the
official deep-research API models bill separately per run. Driving the user's real Chrome costs
**$0 marginal** and produces the exact product-quality reports. See `references/providers.md`
for the reverse-engineered in-page `fetch()` retrieval that makes extraction clean.

## When to confirm before running

Each run consumes one Deep Research credit **per provider** (these are monthly-limited on every
plan) and takes **5–30 minutes** per provider. Before firing, tell the user which providers
you'll use and that it will spend three credits, unless they've already said "go".

## Prerequisites (check first, fix don't skip)

1. **Chrome extension connected** — call `mcp__claude-in-chrome__tabs_context_mcp` once. If it
   errors, ask the user to enable the Claude-in-Chrome extension (`/chrome`). The
   `agent-browser` CLI is a fallback for headless/scheduled runs (see `references/providers.md`).
2. **Logged in to all three** — claude.ai, chatgpt.com, gemini.google.com. If a tab shows a
   login screen, stop and ask the user to log in (don't enter credentials yourself).
3. **Notion connector available** — `mcp__claude_ai_Notion__*`. Reports land in the
   "Deep Research" database (see `references/notion.md` for the ID and page layout).
4. **`push`** on PATH for the completion notification.

## The flow

Work through these phases. Track them with TodoWrite so a long run can't drift.

1. **Frame the query.** Take the user's topic and write ONE self-contained research prompt
   (numbered sub-questions help). Append: *"If the scope is clear, proceed without asking
   clarifying questions and state any assumptions you make."* Send the **same** prompt to all
   three so the originals are comparable.

2. **Open the Notion run page.** Create a row in the Deep Research DB with Status=`Running`,
   the Query, and Providers you're about to launch. Keep its page ID. See `references/notion.md`.

3. **Launch all providers (parallel).** For each provider, open/reuse its tab, enable Deep
   Research mode, submit the prompt, and record the conversation ID/URL. Do all three before
   waiting on any — that's the whole point. Exact per-provider steps and selectors are in
   `references/providers.md`. Some providers (ChatGPT, Gemini) may show a research plan or
   clarifying questions first — handle per the policy below.

4. **Poll to completion.** Deep research is asynchronous; the tabs keep running in the user's
   real Chrome even across your turns. Poll each provider on a relaxed cadence (every few
   minutes, not every few seconds) until its report is final. Completion detection and the
   in-page `fetch()` polling calls are in `references/extraction.md`. Don't busy-wait with
   screenshots — use the lightweight checks.

5. **Extract each original.** Pull the finished report as clean Markdown **with citations**.
   claude.ai's copy is clean; ChatGPT's native copy strips citation URLs (reconstruct from the
   DOM); Gemini renders inline. Methods per provider in `references/extraction.md`.

6. **Store originals in Notion.** Add each provider's full report as a **child page** under the
   run page (titled e.g. "ChatGPT — original"), and set the per-provider Source URL property.
   See `references/notion.md`.

7. **Synthesize — this is the primary deliverable.** The synthesis is the *hero document*: write
   it so that **if the user reads only one thing, the synthesis is enough.** It is NOT a thin
   meta-comparison ("they agree on X, Claude adds Y"). It is a thorough, **standalone** report
   that fully answers the original question by integrating the substance of every source —
   structured by the user's actual sub-questions, carrying the best detail/examples/citations from
   each, and *deeper* than any single original. Use cross-provider agreement to mark confidence
   (corroborated = high) and surface genuine disagreements, but lead with the integrated answer,
   not the diff. Put it in the run page body above the child originals; end with confidence +
   caveats + key sources. (Same discipline as the `web-search` skill's synthesis, but longer and
   authoritative — the originals exist for drill-down, the synthesis is what gets read.)

8. **Finish.** Set Status=`Done` (or `Partial` if a provider failed), run
   `push "Deep research done: <short title>"`, and return to the user a tight summary + the
   Notion link. Do NOT paste all three full reports into chat — point to Notion.

## Clarifying-question policy

Deep Research often proposes a plan or asks clarifying questions before starting. Follow the
user's standing preference:

- **If the answer is clear** from the user's topic/context, answer it yourself and proceed
  (e.g. accept the proposed plan, pick the obvious scope).
- **If it's genuinely ambiguous** (a real fork that changes the result), pause and ask the
  user in chat before continuing that provider.

The appended "proceed without clarifying questions if clear" instruction usually pre-empts
this, but handle it when it appears.

## Failure handling — eager synthesis + background retry

When a provider errors, hits a quota wall, or **stalls** (Gemini in particular can freeze at
"analyzing results" if its tab gets backgrounded mid-run — see `extraction.md`), do NOT block the
whole run waiting on it:

1. **Synthesize eagerly** from whatever has finished (even 1 of 3). Ship the synthesis + the
   completed originals to Notion now, set Status=`Partial`, and tell the user it's based on N of M
   sources. A timely 2-of-3 synthesis beats a delayed perfect one.
2. **Retry the failed provider in the background.** Kick off a fresh run of just that provider and
   keep polling it (a backgrounded `sleep` timer works well) while you finish everything else. The
   stalled conversation won't recover — start a *new* one. For reliability the retried provider's
   tab should stay foreground, or run it in a **cloud browser** (Kernel) so the user's tab
   switching can't freeze it — see below.
3. **Fold it in when it lands.** When the retry completes, add its child page and **upgrade the
   synthesis** to include it (re-write, don't just append), then flip Status=`Done`.

**Reliability note:** the most robust way to run all providers truly in parallel without freeze
risk is one **cloud browser per provider** (Kernel), since each runs remotely and is never
backgrounded by the user's local Chrome. The local-Chrome-extension path is simplest but couples
all providers to one foreground tab at a time; prefer cloud browsers for unattended/parallel runs.
- If login is required mid-run, stop that leg and ask the user to log in — never enter
  credentials. Cloud-browser live-view takeover is an option for unattended runs
  (`references/providers.md`).
- If a selector has moved, prefer the semantic `find`/text approach over hardcoded
  coordinates, and re-snapshot after any DOM change. UIs here change often.

## Reference files

| File | Read when |
|------|-----------|
| `references/providers.md` | Launching a provider — exact UI flow, selectors, the Pro-model gate for Gemini, reverse-engineered API endpoints, agent-browser fallback. |
| `references/extraction.md` | Polling for completion and extracting the finished report (in-page `fetch()` for Claude, DOM/citation handling for ChatGPT/Gemini). |
| `references/notion.md` | Creating the run page, child-page originals, property values, and status updates. |

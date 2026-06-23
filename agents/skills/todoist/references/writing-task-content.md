# Writing task content (titles, descriptions, comments)

Task content is read by a **human under time pressure** — usually Michael, glancing at a task to
decide what to do. Optimize for fast comprehension, not machine completeness. The failure mode to
kill: dumping machine-shaped text (raw IDs, one run-on line, bare URLs) that's technically correct
but hard to read.

## Rules

1. **Structure, never run-on.** Lead with one short **bold** line (the "what" / current state), then
   bullets for detail. Never jam 3–4 facts into one sentence.
2. **Legible references, never raw IDs.** Refer to another task by its **readable name in bold**
   (e.g. **"Review the target investor list"**), not `(6gwWFhCQV3j3pFWQ)`. Link external pages as
   `[Readable Title](url)` — never a bare UUID or bare URL.
3. **Lead with the action / current state.** First line says what to do or where things stand;
   context and caveats go below.
4. **`Done =` where the finish line is fuzzy.** End with a `**Done =** …` line (or a checklist) when
   "finished" isn't obvious. Skip it on self-evident tasks — don't pad.
5. **Status markers on their own bullets.** `✅ done … / ⏳ pending …` as separate bullets, not
   buried mid-sentence.
6. **Link, don't dump.** Point to the source of truth (Notion page, another task) instead of inlining
   long context.

## Anti-pattern → fix

| Machine-shaped (bad) | Human-readable (good) |
|---|---|
| `gated on the A-tier (6gwWFhCQV3j3pFWQ)` | `gated on the **"Review the target list"** task` |
| `List: https://app.notion.com/p/3814…` | `List → [Founder Dinners view](https://app.notion.com/p/3814…)` |
| one run-on paragraph | **bold lead** + bullets |
| `✅ 6 sent ⏳ rest from A-tier, goal 10+…` (inline) | separate `✅`/`⏳` bullets + a **Goal:** line |
| no finish definition on a fuzzy task | `**Done =** …` line |

## Example (before → after)

**Before**
> Merged task (folded the 2 subtasks). (1) Apply on his site — amppublic.com (...). (2) Review his portfolio companies (Explo, Satchel, Birdie, Cambio — founder contacts in the comment) and get warm intros from there. Context: Anjney left a16z late 2025 to start amppublic — this resolves the deep-research 'stale flag' on him.

**After**
> Anjney Midha left a16z (late 2025) to start **amppublic**, a "public wealth fund." This is the deep-research stale-flag on him — now actionable.
>
> **Steps:**
> - Apply on his site → [amppublic.com](https://amppublic.com/#public-wealth-fund)
> - Pull warm intros from his portfolio — **Explo, Satchel, Birdie, Cambio**. Founder contacts are in the **comment on this task**.
>
> **Done =** application in + at least one warm intro path identified.

Apply these rules to **every** task title, description, and comment you write or edit — including
ones written by subagents you dispatch (tell them this style in their prompt).

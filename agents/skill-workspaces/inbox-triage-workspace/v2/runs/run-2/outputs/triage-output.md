Tool access is restricted in this session, so I'm proceeding without fetching the GitHub repos or reading reference files — working from the item descriptions and known context. Here is the complete triage output.

---

# 📋 Triage Report — 2026-02-21

**Projects confirmed:** Everything AI · Demo Day · Manage Finances
**Batch size:** 5 items

| Stat | Count |
|------|-------|
| Actions filed | 0 |
| Reference notes | 1 (cluster of 4 items) |
| Project seeds | 1 |
| Clarify | 0 |
| MOC suggested | 1 |

> ⚠️ *GitHub repos could not be fetched (tool access restricted). Activity signals (stars, last commit) are not included — flag for manual review if activity level matters before evaluating these tools.*

---

## Actions Filed

**None.** No items in this batch met the action threshold (imperative verb + specific target). See classification notes below.

---

## Reference Notes

### Note filed: [[Claude Code Orchestration Ecosystem]]

**Items clustered:** 1, 2, 3, 4

All four items concern the same domain: orchestration frameworks built on top of Claude Code, commentary on the proliferating ecosystem, and a security note from Anar about prompt injection in these tools. Filed together — the user evaluates these side-by-side when considering EAI architecture decisions.

**MOC suggestion:** If this cluster continues growing, promote to `Agent Orchestration Patterns` MOC linking framework comparisons, security considerations, and EAI architecture decisions.

---

### Note filed: [[EAI Feature Spec Seeds]]

**Item:** 5 — filed as **Project Seed**, not Action.

Reasoning: "Spec for EAI" has no imperative verb. The description lists three feature areas (craft editor, planning loops, cloud onboarding) without "write," "send," or "draft" attached. This reads as a capture of *what the spec should cover*, not a commitment to write it now. If the intent was "write this spec," promote manually: **"Draft EAI spec covering craft editor, planning loops, and cloud onboarding"** → Everything AI.

---

## Cluster Analysis

**Claude Code Orchestration Ecosystem** (items 1–4)

| Item | Text | Signal |
|------|------|--------|
| 1 | "two orchestration frameworks" + GSD + planning-with-files | Observational — two repos worth evaluating |
| 2 | "one way to go about it would be to basically research a bunch of these" + ccpm | Pure deliberation ("one way", "would be to basically") — brainstorming, not action |
| 3 | "there are so many openclaws and shit" + tweet | Ecosystem observation — not actionable |
| 4 | "security feature from anar" + OpenClaw security docs + prompt injection | Feedback *from* Anar — reference per feedback rule, not action |

Items 1–3 cluster naturally as an ecosystem survey. Item 4 extends the same cluster with a security dimension. Anar is a key EAI contact, which is relevant context, but the capture is "Anar shared this" not "do X with Anar" — so no action is created. If there's a follow-up (e.g., "review and respond to Anar about the security feature"), create that manually.

---

## Clarifications Needed

None.

---

---

# 📝 Obsidian Note 1

**File:** `Resources/Tools/Claude Code Orchestration Ecosystem.md`

```markdown
---
tags: [claude-code, agent-orchestration, tools, security, reference]
created: 2026-02-21
related-project: Everything AI
status: reference
---

# Claude Code Orchestration Ecosystem

Survey of orchestration frameworks, ecosystem tooling, and security considerations for
Claude Code agents. Captured during a period of rapid proliferation in this space.
Directly relevant to Everything AI architecture decisions.

---

## Frameworks & Tools

### get-shit-done — glittercowboy
Phase-based project orchestration framework for Claude Code agents.
→ https://github.com/glittercowboy/get-shit-done
⚠️ *Activity not verified — check stars and last commit before evaluating.*

### planning-with-files — othmanadi
File-based planning approach for structuring Claude Code workflows.
→ https://github.com/othmanadi/planning-with-files
⚠️ *Activity not verified.*

### ccpm — automazeio
Claude Code project manager / orchestration tooling.
→ https://github.com/automazeio/ccpm
⚠️ *Activity not verified.*

---

## Ecosystem Commentary

"there are so many openclaws and shit" — OpenClaw-style wrappers and orchestrators are
multiplying rapidly. The space is noisy; worth evaluating what's genuinely novel vs. forks
of the same idea.

*(Source link: tweet about Claude Code tools — not fetched)*

---

## Security Notes (shared by Anar)

Anar shared OpenClaw security documentation covering **prompt injection mitigation**
strategies. Relevant to EAI's agent security surface.

---

## Source Captures (verbatim)

- "two orchestration frameworks"
- "one way to go about it would be to basically research a bunch of these"
- "there are so many openclaws and shit"
- "security feature from anar"

---

## Connections

- [[Everything AI]] — directly relevant to orchestration architecture decisions
- [[EAI Feature Spec Seeds]] — planning loops feature may connect to orchestration pattern
  choices here
- Consider as inputs before committing to an orchestration approach for EAI
```

---

# 📝 Obsidian Note 2

**File:** `Resources/Project Seeds/EAI Feature Spec Seeds.md`

```markdown
---
tags: [everything-ai, spec, features, planning, project-seed]
created: 2026-02-21
related-project: Everything AI
status: seed — not yet actionable
---

# EAI Feature Spec Seeds

Early-stage feature concepts for Everything AI captured in a single inbox item.
Needs development into a proper spec before becoming actionable work.

---

## Feature Areas Mentioned

- **Craft editor** — likely an editing interface for agent outputs, prompts, or plans
- **Planning loops** — iterative planning cycles within agent orchestration flow
- **Cloud onboarding** — cloud deployment and user onboarding sequence

---

## Source Capture (verbatim)

"Spec for EAI" — craft editor + planning loops + cloud onboarding

---

## Next Steps (when ready to activate)

Promote to action: "Draft EAI spec covering craft editor, planning loops, and cloud
onboarding" → Everything AI

---

## Connections

- [[Everything AI]] — core project
- [[Claude Code Orchestration Ecosystem]] — planning loops may connect to orchestration
  pattern decisions being evaluated there
```

---

# 📌 Classification Decisions — Audit Trail

| # | Original Text | Category | Reasoning |
|---|---------------|----------|-----------|
| 1 | "two orchestration frameworks" + GSD + planning-with-files links | **Reference** (clustered) | Observational noun phrase; no verb, no commitment. Two repos to evaluate. |
| 2 | "one way to go about it would be to basically research a bunch of these" + ccpm | **Reference** (clustered) | Modal verb ("would be"), hedging ("basically"), deliberation language. Classic voice-capture brainstorm, not an action. |
| 3 | "there are so many openclaws and shit" + tweet | **Reference** (clustered) | Pure observation ("there are"). Ecosystem commentary, nothing actionable. |
| 4 | "security feature from anar" + OpenClaw security + prompt injection | **Reference** (clustered) | Feedback *from* Anar is information to keep, not a task. No committed next action visible. Anar's project association (EAI) noted but rule: person-as-target triggers project signal, not person-as-source. |
| 5 | "Spec for EAI" — craft editor + planning loops + cloud onboarding | **Project Seed** | No imperative verb. Reads as a capture of scope ideas, not a commitment. Flagged for potential promotion to action. |

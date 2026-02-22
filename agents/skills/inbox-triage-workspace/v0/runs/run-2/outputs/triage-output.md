All external tools are blocked in this execution context. Proceeding with the information provided in the prompt plus domain knowledge of the Claude Code ecosystem.

---

# 📋 Inbox Triage Report — 2026-02-21

## Projects Confirmed
| Project | ID |
|---------|-----|
| Everything AI | (primary — agent orchestration platform) |
| Demo Day | active |
| Manage Finances | active |

---

## Summary Stats
| Category | Count |
|----------|-------|
| Action | 1 |
| Reference (clustered) | 2 notes |
| Project Seed | 0 |
| Clarify | 0 |
| Items processed | 5 |

**Clusters identified:** 1 major cluster (Claude Code Orchestration Ecosystem — 3 repos + ecosystem observation)  
**MOC suggested:** Yes — "Claude Code Agent Ecosystem"

---

## Actions Filed

| Task | Project | Note |
|------|---------|------|
| Draft EAI spec: craft editor, planning loops, cloud onboarding | Everything AI | Imperative capture with specific feature list |

---

## Reference Notes

| Note | Items Collapsed | Filing Location |
|------|----------------|-----------------|
| Claude Code Orchestration Frameworks | Items 1, 2 (3 repos + research prompt) | `Resources/AI Dev Tools/` |
| OpenClaw Ecosystem and Security | Items 3, 4 (ecosystem observation + Anar's security docs) | `Resources/AI Dev Tools/` |

---

## Clusters

**Cluster: Claude Code Orchestration Frameworks**  
Items 1 + 2 — get-shit-done, planning-with-files, ccpm — three repos all addressing the same problem: how to structure Claude Code agent workflows. The voice capture "one way to go about it would be to basically research a bunch of these" is meta-commentary on the research task itself, not a discrete action. Filed together.

**Cluster: OpenClaw Ecosystem**  
Items 3 + 4 — the "so many openclaws" observation and Anar's security docs are both about the same tool family. Filed together.

---

## MOC Suggestion

**"Claude Code Agent Ecosystem"** — 4 of 5 items this session are about Claude Code tooling (orchestration frameworks, ecosystem observation, security). If this pattern continues, a MOC to index these discoveries would prevent fragmentation.

---

## Items Needing Clarification

None. All items classified at ≥80% confidence.

---
---

# 📝 Obsidian Reference Notes

---

## Note 1: Claude Code Orchestration Frameworks

```markdown
---
tags: [claude-code, orchestration, agent-workflows, reference]
created: 2026-02-21
status: seedling
related: [[Claude Code Agent Ecosystem]]
project-relevance: Everything AI
---

# Claude Code Orchestration Frameworks

A cluster of community-built frameworks for structuring Claude Code agent workflows — each taking a different approach to the same problem: coordination, planning, and execution across multi-agent sessions.

## Frameworks

### get-shit-done (glittercowboy)
- **Repo**: https://github.com/glittercowboy/get-shit-done
- **What it is**: A phased Claude Code orchestration methodology — the upstream source (or a close parallel) of the GSD framework already in use in this system. Structured around numbered phases, PLAN.md files, and executor agents.
- **Relevance**: HIGH — may be the canonical reference for patterns already adopted. Worth checking for divergence and improvements.

### planning-with-files (othmanadi)
- **Repo**: https://github.com/othmanadi/planning-with-files
- **What it is**: Coordination approach that uses the filesystem itself (plain markdown files) as the shared state layer between agents — no separate orchestration CLI required.
- **Relevance**: Interesting contrast to GSD's phase-driven CLI approach. Simpler, more portable.

### ccpm (automazeio)
- **Repo**: https://github.com/automazeio/ccpm
- **What it is**: Claude Code Project Manager — a workflow management layer for structured Claude Code projects.
- **Relevance**: Medium — another data point in the orchestration pattern space.

## Key Tension

These repos represent different philosophies:
- **Phase-based CLI** (GSD): explicit phases, plan files, executor agents, strong scaffolding
- **File-based coordination** (planning-with-files): flat, filesystem-native, minimal tooling
- **Manager overlay** (ccpm): project management layer on top

## Notes

> "one way to go about it would be to basically research a bunch of these"
> "two orchestration frameworks" — original inbox captures, 2026-02-21

## Connections
- [[Claude Code Agent Ecosystem]] (MOC)
- Everything AI — orchestration patterns directly applicable to agent loop design
```

---

## Note 2: OpenClaw Ecosystem and Security

```markdown
---
tags: [claude-code, security, prompt-injection, open-source-tools, reference]
created: 2026-02-21
status: seedling
related: [[Claude Code Agent Ecosystem]]
source-person: Anar
project-relevance: Everything AI
---

# OpenClaw Ecosystem and Security

Two related observations about the growing ecosystem of Claude Code tools ("OpenClaws") — one about ecosystem breadth, one about a specific security concern.

## Ecosystem Observation

The field of open-source Claude Code tooling is rapidly expanding. "OpenClaws" (community Claude Code extensions, tools, and frameworks) are proliferating enough that discovering and evaluating them is itself a challenge.

> "there are so many openclaws and shit" — inbox capture, 2026-02-21

Context: captured alongside a tweet about Claude Code tools — signal that the ecosystem is becoming dense enough to track.

## Security: Prompt Injection Mitigation (via Anar)

- **Source**: Anar (shared security docs for OpenClaw)
- **Topic**: Prompt injection mitigation in Claude Code tool contexts
- **What**: Security documentation covering attack surface and mitigation strategies for OpenClaw-based tooling

> "security feature from anar" — inbox capture, 2026-02-21

### Why This Matters for Everything AI
Prompt injection is a live threat in any system that passes user-supplied or third-party content into agent tool calls. Anar's mitigation docs are worth reviewing before shipping agent-facing features.

**Potential action**: If Anar is recommending this be implemented → create task in Everything AI. Review the docs to determine if this is active guidance or FYI reference.

## Connections
- [[Claude Code Agent Ecosystem]] (MOC)
- Everything AI — security review relevant to agent orchestration layer
```

---

## MOC Stub: Claude Code Agent Ecosystem

```markdown
---
tags: [MOC, claude-code, agent-tooling]
created: 2026-02-21
status: stub
---

# Claude Code Agent Ecosystem

An index of tooling, frameworks, and patterns in the community Claude Code ecosystem.

## Orchestration Frameworks
- [[Claude Code Orchestration Frameworks]] — GSD, planning-with-files, ccpm

## Security
- [[OpenClaw Ecosystem and Security]] — prompt injection, Anar's security docs

## To Explore
- Tweet thread on Claude Code tools (via inbox 2026-02-21)
- Broader "OpenClaws" ecosystem survey
```

---
---

# ✅ Todoist Action Items

---

### Action 1

**Task:** Draft EAI spec: craft editor, planning loops, and cloud onboarding  
**Project:** Everything AI  
**Why filed here:** "Spec for EAI" is an imperative capture with a specific list of feature areas — craft editor integration, planning loops, and cloud onboarding flow. EAI = Everything AI (the user's primary project).  
**Note:** 📎 See also: [[Claude Code Orchestration Frameworks]] — planning loop patterns may draw from these frameworks  

---

## Classification Reasoning Log

| Item | Raw Text | Classification | Confidence | Reasoning |
|------|----------|----------------|------------|-----------|
| 1 | "two orchestration frameworks" + get-shit-done + planning-with-files | Reference → Note 1 | 95% | Link discovery, no imperative action signal |
| 2 | "one way to go about it would be to basically research a bunch of these" + ccpm | Reference → Note 1 (clustered) | 98% | Classic voice-capture brainstorm. Modal "would be to" = ideation, not action. Collapsed with item 1 (same domain). |
| 3 | "there are so many openclaws and shit" + tweet | Reference → Note 2 | 95% | Informal observation, no action target. Clusters with item 4. |
| 4 | "security feature from anar" + OpenClaw security docs + prompt injection | Reference → Note 2 | 82% | Security docs from a person = likely reference/FYI. If Anar explicitly requested implementation, escalate to Action. Flagged in note. |
| 5 | "Spec for EAI" + craft editor + planning loops + cloud onboarding | Action → Everything AI | 87% | "Spec for X" with a specific feature list is an imperative capture. Clear project target (EAI). Next action is to draft the spec. |

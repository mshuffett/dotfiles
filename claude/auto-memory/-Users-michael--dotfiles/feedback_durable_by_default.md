---
name: Durable-by-default (don't leave one-offs ephemeral)
description: "Durable-by-default principle — when an action I just did (a curl/API call, a snippet, a manual sequence) is plausibly reusable, turn it into a committed, documented artifact (bin tool + skill) in the SAME pass; document as I go; don't lean on transient session state. Trigger: after running any one-off command/script that solved a real task, or finishing TTS/tooling/infra work that produced a reusable capability."
metadata:
  node_type: memory
  type: feedback
  originSessionId: session-88435c70
---

Michael (Jun 2026, paraphrased): "be more oriented around doing this in the future... you are slightly lazy on these things... not documenting enough... too much relying on the state of things."

Context: while doing TTS work I made a one-off ElevenLabs `curl` call and left it ephemeral (no committed tool, no skill, under-documented), leaning on the live session state instead of making the capability durable.

The rule — three moves, done in the SAME pass as the work, not deferred:

1. **Durable-by-default.** When something I just did is plausibly reusable (an API call, a snippet, a manual multi-step sequence), turn it into a committed, documented artifact — a `bin/` tool *and* a skill — right then. Don't leave it as a transcript-only one-off.
2. **Document as I go.** Write the docs/usage at the moment of creation. Don't rely on transient session/context state to carry anything that should persist beyond the session.
3. **Parallelize the meta-work.** Docs, memory, and skill creation are non-blocking — fan them out to background agents so they never stall the primary objective.

**Why:** a one-off that lives only in session state is lost the moment the context ends; next time the capability has to be rebuilt from scratch. "I'll document it later" = it doesn't get documented. The laziness is real and specific — name it and design around it, don't extend trust to my own "I'll remember."

**How to apply:** after running any command/script that actually solved a task, ask "is this plausibly reusable?" If yes → committed `bin/` tool + skill + docs in this same pass (respect `cli-tools` and `skill-creator` skills for the how). If the meta-work would block the user's main goal, spawn a background agent for it. Pairs with Sustainability ("avoid one-off hacks", "add/update docs") in root CLAUDE.md, which now carries the general trigger.

---
name: embed-knowledge-means-retrieval
description: "When asked to give an agent the knowledge \"in a document,\" build retrieval (index + page access), not just prompt distillation"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 564a729d-2b23-4b76-ab87-5e22bdb60eae
---

When the board asks to "hire a clone that embeds all the knowledge from <doc>," they mean **retrieval over the actual source**, not a prompt-level summary. On WAY-8 (Matt Mochary coach), my first pass distilled the method into ~16 lenses baked into AGENTS.md — the board pushed back twice: "how was the knowledge encoded? I wanted RAG" → "or at least the document as an index + ability to view the pages."

**Why:** Parametric/prompt encoding gives instincts but can't quote exact templates, can't say what's in the library, and silently loses fidelity. "Embed the knowledge" implies the agent can actually open the source material.

**How to apply:** Default to building a real, retrievable knowledge base: (1) an **index** of the corpus (table of contents with ids/links), (2) **page access** — pre-cache the corpus to disk where feasible AND give an on-demand fetch path, (3) a retrieval workflow in the agent's instructions (find in index → read page → cite it). Keep prompt-level lenses as fast heuristics layered on top, not as the whole solution. Full vector/semantic RAG is usually overkill for a few hundred short docs — keyword-grep over an index is enough; offer semantic RAG as an optional follow-up. Also: never bulk-fetch hundreds of URLs inline in one heartbeat — it hit the run timeout (exit 143); background it. See [[paperclip-hiring-coach-agent]].

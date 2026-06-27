---
name: feedback-subagent-mcp-retrieval
description: "A subagent's confident \"not found\" on MCP sources (Gmail/Notion) may be a tool-access failure, not a real absence — verify in the main thread."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d5e9e763-7da9-4489-a01d-aa8272ee3755
---

When delegating retrieval to Explore/general subagents that must hit **deferred MCP tools**
(Gmail, Notion, etc.), results are unreliable: in one run the Notion sub-agent successfully called
the MCP, but the Gmail sub-agent rationalized "I cannot invoke the Gmail MCP tools in read-only
mode" and fell back to grepping local files — then returned a confident "the Chen-Chen email
doesn't exist." It did exist; I found it by querying Gmail myself in the main thread.

**Why:** a subagent's "not found" reads as ground truth but can be a silent tool-access/rationalization
failure. Acting on it risks confabulation-by-omission (concluding something isn't there when it is).
Also: a key fact may sit inside a thread that search only *snippets* — I missed Chen-Chen's venue
list because I read search snippets instead of `get_thread` on the surfaced thread.

**How to apply:** for the linchpin fact, do MCP retrieval in the main thread (or require the subagent
to quote the exact tool call + raw result). Treat a subagent "not found" as a hypothesis, not a
verdict. When search surfaces a likely-relevant thread/page, fully fetch it before concluding the
content isn't there. See [[feedback-measurement-before-pruning]].

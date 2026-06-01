I don't have any record of that decision in the current context. The notes vault here is focused on personal productivity, systems thinking, and the Everything AI project — there's no codebase with a BullMQ implementation visible to me, and nothing in the files I can see documents a queue architecture decision.

A few places that decision might be recorded, if it was captured at all:

- A plan file under `./plans/` in whatever repo the BullMQ code lives in
- A git commit message or PR description at the point the dependency was added (`git log --all --oneline --grep="BullMQ"` or `git log --all --oneline --grep="queue"`)
- An ADR (Architecture Decision Record) if the project uses them
- A note in `3-Resources/` or `2-Areas/` in this vault if you captured it here

The fastest way to reconstruct it would be:

```bash
git log --all --oneline --grep -i "bull"
git log --all --oneline --grep -i "queue"
```

in the relevant repo, then read the commit message and linked PR for the "why."

If you remember roughly when the decision was made, checking the daily note from that period (`Calendar/Daily/YYYY-MM-DD.md`) might also surface it if you journaled about it.

Sorry I can't give you the actual answer — I don't have access to that context right now.

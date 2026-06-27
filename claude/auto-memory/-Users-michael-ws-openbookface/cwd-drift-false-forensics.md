---
name: cwd-drift-false-forensics
description: "Shell cwd drift after `cd` in compound commands caused false forensic conclusions (files \"missing\" that existed) — use absolute paths for forensics/mutations"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4f516cf7-ef5c-433d-9d84-1c6a979fba06
---

During the openbookface Wave-1a incident review (2026-06-12), I concluded agents had "mutually wiped" each other's work and that a worktree had "mysteriously vanished" — both partly false. My shell cwd had drifted into a sibling clone (`cd ~/ws/openbookface-play && ...` in an earlier compound command persisted), so subsequent `ls`/`grep`/`git -C relative-path` checks ran against the wrong repo. I then edited config files in the wrong repo too (biome.jsonc changes silently no-oped).

**Why:** The harness persists cwd between Bash calls but resets it unpredictably ("Shell cwd was reset" notices); relative paths after any `cd` are landmines. My global CLAUDE.md already warns about this for tmux pane IDs — same class of bug.

**How to apply:** (1) File mutations in scripts: always absolute paths. (2) Before forensic conclusions (file missing/changed), print `pwd` or use absolute paths. (3) After any compound command containing `cd`, treat cwd as unknown. (4) When an edit "succeeds" but behavior doesn't change, FIRST suspect wrong-file/wrong-cwd before exotic theories. Related: [[orchestrator-delegate-implementation]].

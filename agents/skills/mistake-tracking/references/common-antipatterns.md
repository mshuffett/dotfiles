# Common Anti-Patterns

Known recurring mistakes from actual log data. Check these before logging a new event — if it matches, reuse the existing `mistake_id` and note the recurrence.

## guide.not_consulted (HIGH FREQUENCY)

**Pattern**: Skipping a relevant skill/guide before performing an operation it covers. The most common failure mode — 3 occurrences across 2 repos in the last 14 days.

**Typical trigger**: Feeling confident about the task and proceeding without checking if a skill exists for it.

**Known instances**:
- Creating skills without invoking `skill-creator`
- Spawning agent teams without checking `agent-teams` skill
- Logging mistakes without invoking `mistake-tracking` (meta!)
- tmux operations without `terminal:tmux` skill

**Current guardrail**: STOP gate in `~/.claude/CLAUDE.md` Skills section. Promoted from passive ("always invoke") to imperative ("STOP before writing any skill file") on 2026-02-23 after 3rd recurrence.

**Prevention**: Before any procedural operation, scan the skill list for matches. Confidence is the danger signal, not a reason to skip.

## worktrees.preflight_skipped

**Pattern**: Running `git worktree` commands without pre-flight checks from the worktrees skill.

**Prevention**: Invoke `git-worktrees` skill before any worktree operation.

## ports.killed_without_permission

**Pattern**: Killing a process on a port without confirming the user started it.

**Prevention**: Invoke `port-safety` skill. Never kill a process you didn't start without explicit permission.

## thirdparty.docs_not_looked_up

**Pattern**: Relying on memory for third-party API/library usage instead of fetching current docs.

**Prevention**: Use Context7 or WebFetch for any non-trivial library usage.

## profile.launcher_not_verified

**Pattern**: Treating a runtime/profile install as verified after inspecting files on disk, without launching through the real profile wrapper that the user actually runs.

**Typical trigger**: Per-profile overlays appear correct on disk, but `codex-profile-launch` or `claude-profile-launch` rebuilds the home and silently drops runtime-local state such as plugin caches, install metadata, or auth files.

**Prevention**: Invoke `skill-profiles`, preserve overlay-local state instead of wiping the overlay home, and verify through the actual launcher command (`codex ...` or `claude ...`) rather than direct file inspection alone.

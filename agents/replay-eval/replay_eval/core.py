"""Core replay-eval logic.

Method
------
1. Take a real session transcript (`.jsonl`) and truncate it to end just BEFORE
   the line matching a marker substring (the assistant message that contained
   the mistake). Everything up to there is the *faithful decision context*.
2. Rewrite `sessionId` to a fresh UUID (per run, for isolation) and retarget the
   `last-prompt` leaf so Claude Code will resume from the true tail of the
   prefix. Drop the synthetic file into the same project dir as the source.
3. Drive the Claude Agent SDK with `resume=<uuid>, fork_session=True` and a
   short resume prompt. A `can_use_tool` callback DENIES any side-effecting tool
   (Agent/Task/Bash/Write/Edit/...) so a replay NEVER spawns real subagents or
   mutates the repo; read-only tools are allowed so the model can still act.
4. Measure `name` directly off every Agent/Task `tool_use` block the model
   emits (the miss = passing `name` to a fire-and-forget dispatch).
5. GREEN vs RED differ ONLY by the `AGENT_NAME_ADVISORY_DISABLE` env var handed
   to the REAL committed hook script (invoked from an in-process PreToolUse
   callback) — RED suppresses the advisory, GREEN lets it fire. This exercises
   the actual guardrail, not a reimplementation of it.

Fidelity caveats (measured, not fixed): the forked run rebuilds the system
prompt / CLAUDE.md / skills from CURRENT repo state, and the resume prompt
("continue") is a small context delta vs the original spontaneous continuation.
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import uuid as uuidlib
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

from claude_agent_sdk import (
    query,
    ClaudeAgentOptions,
    HookMatcher,
    PermissionResultAllow,
    PermissionResultDeny,
    AssistantMessage,
    ToolUseBlock,
    TextBlock,
    ThinkingBlock,
    ResultMessage,
    SystemMessage,
)

# Tools that must never actually run during a replay (spawn/side-effect).
DENY_TOOLS = {
    "Agent", "Task", "Bash", "BashOutput", "KillShell",
    "Write", "Edit", "MultiEdit", "NotebookEdit", "ExitPlanMode",
}
# The dispatch tools whose `name` param is the measurement target.
DISPATCH_TOOLS = {"Agent", "Task"}


@dataclass
class Arm:
    condition: str          # "red" | "green" (free-form label)
    model: str              # e.g. "claude-sonnet-4-5", "claude-fable-5"
    runs: int = 1
    max_turns: int | None = None   # default: red=1, green=3
    advisory_disabled: bool | None = None  # default: red=True, green=False

    def resolved_max_turns(self) -> int:
        if self.max_turns is not None:
            return self.max_turns
        # Both need room to REACH the dispatch decision: on "continue" the model
        # often thinks/investigates for a turn before dispatching. GREEN needs an
        # extra turn so a named first attempt can be corrected after the advisory.
        return 2 if self.condition == "red" else 3

    def resolved_advisory_disabled(self) -> bool:
        if self.advisory_disabled is not None:
            return self.advisory_disabled
        return self.condition == "red"


@dataclass
class ReplayConfig:
    source: Path                    # source transcript jsonl
    truncate_before: str            # substring; keep lines before first match
    arms: list[Arm]
    cwd: Path = Path("/Users/michael/.dotfiles")
    resume_prompt: str = "continue"
    hook_script: Path | None = None  # real advisory hook to invoke for parity
    project_dir: Path | None = None  # where to drop synthetic session files
    out: Path | None = None

    def resolved_project_dir(self) -> Path:
        return self.project_dir or self.source.parent


def build_prefix(source: Path, marker: str) -> tuple[list[str], str]:
    """Return (prefix_lines, leaf_uuid). Raises if marker not found or bad JSON."""
    raw = [l for l in source.read_text().splitlines() if l.strip()]
    boundary = None
    for i, line in enumerate(raw):
        if marker in line:
            boundary = i
            break
    if boundary is None:
        raise ValueError(f"marker {marker!r} not found in {source}")
    prefix = raw[:boundary]
    if not prefix:
        raise ValueError("marker matched the first line; nothing to keep")
    leaf = None
    for line in prefix:
        d = json.loads(line)  # validates every kept line is JSON
        if d.get("uuid"):
            leaf = d["uuid"]
    if leaf is None:
        raise ValueError("no message uuid found in prefix; cannot set leaf")
    return prefix, leaf


def materialize_session(prefix: list[str], leaf: str, project_dir: Path) -> str:
    """Write a fresh-UUID synthetic session file; return the new session id."""
    new = str(uuidlib.uuid4())
    out_lines = []
    for line in prefix:
        d = json.loads(line)
        if "sessionId" in d:
            d["sessionId"] = new
        if d.get("type") == "last-prompt":
            d["leafUuid"] = leaf
        out_lines.append(json.dumps(d))
    target = project_dir / f"{new}.jsonl"
    target.write_text("\n".join(out_lines) + "\n")
    return new


def _advisory_from_hook(hook_script: Path, tool_input: dict, disabled: bool) -> str | None:
    """Invoke the REAL committed hook and return its additionalContext, if any."""
    if hook_script is None or not Path(hook_script).exists():
        return None
    env = dict(os.environ)
    env["AGENT_NAME_ADVISORY_DISABLE"] = "1" if disabled else "0"
    payload = json.dumps({"tool_input": tool_input})
    try:
        res = subprocess.run(
            ["bash", str(hook_script)], input=payload, env=env,
            capture_output=True, text=True, timeout=15,
        )
    except Exception:
        return None
    out = res.stdout.strip()
    if not out:
        return None
    try:
        d = json.loads(out)
    except json.JSONDecodeError:
        return None
    return d.get("hookSpecificOutput", {}).get("additionalContext")


async def run_once(cfg: ReplayConfig, arm: Arm, run_idx: int) -> dict[str, Any]:
    """Execute a single replay run and return a structured verdict."""
    prefix, leaf = build_prefix(cfg.source, cfg.truncate_before)
    session_id = materialize_session(prefix, leaf, cfg.resolved_project_dir())
    session_file = cfg.resolved_project_dir() / f"{session_id}.jsonl"
    disabled = arm.resolved_advisory_disabled()

    agent_calls: list[dict] = []          # every Agent/Task tool_use, in order
    advisory_fired = {"v": False}         # did the advisory get injected
    text_chunks: list[str] = []
    turn = {"n": 0}

    # Precompute the advisory ONCE (a named dispatch always gets the same text).
    # CRITICAL: never shell out from inside an async hook/permission callback --
    # a blocking subprocess starves the asyncio event loop, the SDK control
    # stream times out, pending permission denials are dropped, and the CLI can
    # then actually SPAWN the agent. Precomputing keeps the callbacks instant.
    advisory_text = _advisory_from_hook(cfg.hook_script, {"name": "probe"}, disabled)

    async def pretooluse_hook(input_data, tool_use_id, context):
        # HARD non-spawn guarantee for dispatch tools. `can_use_tool` is NOT
        # invoked for Agent/Task (the CLI auto-approves them), so a PreToolUse
        # hook returning permissionDecision="deny" is the ONLY reliable block --
        # verified: without it, forked runs actually launch real subagents.
        # RED and GREEN both deny identically; GREEN additionally injects the
        # advisory, so RED<->GREEN isolate the advisory's effect.
        try:
            tool_name = input_data.get("tool_name")
            tool_input = input_data.get("tool_input", {}) or {}
            if tool_name in DISPATCH_TOOLS:
                out = {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason":
                            "replay-eval: execution suppressed (measurement only)",
                    }
                }
                if tool_input.get("name") and advisory_text:
                    advisory_fired["v"] = True
                    out["hookSpecificOutput"]["additionalContext"] = advisory_text
                return out
        except Exception:
            pass
        return {}

    async def can_use_tool(tool_name, tool_input, ctx):
        # Record every dispatch (belt to the tool_use-block measurement); the
        # actual block for Agent/Task happens in the PreToolUse hook above.
        if tool_name in DISPATCH_TOOLS:
            agent_calls.append({
                "turn": turn["n"],
                "tool": tool_name,
                "name_set": bool(tool_input.get("name")),
                "name_value": tool_input.get("name"),
            })
            return PermissionResultDeny(
                message="replay-eval: execution suppressed (measurement only)")
        # HARD safety: deny every other side-effecting tool too.
        if tool_name in DENY_TOOLS:
            return PermissionResultDeny(
                message="replay-eval: execution suppressed (measurement only)"
            )
        return PermissionResultAllow()

    async def prompt_stream():
        yield {"type": "user",
               "message": {"role": "user", "content": cfg.resume_prompt}}

    opts = ClaudeAgentOptions(
        resume=session_id,
        fork_session=True,
        cwd=str(cfg.cwd),
        model=arm.model,
        max_turns=arm.resolved_max_turns(),
        can_use_tool=can_use_tool,
        permission_mode="default",
        setting_sources=[],  # don't auto-load project hooks; we drive the hook ourselves
        hooks={"PreToolUse": [HookMatcher(matcher="Agent", hooks=[pretooluse_hook]),
                              HookMatcher(matcher="Task", hooks=[pretooluse_hook])]},
    )

    result_subtype = None
    try:
        try:
            async for msg in query(prompt=prompt_stream(), options=opts):
                if isinstance(msg, AssistantMessage):
                    turn["n"] += 1
                    for b in msg.content:
                        if isinstance(b, TextBlock):
                            text_chunks.append(b.text)
                        elif isinstance(b, ToolUseBlock) and b.name in DISPATCH_TOOLS:
                            # primary measurement: read `name` straight off the block
                            inp = b.input or {}
                            agent_calls.append({
                                "turn": turn["n"],
                                "tool": b.name,
                                "name_set": bool(inp.get("name")),
                                "name_value": inp.get("name"),
                                "source": "tool_use_block",
                            })
                elif isinstance(msg, ResultMessage):
                    result_subtype = getattr(msg, "subtype", None)
        except Exception as e:
            # The SDK raises on an error *result* (notably hitting max_turns).
            # Assistant messages are yielded BEFORE the raise, so the measurement
            # is already collected -- treat max-turns as graceful termination and
            # grade with what we have. Re-raise anything else.
            if "maximum number of turns" in str(e).lower():
                result_subtype = "error_max_turns"
            else:
                raise
    finally:
        try:
            session_file.unlink(missing_ok=True)
        except Exception:
            pass

    # Dedup: prefer tool_use_block records over can_use_tool records for the same
    # (turn, tool, name_value). Keep block records; they are the ground truth.
    blocks = [c for c in agent_calls if c.get("source") == "tool_use_block"]
    calls = blocks if blocks else agent_calls
    named = [c for c in calls if c["name_set"]]

    verdict = grade(arm.condition, calls, named, advisory_fired["v"], text_chunks)

    return {
        "condition": arm.condition,
        "model": arm.model,
        "run": run_idx,
        "advisory_disabled": disabled,
        "max_turns": arm.resolved_max_turns(),
        "session_id": session_id,
        "result_subtype": result_subtype,
        "agent_calls": [{k: v for k, v in c.items() if k != "source"} for c in calls],
        "advisory_fired": advisory_fired["v"],
        "verdict": verdict,
        # weak heuristic signal only (NOT the verdict): did prose mention it
        "text_mentions_advisory": any(
            kw in " ".join(text_chunks).lower()
            for kw in ("mailbox", "fire-and-forget", "unnamed", "advisory", "sendmessage")
        ),
    }


def grade(condition, calls, named, advisory_fired, text_chunks) -> str:
    if condition == "red":
        if not calls:
            return "no_dispatch"        # model investigated instead of dispatching
        # grade on the FIRST dispatch: was `name` set the moment it dispatched?
        first = min(calls, key=lambda c: c["turn"])
        return "reproduced" if first["name_set"] else "not_reproduced_unnamed"
    # green
    if not calls:
        return "no_dispatch"
    if not named:
        return "clean_unnamed"          # never named; nothing to correct
    # some named call happened; did a later call drop the name?
    first_named_turn = min(c["turn"] for c in named)
    later_unnamed = [c for c in calls
                     if c["turn"] > first_named_turn and not c["name_set"]]
    if later_unnamed:
        return "corrected_after_advisory"
    return "persisted_named"


async def run_matrix(cfg: ReplayConfig) -> list[dict]:
    results: list[dict] = []
    for arm in cfg.arms:
        for i in range(1, arm.runs + 1):
            print(f"[replay-eval] {arm.condition} {arm.model} run {i}/{arm.runs} "
                  f"(max_turns={arm.resolved_max_turns()}, "
                  f"advisory_disabled={arm.resolved_advisory_disabled()})", flush=True)
            try:
                r = await run_once(cfg, arm, i)
            except Exception as e:  # keep the matrix going; record the failure
                r = {"condition": arm.condition, "model": arm.model, "run": i,
                     "verdict": "error", "error": repr(e)}
            print(f"    -> verdict={r.get('verdict')} "
                  f"calls={len(r.get('agent_calls', []))} "
                  f"advisory_fired={r.get('advisory_fired')}", flush=True)
            results.append(r)
    if cfg.out:
        cfg.out.write_text(json.dumps(results, indent=2) + "\n")
        print(f"[replay-eval] wrote {len(results)} verdicts -> {cfg.out}", flush=True)
    return results

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]


@dataclass
class TestCase:
    id: str
    runtime: str  # claude | codex
    prompt: str
    model: str | None
    timeout_sec: int
    expect_regex: list[str]
    forbid_regex: list[str]


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(2)


def which(name: str) -> str | None:
    from shutil import which as _which

    return _which(name)


def load_suite(path: Path) -> tuple[dict[str, Any], list[TestCase]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    defaults = raw.get("defaults") or {}
    default_timeout = int(defaults.get("timeout_sec", 120))

    tests: list[TestCase] = []
    for t in raw.get("tests", []):
        tests.append(
            TestCase(
                id=str(t["id"]),
                runtime=str(t["runtime"]),
                prompt=str(t["prompt"]),
                model=(str(t["model"]) if t.get("model") else None),
                timeout_sec=int(t.get("timeout_sec", default_timeout)),
                expect_regex=[str(x) for x in (t.get("expect_regex") or [])],
                forbid_regex=[str(x) for x in (t.get("forbid_regex") or [])],
            )
        )
    return raw, tests


def mk_sandbox_home() -> tuple[tempfile.TemporaryDirectory[str], dict[str, str]]:
    td = tempfile.TemporaryDirectory(prefix="agent-regress-")
    home = Path(td.name)
    (home / ".claude").mkdir(parents=True, exist_ok=True)
    (home / ".codex").mkdir(parents=True, exist_ok=True)

    # Claude: copy memory config into sandbox HOME (avoid mutating the repo through symlinks).
    _copy_file(REPO_ROOT / "claude" / "CLAUDE.md", home / ".claude" / "CLAUDE.md")
    _copy_tree(REPO_ROOT / "claude" / "skills", home / ".claude" / "skills")
    if (REPO_ROOT / "claude" / "settings.json").exists():
        _copy_file(REPO_ROOT / "claude" / "settings.json", home / ".claude" / "settings.json")

    # Codex: point AGENTS.md at this repo, but keep creds/system skills from the user's machine.
    _copy_file(REPO_ROOT / "claude" / "CLAUDE.md", home / ".codex" / "AGENTS.md")
    if (REPO_ROOT / "codex" / "config.toml").exists():
        _copy_file(REPO_ROOT / "codex" / "config.toml", home / ".codex" / "config.toml")

    real_codex = Path.home() / ".codex"
    if (real_codex / "auth.json").exists():
        _symlink(real_codex / "auth.json", home / ".codex" / "auth.json")
    if (real_codex / "skills").exists():
        _symlink(real_codex / "skills", home / ".codex" / "skills")

    env = dict(os.environ)
    env["HOME"] = str(home)
    return td, env


def _symlink(src: Path, dst: Path) -> None:
    try:
        if dst.is_symlink() or dst.exists():
            dst.unlink()
    except IsADirectoryError:
        # Best-effort cleanup for directories we created earlier.
        import shutil

        shutil.rmtree(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.symlink_to(src)


def _copy_file(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(src.read_bytes())


def _copy_tree(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    import shutil

    if dst.exists() or dst.is_symlink():
        if dst.is_dir() and not dst.is_symlink():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    shutil.copytree(src, dst, symlinks=True)


def run_claude(prompt: str, model: str | None, env: dict[str, str], timeout_sec: int) -> tuple[int, str]:
    cmd = ["claude", "--dangerously-skip-permissions", "--print", "--output-format", "text"]
    if model:
        cmd += ["--model", model]
    cmd.append(prompt)
    p = subprocess.run(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=timeout_sec)
    return p.returncode, p.stdout


def run_codex(prompt: str, model: str | None, env: dict[str, str], timeout_sec: int) -> tuple[int, str]:
    # Capture the final message only to keep assertions stable.
    with tempfile.TemporaryDirectory(prefix="codex-last-") as td:
        last = Path(td) / "last.txt"
        cmd = [
            "codex",
            "exec",
            "--skip-git-repo-check",
            "--sandbox",
            "read-only",
            "--output-last-message",
            str(last),
            prompt,
        ]
        if model:
            cmd.insert(3, "--model")
            cmd.insert(4, model)
        p = subprocess.run(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=timeout_sec)
        out = ""
        if last.exists():
            out = last.read_text(encoding="utf-8", errors="replace")
        else:
            out = p.stdout
        return p.returncode, out


def match_assertions(output: str, expect: list[str], forbid: list[str]) -> tuple[bool, list[str], list[str]]:
    flags = re.IGNORECASE | re.MULTILINE
    missing: list[str] = []
    hit_forbidden: list[str] = []

    for pat in expect:
        if not re.search(pat, output, flags=flags):
            missing.append(pat)

    for pat in forbid:
        if re.search(pat, output, flags=flags):
            hit_forbidden.append(pat)

    ok = not missing and not hit_forbidden
    return ok, missing, hit_forbidden


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--suite", required=True, help="Path to suite JSON (agents/evals/suites/*.json)")
    ap.add_argument("--runtime", choices=["claude", "codex", "both"], default="both")
    ap.add_argument("--no-sandbox", action="store_true", help="Run using the real HOME (not recommended)")
    ap.add_argument("--json", action="store_true", help="Emit machine-readable JSON summary to stdout")
    args = ap.parse_args(argv)

    suite_path = (REPO_ROOT / args.suite).resolve() if not Path(args.suite).is_absolute() else Path(args.suite)
    if not suite_path.exists():
        die(f"Suite not found: {suite_path}")

    if which("claude") is None:
        die("claude not found in PATH")
    if which("codex") is None:
        die("codex not found in PATH")

    suite_raw, tests = load_suite(suite_path)
    if not tests:
        die("Suite has no tests")

    want = args.runtime
    if want != "both":
        tests = [t for t in tests if t.runtime == want]

    if not tests:
        die("No tests matched selected runtime")

    sandbox_td: tempfile.TemporaryDirectory[str] | None = None
    env = dict(os.environ)
    if not args.no_sandbox:
        sandbox_td, env = mk_sandbox_home()

    results: list[dict[str, Any]] = []
    start_all = time.time()
    try:
        for t in tests:
            t0 = time.time()
            try:
                if t.runtime == "claude":
                    code, out = run_claude(t.prompt, t.model, env, t.timeout_sec)
                elif t.runtime == "codex":
                    code, out = run_codex(t.prompt, t.model, env, t.timeout_sec)
                else:
                    die(f"Unknown runtime: {t.runtime}")
            except subprocess.TimeoutExpired:
                code, out = 124, ""

            elapsed_ms = int((time.time() - t0) * 1000)
            ok, missing, forbidden = match_assertions(out, t.expect_regex, t.forbid_regex)
            ok = ok and code == 0

            results.append(
                {
                    "id": t.id,
                    "runtime": t.runtime,
                    "model": t.model,
                    "ok": ok,
                    "exit_code": code,
                    "elapsed_ms": elapsed_ms,
                    "missing": missing,
                    "forbidden": forbidden,
                }
            )

            # Human-readable line
            status = "PASS" if ok else "FAIL"
            print(f"{status}  {t.id}  ({t.runtime})  {elapsed_ms}ms")
            if not ok:
                if code != 0:
                    print(f"  exit_code={code}")
                if missing:
                    print(f"  missing={missing}")
                if forbidden:
                    print(f"  forbidden={forbidden}")
    finally:
        if sandbox_td is not None:
            sandbox_td.cleanup()

    elapsed_all_ms = int((time.time() - start_all) * 1000)
    summary = {
        "suite": str(suite_path),
        "version": suite_raw.get("version"),
        "elapsed_ms": elapsed_all_ms,
        "passed": sum(1 for r in results if r["ok"]),
        "failed": sum(1 for r in results if not r["ok"]),
        "results": results,
    }

    if args.json:
        print(json.dumps(summary, indent=2))

    return 0 if summary["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Mapping:
    name: str
    status: str  # entrypoint | atom | merged | missing
    path: str | None
    note: str | None = None


def sh(cmd: list[str]) -> str:
    p = subprocess.run(cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{p.stderr}")
    return p.stdout


def detect_pre_refactor_commit() -> str | None:
    """
    Find the commit *before* the refactor that moved claude/skills into agents/skills + archive.
    This is used to reconstruct the 'original' claude skill set for mapping.
    """
    try:
        ref = sh(["git", "rev-list", "-n", "1", "--grep", "unify entrypoint skills", "HEAD"]).strip()
        if ref:
            return sh(["git", "rev-parse", f"{ref}^"]).strip()
    except Exception:
        pass

    # Fallback: if that commit message changes, try a more generic grep.
    try:
        ref = sh(["git", "rev-list", "-n", "1", "--grep", "archive atoms", "HEAD"]).strip()
        if ref:
            return sh(["git", "rev-parse", f"{ref}^"]).strip()
    except Exception:
        pass

    return None


def list_old_claude_skill_names(commit: str) -> list[str]:
    out = sh(["git", "ls-tree", "-r", "--name-only", commit])
    names: set[str] = set()
    for line in out.splitlines():
        line = line.strip()
        if not line.startswith("claude/skills/") or not line.endswith("/SKILL.md"):
            continue
        # claude/skills/<name>/SKILL.md
        parts = Path(line).parts
        if len(parts) >= 3:
            names.add(parts[2])
    return sorted(names)


def map_name(name: str) -> Mapping:
    # Explicit merges/renames live here.
    if name in {"todoist-operations", "todoist-triage"}:
        p = REPO_ROOT / "agents" / "skills" / "todoist" / "SKILL.md"
        if p.exists():
            return Mapping(name=name, status="merged", path=str(p.relative_to(REPO_ROOT)), note="merged into todoist")
        return Mapping(name=name, status="merged", path=None, note="merged into todoist (missing)")

    entry = REPO_ROOT / "agents" / "skills" / name / "SKILL.md"
    if entry.exists():
        return Mapping(name=name, status="entrypoint", path=str(entry.relative_to(REPO_ROOT)))

    atom = REPO_ROOT / "agents" / "knowledge" / "atoms" / "claude-skill-archive" / name / "SKILL.md"
    if atom.exists():
        return Mapping(name=name, status="atom", path=str(atom.relative_to(REPO_ROOT)))

    return Mapping(name=name, status="missing", path=None)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Map the pre-refactor claude skills to the current entrypoint/atom locations.")
    ap.add_argument("--from-commit", help="Git commit to read original claude/skills from (default: auto-detect pre-refactor commit)")
    ap.add_argument("--json", action="store_true", help="Emit JSON to stdout")
    args = ap.parse_args(argv)

    commit = args.from_commit or detect_pre_refactor_commit()
    if not commit:
        print("ERROR: could not auto-detect pre-refactor commit; pass --from-commit <sha>.", file=sys.stderr)
        return 2

    old_names = list_old_claude_skill_names(commit)
    mappings = [map_name(n) for n in old_names]

    summary: dict[str, Any] = {
        "from_commit": commit,
        "old_count": len(old_names),
        "mapped": {
            "entrypoint": sum(1 for m in mappings if m.status == "entrypoint"),
            "atom": sum(1 for m in mappings if m.status == "atom"),
            "merged": sum(1 for m in mappings if m.status == "merged"),
            "missing": sum(1 for m in mappings if m.status == "missing"),
        },
        "mappings": [m.__dict__ for m in mappings],
    }

    if args.json:
        print(json.dumps(summary, indent=2, sort_keys=True))
        return 0

    print(f"from_commit={commit}")
    print(f"old_skills={len(old_names)}")
    print("counts=" + json.dumps(summary["mapped"], sort_keys=True))
    print("---")
    for m in mappings:
        if m.status == "missing":
            print(f"{m.name:28} -> MISSING")
        elif m.note:
            print(f"{m.name:28} -> {m.path}  [{m.status}; {m.note}]")
        else:
            print(f"{m.name:28} -> {m.path}  [{m.status}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


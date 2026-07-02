"""CLI for the transcript-replay regression-eval harness.

Example:

    replay-eval \
      --source ~/.claude/projects/-Users-michael--dotfiles/<session>.jsonl \
      --truncate-before '"name":"some-marker"' \
      --hook-script /path/to/your-guardrail-hook.sh \
      --arm red:claude-sonnet-4-5:2 \
      --arm green:claude-sonnet-4-5:2 \
      --out verdicts.json

Arm spec: condition:model:runs[:max_turns].  condition is red|green (red
suppresses the guardrail + defaults max_turns=1; green lets it fire + defaults
max_turns=3).
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

from .core import Arm, ReplayConfig, run_matrix


def parse_arm(spec: str) -> Arm:
    parts = spec.split(":")
    if len(parts) < 2:
        raise argparse.ArgumentTypeError(
            f"bad --arm {spec!r}; want condition:model:runs[:max_turns]")
    condition, model = parts[0], parts[1]
    runs = int(parts[2]) if len(parts) > 2 and parts[2] else 1
    max_turns = int(parts[3]) if len(parts) > 3 and parts[3] else None
    return Arm(condition=condition, model=model, runs=runs, max_turns=max_turns)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="replay-eval", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--source", required=True, type=Path,
                   help="source transcript .jsonl")
    p.add_argument("--truncate-before", required=True,
                   help="substring; keep transcript lines BEFORE first match")
    p.add_argument("--arm", action="append", dest="arms", required=True,
                   type=parse_arm, help="condition:model:runs[:max_turns] (repeatable)")
    p.add_argument("--cwd", type=Path, default=Path("/Users/michael/.dotfiles"))
    p.add_argument("--resume-prompt", default="continue")
    p.add_argument("--hook-script", type=Path, default=None,
                   help="real advisory hook to invoke for GREEN parity")
    p.add_argument("--project-dir", type=Path, default=None,
                   help="where to drop synthetic session files "
                        "(default: source's dir = the resume project dir)")
    p.add_argument("--out", type=Path, default=None, help="write verdict JSON here")
    args = p.parse_args(argv)

    cfg = ReplayConfig(
        source=args.source.expanduser(),
        truncate_before=args.truncate_before,
        arms=args.arms,
        cwd=args.cwd.expanduser(),
        resume_prompt=args.resume_prompt,
        hook_script=args.hook_script.expanduser() if args.hook_script else None,
        project_dir=args.project_dir.expanduser() if args.project_dir else None,
        out=args.out.expanduser() if args.out else None,
    )
    results = asyncio.run(run_matrix(cfg))

    # compact summary table
    print("\n=== SUMMARY ===")
    for r in results:
        print(f"  {r['condition']:5} {r['model']:20} run{r.get('run')} "
              f"-> {r.get('verdict')}  "
              f"(named={sum(1 for c in r.get('agent_calls', []) if c.get('name_set'))}"
              f"/{len(r.get('agent_calls', []))} calls)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

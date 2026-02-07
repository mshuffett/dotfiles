from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict, deque
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]


LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
CODE_SPAN_RE = re.compile(r"`([^`]+)`")
FENCED_BLOCK_RE = re.compile(r"```.*?```", re.DOTALL)


def is_external_link(raw: str) -> bool:
    s = raw.strip()
    return (
        "://" in s
        or s.startswith("mailto:")
        or s.startswith("data:")
        or s.startswith("tel:")
        or s.startswith("#")
    )


def normalize_target(raw: str) -> str:
    # Drop anchors: foo.md#section -> foo.md
    s = raw.strip()
    if "#" in s:
        s = s.split("#", 1)[0]
    return s.strip()


def iter_links(md_text: str) -> Iterable[str]:
    for m in LINK_RE.finditer(md_text):
        yield m.group(1)


def iter_code_spans(md_text: str) -> Iterable[str]:
    for m in CODE_SPAN_RE.finditer(md_text):
        yield m.group(1)


def strip_fenced_code_blocks(md_text: str) -> str:
    # Cheap + effective: remove fenced blocks so inline-code parsing doesn't get confused.
    return FENCED_BLOCK_RE.sub("", md_text)


def resolve_repo_path(src_file: Path, raw_target: str) -> Path | None:
    if is_external_link(raw_target):
        return None
    target = normalize_target(raw_target)
    if not target:
        return None

    # Ignore obvious non-files.
    if target.startswith("<") and target.endswith(">"):
        return None

    p = (src_file.parent / target).resolve()
    try:
        p.relative_to(REPO_ROOT)
    except ValueError:
        return None
    if not p.exists():
        return None
    if p.is_dir():
        # If someone links to a directory, prefer its README.md if present.
        readme = p / "README.md"
        if readme.exists():
            return readme.resolve()
        return None
    return p


def resolve_repo_path_from_code_span(src_file: Path, raw: str) -> Path | None:
    """
    Treat backticked repo paths as implicit links.
    Examples:
      `agents/knowledge/atoms/.../SKILL.md`
      `~/.dotfiles/agents/knowledge/atoms/...`
    """
    s = raw.strip()
    if not s:
        return None
    if any(x in s for x in ["\n", "\t"]):
        return None

    # Normalize common absolute-ish forms back into repo-relative paths.
    s = s.replace("~/.dotfiles/", "")
    s = s.replace(str(REPO_ROOT) + "/", "")

    if not (
        s.startswith("agents/")
        or s.startswith("claude/")
        or s.startswith("script/")
        or s.startswith("bin/")
        or s.startswith("codex/")
        or s.startswith("plans/")
    ):
        return None

    p = (REPO_ROOT / s).resolve()
    try:
        p.relative_to(REPO_ROOT)
    except ValueError:
        return None
    if not p.exists() or p.is_dir():
        return None
    return p


def categorize(path: Path, roots: set[Path]) -> str:
    if path in roots:
        return "entrypoint"
    try:
        rel = path.relative_to(REPO_ROOT)
    except ValueError:
        return "other"
    if str(rel).startswith("agents/knowledge/atoms/"):
        return "atom"
    if str(rel).startswith("agents/knowledge/protocols/"):
        return "protocol"
    if str(rel).startswith("agents/knowledge/"):
        return "knowledge"
    if str(rel).startswith("claude/"):
        return "claude"
    if str(rel).startswith("agents/skills/"):
        return "skill"
    return "other"


@dataclass(frozen=True)
class Graph:
    roots: set[Path]
    edges: dict[Path, set[Path]]

    @property
    def nodes(self) -> set[Path]:
        ns: set[Path] = set(self.roots)
        for s, ts in self.edges.items():
            ns.add(s)
            ns.update(ts)
        return ns


def build_graph(roots: list[Path], max_depth: int | None) -> Graph:
    roots_set = {r.resolve() for r in roots}
    edges: dict[Path, set[Path]] = defaultdict(set)

    q: deque[tuple[Path, int]] = deque((r, 0) for r in roots_set)
    seen: set[Path] = set()

    while q:
        src, depth = q.popleft()
        if src in seen:
            continue
        seen.add(src)

        if max_depth is not None and depth > max_depth:
            continue

        try:
            text = src.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        text = strip_fenced_code_blocks(text)

        for raw in iter_links(text):
            dst = resolve_repo_path(src, raw)
            if dst is None:
                continue
            edges[src].add(dst)
            if dst not in seen:
                q.append((dst, depth + 1))

        for raw in iter_code_spans(text):
            dst = resolve_repo_path_from_code_span(src, raw)
            if dst is None:
                continue
            edges[src].add(dst)
            if dst not in seen:
                q.append((dst, depth + 1))

    return Graph(roots=roots_set, edges=edges)


def to_rel(p: Path) -> str:
    try:
        return str(p.relative_to(REPO_ROOT))
    except ValueError:
        return str(p)


def emit_text(g: Graph) -> None:
    nodes = sorted(g.nodes, key=lambda p: to_rel(p))
    edges = [(s, t) for s, ts in g.edges.items() for t in ts]
    edges.sort(key=lambda st: (to_rel(st[0]), to_rel(st[1])))

    # Summary
    cats = Counter(categorize(n, g.roots) for n in g.nodes)
    print(f"roots={len(g.roots)} nodes={len(nodes)} edges={len(edges)}")
    print("node_categories=" + json.dumps(dict(sorted(cats.items())), sort_keys=True))

    # Top out-degree
    out_deg = Counter({to_rel(s): len(ts) for s, ts in g.edges.items()})
    top = out_deg.most_common(10)
    if top:
        print("top_out_degree=" + json.dumps(top))

    print("---")
    for s, t in edges:
        print(f"{to_rel(s)} -> {to_rel(t)}")


def emit_tree(g: Graph) -> None:
    nodes = sorted(g.nodes, key=lambda p: to_rel(p))
    edges = [(s, t) for s, ts in g.edges.items() for t in ts]

    cats = Counter(categorize(n, g.roots) for n in g.nodes)
    print(f"roots={len(g.roots)} nodes={len(nodes)} edges={len(edges)}")
    print("node_categories=" + json.dumps(dict(sorted(cats.items())), sort_keys=True))

    out_deg = Counter({to_rel(s): len(ts) for s, ts in g.edges.items()})
    top = out_deg.most_common(10)
    if top:
        print("top_out_degree=" + json.dumps(top))

    def children(n: Path) -> list[Path]:
        return sorted(g.edges.get(n, set()), key=lambda p: to_rel(p))

    def rec(n: Path, prefix: str, is_last: bool, seen_local: set[Path], stack: set[Path]) -> None:
        connector = "`-- " if is_last else "|-- "
        label = to_rel(n)

        if n in stack:
            print(prefix + connector + label + " [cycle]")
            return
        if n in seen_local:
            print(prefix + connector + label + " (ref)")
            return

        print(prefix + connector + label)
        seen_local.add(n)

        ch = children(n)
        if not ch:
            return

        stack.add(n)
        next_prefix = prefix + ("    " if is_last else "|   ")
        for i, c in enumerate(ch):
            rec(c, next_prefix, i == (len(ch) - 1), seen_local, stack)
        stack.remove(n)

    print("---")
    for r in sorted(g.roots, key=lambda p: to_rel(p)):
        print(to_rel(r))
        seen_local: set[Path] = set()
        ch = children(r)
        for i, c in enumerate(ch):
            rec(c, "", i == (len(ch) - 1), seen_local, set())
        print()


def emit_dot(g: Graph) -> None:
    # Graphviz dot
    print("digraph skills {")
    print('  rankdir="LR";')

    # Nodes
    for n in sorted(g.nodes, key=lambda p: to_rel(p)):
        rel = to_rel(n)
        cat = categorize(n, g.roots)
        attrs: list[str] = [f'label="{rel}"', 'fontsize="10"']
        if cat == "entrypoint":
            attrs += ['shape="box"', 'style="filled"', 'fillcolor="#fff3b0"']
        elif cat == "atom":
            attrs += ['style="filled"', 'fillcolor="#d9f99d"']
        elif cat == "protocol":
            attrs += ['style="filled"', 'fillcolor="#bae6fd"']
        elif cat == "claude":
            attrs += ['style="filled"', 'fillcolor="#e9d5ff"']
        else:
            attrs += ['shape="ellipse"']
        print(f'  "{rel}" [{", ".join(attrs)}];')

    # Edges
    for s in sorted(g.edges.keys(), key=lambda p: to_rel(p)):
        for t in sorted(g.edges[s], key=lambda p: to_rel(p)):
            print(f'  "{to_rel(s)}" -> "{to_rel(t)}";')

    print("}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Print a graph of repo-local markdown links reachable from entrypoint skills.")
    ap.add_argument("--max-depth", type=int, default=6, help="Max link depth from entrypoints (default: 6)")
    ap.add_argument("--dot", action="store_true", help="Emit Graphviz DOT to stdout")
    ap.add_argument("--json", action="store_true", help="Emit machine-readable JSON (nodes, edges, categories)")
    ap.add_argument("--edges", action="store_true", help="Emit edge list (src -> dst) instead of tree output")
    args = ap.parse_args(argv)

    roots = sorted((REPO_ROOT / "agents" / "skills").glob("*/SKILL.md"))
    g = build_graph(roots=roots, max_depth=(None if args.max_depth < 0 else args.max_depth))

    if args.json:
        cats = {to_rel(n): categorize(n, g.roots) for n in g.nodes}
        payload = {
            "roots": [to_rel(r) for r in sorted(g.roots, key=lambda p: to_rel(p))],
            "nodes": [to_rel(n) for n in sorted(g.nodes, key=lambda p: to_rel(p))],
            "edges": [
                {"src": to_rel(s), "dst": to_rel(t)}
                for s, ts in sorted(g.edges.items(), key=lambda it: to_rel(it[0]))
                for t in sorted(ts, key=lambda p: to_rel(p))
            ],
            "categories": cats,
        }
        print(json.dumps(payload, indent=2, sort_keys=True))
        return 0

    if args.dot:
        emit_dot(g)
        return 0

    if args.edges:
        emit_text(g)
    else:
        emit_tree(g)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

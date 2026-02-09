from __future__ import annotations

import argparse
import json
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np
from fastembed import TextEmbedding


DEFAULT_STORE_DIR = Path.home() / ".agents" / "recall"
DEFAULT_CONFIG_PATH = Path.home() / ".agents" / "recall" / "config.json"
DEFAULT_SOURCES = [
    Path.home() / ".claude" / "history.jsonl",
    Path.home() / ".codex" / "history.jsonl",
]
SCHEMA_VERSION = 3

_INCLUDED_SUFFIXES = {".md", ".jsonl"}
_SKIP_DIR_NAMES = {
    ".git",
    ".hg",
    ".svn",
    ".obsidian",
    ".venv",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".turbo",
    ".cache",
}


@dataclass(frozen=True)
class Record:
    ts_ms: int
    project: str
    text: str
    source: str
    source_type: str
    title: str | None = None
    path: str | None = None
    session_id: str | None = None


def _iso_from_ts_ms(ts_ms: int) -> str:
    dt = datetime.fromtimestamp(ts_ms / 1000.0, tz=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def _iter_sources(paths: Iterable[str]) -> list[Path]:
    return [Path(p).expanduser() for p in paths]


def _load_config_sources() -> list[Path] | None:
    cfg = DEFAULT_CONFIG_PATH
    if not cfg.exists():
        return None
    try:
        obj = json.loads(cfg.read_text(encoding="utf-8"))
    except Exception:
        return None
    sources = obj.get("sources")
    if not isinstance(sources, list):
        return None
    out: list[Path] = []
    for s in sources:
        if isinstance(s, str) and s.strip():
            out.append(Path(s).expanduser())
    return out or None


def _walk_included_files(root: Path) -> list[Path]:
    out: list[Path] = []
    # os.walk is noticeably faster than pathlib.rglob on large trees.
    for dirpath, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
        dirnames[:] = [d for d in dirnames if d not in _SKIP_DIR_NAMES]
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix.lower() in _INCLUDED_SUFFIXES:
                out.append(p)
    return out


def _expand_sources(sources: list[Path]) -> list[Path]:
    files: list[Path] = []
    for src in sources:
        p = src.expanduser()
        if p.is_dir():
            files.extend(_walk_included_files(p))
        else:
            if p.suffix.lower() in _INCLUDED_SUFFIXES:
                files.append(p)
    # Deduplicate and stabilize ordering.
    return sorted({f.resolve() if f.exists() else f for f in files}, key=lambda x: str(x))


def _sources_signature(files: list[Path]) -> list[dict[str, Any]]:
    sig: list[dict[str, Any]] = []
    for p in files:
        try:
            st = p.stat()
            sig.append({"path": str(p), "mtime_ns": int(st.st_mtime_ns), "size": int(st.st_size)})
        except FileNotFoundError:
            sig.append({"path": str(p), "missing": True})
    return sig


def _load_history_jsonl(path: Path) -> list[Record]:
    records: list[Record] = []
    if not path.exists():
        return records

    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            # Claude Code history.jsonl schema:
            # { timestamp(ms), display, project, pastedContents }
            if "timestamp" in obj and "display" in obj:
                ts = obj.get("timestamp")
                display = obj.get("display") or ""
                project = obj.get("project") or ""
                pasted = obj.get("pastedContents") or {}

                if not isinstance(ts, int):
                    continue
                if not isinstance(display, str):
                    continue
                if not isinstance(project, str):
                    project = str(project)

                extra = ""
                if isinstance(pasted, dict) and pasted:
                    parts: list[str] = []
                    for k, v in list(pasted.items())[:20]:
                        ks = str(k)
                        vs = str(v)
                        if len(vs) > 500:
                            vs = vs[:500] + "..."
                        parts.append(f"{ks}: {vs}")
                    extra = "\n\nPasted:\n" + "\n".join(parts)

                text = (display + extra).strip()
                if not text:
                    continue

                records.append(Record(ts_ms=ts, project=project, text=text, source=str(path), source_type="conv"))
                continue

            # Codex history.jsonl schema (observed):
            # { ts(seconds), session_id, text }
            if "ts" in obj and "text" in obj:
                ts = obj.get("ts")
                text = obj.get("text") or ""
                session_id = obj.get("session_id")
                if not isinstance(ts, int):
                    continue
                if not isinstance(text, str):
                    continue
                if session_id is not None and not isinstance(session_id, str):
                    session_id = str(session_id)
                # Codex uses seconds since epoch (10 digits); normalize to ms.
                ts_ms = ts * 1000
                records.append(
                    Record(
                        ts_ms=ts_ms,
                        project="",
                        text=text.strip(),
                        source=str(path),
                        source_type="conv",
                        session_id=session_id,
                    )
                )
                continue

    return records


def _strip_yaml_frontmatter(md: str) -> str:
    # Only strip if it's the very first block (common in Obsidian/Jekyll).
    lines = md.splitlines(keepends=True)
    if not lines:
        return md
    if lines[0].strip() != "---":
        return md
    for i in range(1, len(lines)):
        if lines[i].strip() in ("---", "..."):
            return "".join(lines[i + 1 :])
    return md


def _first_h1_title(md: str) -> tuple[str | None, int | None]:
    in_fence = False
    for idx, line in enumerate(md.splitlines()):
        s = line.rstrip("\n")
        if s.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if s.startswith("# "):
            t = s[2:].strip()
            if t:
                return t, idx
    return None, None


def _infer_source_type(path: Path) -> str:
    s = str(path)
    if path.suffix.lower() == ".jsonl":
        return "conv"
    # Dotfiles heuristics.
    if f"{os.sep}.dotfiles{os.sep}" in s:
        if f"{os.sep}agents{os.sep}skills{os.sep}" in s or f"{os.sep}skills{os.sep}" in s:
            return "skills"
        if f"{os.sep}agents{os.sep}knowledge{os.sep}atoms{os.sep}" in s or f"{os.sep}atoms{os.sep}" in s:
            return "atoms"
        return "atoms"
    # Notes heuristics.
    if f"{os.sep}ws{os.sep}notes{os.sep}" in s or s.endswith(f"{os.sep}notes"):
        return "notes"
    return "notes"


def _load_markdown_file(path: Path) -> Record | None:
    try:
        st = path.stat()
    except FileNotFoundError:
        return None
    ts_ms = int(st.st_mtime * 1000)
    raw = path.read_text(encoding="utf-8", errors="replace")
    raw = raw.lstrip("\ufeff")
    body = _strip_yaml_frontmatter(raw).strip()
    title, h1_idx = _first_h1_title(body)
    if not title:
        title = path.stem

    # If we found an H1 at the top, avoid duplicating it when we prefix title.
    if h1_idx == 0:
        body_lines = body.splitlines()
        body = "\n".join(body_lines[1:]).lstrip()

    text = (f"{title}\n\n{body}").strip()
    if not text:
        return None

    return Record(
        ts_ms=ts_ms,
        project="",
        text=text,
        source=str(path),
        source_type=_infer_source_type(path),
        title=title,
        path=str(path),
    )


def _read_records(files: list[Path]) -> list[Record]:
    out: list[Record] = []
    for src in files:
        if src.suffix.lower() == ".jsonl":
            out.extend(_load_history_jsonl(src))
            continue
        if src.suffix.lower() == ".md":
            rec = _load_markdown_file(src)
            if rec is not None:
                out.append(rec)
    out.sort(key=lambda r: (r.ts_ms, r.source))
    return out


def _embed_texts(model: TextEmbedding, texts: list[str]) -> np.ndarray:
    vecs = list(model.embed(texts))
    arr = np.array(vecs, dtype=np.float32)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return arr / norms


def _store_paths(store_dir: Path) -> dict[str, Path]:
    return {
        "meta": store_dir / "meta.json",
        "records": store_dir / "records.jsonl",
        "fts": store_dir / "fts.sqlite",
    }


def _load_meta(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _write_records_jsonl(path: Path, records: list[Record]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for r in records:
            rec: dict[str, Any] = {
                "ts_ms": r.ts_ms,
                "ts": _iso_from_ts_ms(r.ts_ms),
                "project": r.project,
                "text": r.text,
                "source": r.source,
                "source_type": r.source_type,
            }
            if r.title:
                rec["title"] = r.title
            if r.path:
                rec["path"] = r.path
            if r.session_id:
                rec["session_id"] = r.session_id
            f.write(
                json.dumps(rec, ensure_ascii=True)
                + "\n"
            )


def _load_records_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    if not path.exists():
        return records
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))
    return records


def _build_fts(con: sqlite3.Connection, records: list[dict[str, Any]]) -> None:
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA synchronous=NORMAL;")
    con.execute("PRAGMA temp_store=MEMORY;")
    con.execute("DROP TABLE IF EXISTS docs;")
    # Keep only `text` and `title` indexed; everything else is stored for filtering/display.
    con.execute(
        "CREATE VIRTUAL TABLE docs USING fts5("
        "text, "
        "title, "
        "project UNINDEXED, "
        "ts_ms UNINDEXED, "
        "source UNINDEXED, "
        "path UNINDEXED, "
        "source_type UNINDEXED"
        ");"
    )
    con.executemany(
        "INSERT INTO docs(rowid, text, title, project, ts_ms, source, path, source_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
        (
            (
                i + 1,
                r.get("text", "") or "",
                r.get("title", "") or "",
                r.get("project", "") or "",
                int(r.get("ts_ms", 0) or 0),
                r.get("source", "") or "",
                r.get("path", "") or "",
                r.get("source_type", "") or "",
            )
            for i, r in enumerate(records)
        ),
    )
    con.commit()


def _fts_candidates(con: sqlite3.Connection, query: str, limit: int, scope: str | None) -> list[int]:
    terms = [t for t in query.split() if t]
    if not terms:
        return []

    # Default behavior: OR terms together (better recall for natural-language queries).
    quoted_terms: list[str] = []
    for t in terms:
        safe = t.replace('"', "")
        if safe:
            quoted_terms.append(f"\"{safe}\"")
    match_query = " OR ".join(quoted_terms) if quoted_terms else query

    try:
        if scope and scope != "all":
            rows = con.execute(
                "SELECT rowid FROM docs WHERE docs MATCH ? AND source_type = ? ORDER BY bm25(docs) LIMIT ?;",
                (match_query, scope, limit),
            ).fetchall()
        else:
            rows = con.execute(
                "SELECT rowid FROM docs WHERE docs MATCH ? ORDER BY bm25(docs) LIMIT ?;",
                (match_query, limit),
            ).fetchall()
        return [int(r[0]) for r in rows]
    except sqlite3.OperationalError:
        return []


def do_index(store_dir: Path, sources: list[Path]) -> dict[str, Any]:
    store_dir.mkdir(parents=True, exist_ok=True)
    paths = _store_paths(store_dir)

    files = _expand_sources(sources)
    records = _read_records(files)
    _write_records_jsonl(paths["records"], records)
    con = sqlite3.connect(str(paths["fts"]))
    try:
        _build_fts(con, _load_records_jsonl(paths["records"]))
    finally:
        con.close()

    meta = {
        "schema_version": SCHEMA_VERSION,
        "created_at": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
        "input_sources": [str(p) for p in sources],
        "sources": _sources_signature(files),
        "count": len(records),
    }
    paths["meta"].write_text(json.dumps(meta, indent=2), encoding="utf-8")
    # We intentionally do not precompute embeddings. Embedding all history is expensive; we embed only top candidates at query-time.
    return meta


def _load_or_index(store_dir: Path, sources: list[Path]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    paths = _store_paths(store_dir)
    files = _expand_sources(sources)
    meta = _load_meta(paths["meta"])
    if (
        meta is None
        or meta.get("schema_version") != SCHEMA_VERSION
        or meta.get("sources") != _sources_signature(files)
        or not paths["records"].exists()
        or not paths["fts"].exists()
    ):
        meta = do_index(store_dir, sources)
    return _load_records_jsonl(paths["records"]), meta


def _format_result(rec: dict[str, Any]) -> str:
    project = rec.get("project") or ""
    ts = rec.get("ts") or ""
    source = rec.get("source") or ""
    source_type = rec.get("source_type") or "unknown"
    origin = "unknown"
    if source_type == "conv":
        origin = "conv"
        if ".claude" in str(source):
            origin = "conv:claude"
        if ".codex" in str(source):
            origin = "conv:codex"
    else:
        origin = str(source_type)
    sid = rec.get("session_id") or ""
    title = rec.get("title") or ""
    path = rec.get("path") or ""
    text = rec.get("text") or ""
    preview = " ".join(str(text).split())
    if len(preview) > 220:
        preview = preview[:220] + "..."
    head = f"{ts}  {origin}"
    if sid:
        head += f"  sid={sid}"
    if project:
        head += f"  {project}"
    if title and path:
        return f"{head}\n  {title}\n  {path}\n  {preview}"
    if path:
        return f"{head}\n  {path}\n  {preview}"
    return f"{head}\n  {preview}"


def do_search(
    store_dir: Path,
    sources: list[Path],
    query: str,
    k: int,
    candidates: int,
    model_name: str,
    json_output: bool,
    scope: str,
) -> int:
    records, meta = _load_or_index(store_dir, sources)
    if not records:
        return 1

    paths = _store_paths(store_dir)
    con = sqlite3.connect(str(paths["fts"]))
    try:
        # If the DB exists but the FTS table doesn't (partial/corrupt cache), rebuild.
        try:
            con.execute("SELECT 1 FROM docs LIMIT 1;").fetchone()
        except sqlite3.OperationalError:
            _build_fts(con, records)

        rowids = _fts_candidates(con, query, limit=max(k, candidates), scope=scope)
    finally:
        con.close()
    if not rowids:
        return 1

    # rowid is 1-based in our insert.
    cand_recs = [records[rid - 1] for rid in rowids if 0 < rid <= len(records)]
    if scope and scope != "all":
        cand_recs = [r for r in cand_recs if (r.get("source_type") or "") == scope]
    cand_texts = [str(r.get("text", "")) for r in cand_recs]
    if not cand_texts:
        return 1

    model = TextEmbedding(model_name=model_name)
    qv = _embed_texts(model, [query])[0]
    dv = _embed_texts(model, cand_texts)

    sims = dv @ qv
    top_idx = np.argsort(-sims)[: max(1, k)]

    results: list[dict[str, Any]] = []
    for idx in top_idx.tolist():
        rec = dict(cand_recs[idx])
        rec["score"] = float(sims[idx])
        results.append(rec)

    if json_output:
        print(json.dumps({"query": query, "k": k, "results": results}, ensure_ascii=True, indent=2))
    else:
        for i, rec in enumerate(results, start=1):
            print(f"[{i}] score={rec.get('score', 0.0):.3f}")
            print(_format_result(rec))
            print()

    return 0


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="agent-recall")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_index = sub.add_parser("index", help="Parse sources into a lightweight local cache (no precomputed embeddings)")
    p_index.add_argument("--store", default=str(DEFAULT_STORE_DIR), help="Where to store the local cache (default: ~/.agents/recall)")
    p_index.add_argument(
        "--source",
        action="append",
        default=[],
        help="Source file(s) or directory(ies) (repeatable). Default: ~/.agents/recall/config.json (if present) else ~/.claude/history.jsonl + ~/.codex/history.jsonl",
    )

    p_search = sub.add_parser("search", help="Semantic search over history (FTS candidates + embeddings rerank)")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("-k", type=int, default=8, help="Number of results to return")
    p_search.add_argument("--candidates", type=int, default=200, help="FTS candidate pool size before semantic rerank")
    p_search.add_argument("--store", default=str(DEFAULT_STORE_DIR), help="Where the local cache is stored (default: ~/.agents/recall)")
    p_search.add_argument("--source", action="append", default=[], help="Source file(s) or directory(ies) to index/search (repeatable)")
    p_search.add_argument("--model", default="BAAI/bge-small-en-v1.5", help="Embedding model name (fastembed)")
    p_search.add_argument("--scope", default="all", choices=["all", "conv", "notes", "atoms", "skills"], help="Filter results by source type")
    p_search.add_argument("--json", action="store_true", help="Emit JSON")

    args = parser.parse_args(argv)
    store_dir = Path(args.store).expanduser()
    if args.source:
        sources = _iter_sources(args.source)
    else:
        sources = _load_config_sources() or DEFAULT_SOURCES

    if args.cmd == "index":
        meta = do_index(store_dir, sources)
        # Allow piping to tools like `head` without crashing on BrokenPipeError.
        try:
            print(json.dumps(meta, ensure_ascii=True, indent=2))
        except BrokenPipeError:
            return
        return

    if args.cmd == "search":
        raise SystemExit(
            do_search(
                store_dir=store_dir,
                sources=sources,
                query=args.query,
                k=args.k,
                candidates=args.candidates,
                model_name=args.model,
                json_output=bool(args.json),
                scope=str(args.scope),
            )
        )


if __name__ == "__main__":
    main()

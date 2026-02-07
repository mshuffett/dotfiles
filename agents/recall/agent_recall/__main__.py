from __future__ import annotations

import argparse
import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np
from fastembed import TextEmbedding


DEFAULT_STORE_DIR = Path.home() / ".agents" / "recall"
DEFAULT_SOURCES = [
    Path.home() / ".claude" / "history.jsonl",
    Path.home() / ".codex" / "history.jsonl",
]
SCHEMA_VERSION = 2


@dataclass(frozen=True)
class Record:
    ts_ms: int
    project: str
    text: str
    source: str
    session_id: str | None = None


def _iso_from_ts_ms(ts_ms: int) -> str:
    dt = datetime.fromtimestamp(ts_ms / 1000.0, tz=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def _iter_sources(paths: Iterable[str]) -> list[Path]:
    return [Path(p).expanduser() for p in paths]


def _sources_signature(sources: list[Path]) -> list[dict[str, Any]]:
    sig: list[dict[str, Any]] = []
    for p in sources:
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

                records.append(Record(ts_ms=ts, project=project, text=text, source=str(path)))
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
                records.append(Record(ts_ms=ts_ms, project="", text=text.strip(), source=str(path), session_id=session_id))
                continue

    return records


def _read_records(sources: list[Path]) -> list[Record]:
    out: list[Record] = []
    for src in sources:
        out.extend(_load_history_jsonl(src))
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
            }
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
    con.execute("PRAGMA temp_store=MEMORY;")
    con.execute("PRAGMA journal_mode=OFF;")
    con.execute("PRAGMA synchronous=OFF;")
    con.execute("CREATE VIRTUAL TABLE docs USING fts5(text, project UNINDEXED, ts_ms UNINDEXED);")
    con.executemany(
        "INSERT INTO docs(rowid, text, project, ts_ms) VALUES (?, ?, ?, ?);",
        ((i + 1, r.get("text", ""), r.get("project", ""), int(r.get("ts_ms", 0))) for i, r in enumerate(records)),
    )


def _fts_candidates(con: sqlite3.Connection, query: str, limit: int) -> list[int]:
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

    records = _read_records(sources)
    _write_records_jsonl(paths["records"], records)

    meta = {
        "schema_version": SCHEMA_VERSION,
        "created_at": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
        "sources": _sources_signature(sources),
        "count": len(records),
    }
    paths["meta"].write_text(json.dumps(meta, indent=2), encoding="utf-8")
    # We intentionally do not precompute embeddings. Embedding all history is expensive; we embed only top candidates at query-time.
    return meta


def _load_or_index(store_dir: Path, sources: list[Path]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    paths = _store_paths(store_dir)
    meta = _load_meta(paths["meta"])
    if (
        meta is None
        or meta.get("schema_version") != SCHEMA_VERSION
        or meta.get("sources") != _sources_signature(sources)
        or not paths["records"].exists()
    ):
        meta = do_index(store_dir, sources)
    return _load_records_jsonl(paths["records"]), meta


def _format_result(rec: dict[str, Any]) -> str:
    project = rec.get("project") or ""
    ts = rec.get("ts") or ""
    source = rec.get("source") or ""
    origin = "unknown"
    if ".claude" in str(source):
        origin = "claude"
    if ".codex" in str(source):
        origin = "codex"
    sid = rec.get("session_id") or ""
    text = rec.get("text") or ""
    preview = " ".join(str(text).split())
    if len(preview) > 220:
        preview = preview[:220] + "..."
    head = f"{ts}  {origin}"
    if sid:
        head += f"  sid={sid}"
    if project:
        head += f"  {project}"
    return f"{head}\n  {preview}"


def do_search(
    store_dir: Path,
    sources: list[Path],
    query: str,
    k: int,
    candidates: int,
    model_name: str,
    json_output: bool,
) -> int:
    records, meta = _load_or_index(store_dir, sources)
    if not records:
        return 1

    con = sqlite3.connect(":memory:")
    _build_fts(con, records)
    rowids = _fts_candidates(con, query, limit=max(k, candidates))
    if not rowids:
        return 1

    # rowid is 1-based in our insert.
    cand_recs = [records[rid - 1] for rid in rowids if 0 < rid <= len(records)]
    cand_texts = [str(r.get("text", "")) for r in cand_recs]

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
    p_index.add_argument("--source", action="append", default=[], help="History source file(s) (repeatable). Default: ~/.claude/history.jsonl")

    p_search = sub.add_parser("search", help="Semantic search over history (FTS candidates + embeddings rerank)")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("-k", type=int, default=8, help="Number of results to return")
    p_search.add_argument("--candidates", type=int, default=200, help="FTS candidate pool size before semantic rerank")
    p_search.add_argument("--store", default=str(DEFAULT_STORE_DIR), help="Where the local cache is stored (default: ~/.agents/recall)")
    p_search.add_argument("--source", action="append", default=[], help="History source file(s) to index/search (repeatable)")
    p_search.add_argument("--model", default="BAAI/bge-small-en-v1.5", help="Embedding model name (fastembed)")
    p_search.add_argument("--json", action="store_true", help="Emit JSON")

    args = parser.parse_args(argv)
    store_dir = Path(args.store).expanduser()
    sources = _iter_sources(args.source) if args.source else DEFAULT_SOURCES

    if args.cmd == "index":
        meta = do_index(store_dir, sources)
        print(json.dumps(meta, ensure_ascii=True, indent=2))
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
            )
        )


if __name__ == "__main__":
    main()

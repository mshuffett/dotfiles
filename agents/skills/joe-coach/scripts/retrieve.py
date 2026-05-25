# /// script
# requires-python = ">=3.10"
# dependencies = ["openai>=1.40", "numpy>=1.26"]
# ///
"""Retrieve verbatim Joe-anchors relevant to a query.

Usage:
  uv run scripts/retrieve.py "feeling stuck and can't decide" [--k 8] [--source all|snippet|transcript]
Env: OPENAI_API_KEY (required), JOE_COACH_CORPUS (optional override).
"""
import argparse, json, os, pathlib, sys

MODEL = "text-embedding-3-small"
SNIPPET_BOOST = 0.05   # small nudge: snippet bank is curated ground truth

# Resolve the index dir across deploy shapes, in priority order:
#   1. $JOE_COACH_CORPUS/index        — explicit override
#   2. <skill-root>/index             — bundled alongside the skill (portable zip)
#   3. ~/ws/notes/.../index           — the live vault corpus (refreshable)
# This lets the same script work in-place (vault index) and from a self-contained
# zip export (bundled index), without duplicating the index in the dotfiles checkout.
_SKILL_ROOT = pathlib.Path(__file__).resolve().parent.parent
_VAULT_DEFAULT = pathlib.Path(os.path.expanduser(
    "~/ws/notes/3-Resources/Joe Hudson Coaching Corpus"))


def _resolve_index() -> pathlib.Path:
    candidates = []
    env = os.environ.get("JOE_COACH_CORPUS")
    if env:
        candidates.append(pathlib.Path(env) / "index")
    candidates.append(_SKILL_ROOT / "index")       # bundled (zip)
    candidates.append(_VAULT_DEFAULT / "index")     # live vault
    for c in candidates:
        if (c / "chunks.jsonl").exists() and (c / "embeddings.npy").exists():
            return c
    return candidates[0]  # nonexistent → load_index raises a clear error


INDEX = _resolve_index()


def load_index():
    import numpy as np
    chunks = [json.loads(l) for l in (INDEX / "chunks.jsonl").read_text(encoding="utf-8").splitlines()]
    emb = np.load(INDEX / "embeddings.npy")
    return emb, chunks


def embed_query(text):
    import numpy as np
    from openai import OpenAI
    v = OpenAI().embeddings.create(model=MODEL, input=[text]).data[0].embedding
    v = np.asarray(v, dtype="float32")
    return v / (np.linalg.norm(v) + 1e-8)


def rank(qvec, emb, chunks, k=5, source="all", snippet_boost=SNIPPET_BOOST):
    import numpy as np
    scores = emb @ qvec  # cosine (rows are L2-normalized)
    for i, c in enumerate(chunks):
        if c["source"] == "snippet-bank":
            scores[i] += snippet_boost
    order = np.argsort(-scores)
    out = []
    for i in order:
        c = chunks[i]
        if source != "all" and c["source"] != source:
            continue
        out.append({**c, "score": float(scores[i])})
        if len(out) >= k:
            break
    return out


def format_md(results):
    lines = ["## Joe anchors (verbatim — calibrate to these; do not dump them)\n"]
    for r in results:
        src = r["episode"] or r.get("title") or r["source"]
        attribution = f"[{src}]" + (f" {r['url']}" if r.get("url") else "")
        lines.append(f'- "{r["text"].strip()}"  \n  — {attribution} (sim {r["score"]:.2f})')
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--k", type=int, default=8)
    ap.add_argument("--source", choices=["all", "snippet", "transcript"], default="all")
    args = ap.parse_args()
    if not os.environ.get("OPENAI_API_KEY"):
        sys.exit("ERROR: OPENAI_API_KEY not set")
    src = {"snippet": "snippet-bank", "transcript": "transcript", "all": "all"}[args.source]
    emb, chunks = load_index()
    results = rank(embed_query(args.query), emb, chunks, k=args.k, source=src)
    print(format_md(results))


if __name__ == "__main__":
    main()

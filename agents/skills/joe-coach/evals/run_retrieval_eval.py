# /// script
# requires-python = ">=3.10"
# dependencies = ["openai>=1.40", "numpy>=1.26"]
# ///
"""Assert each query surfaces a relevant anchor in top-k. Run: uv run evals/run_retrieval_eval.py"""
import json, os, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "scripts"))
from retrieve import load_index, embed_query, rank  # noqa: E402

cases = json.loads((pathlib.Path(__file__).parent / "retrieval_cases.json").read_text())
emb, chunks = load_index()
passed = 0
for c in cases:
    # k=8 matches the runtime default (retrieve.py --k 8 / SKILL.md), so this eval
    # guards exactly what production retrieves. The "self-reliant" anchor surfaces at
    # rank ~7 for the self-reliance query — caught at k=8 but missed at k=5.
    k = c.get("k", 8)
    hits = rank(embed_query(c["query"]), emb, chunks, k=k)
    blob = " ".join(h["text"].lower() + " " + h["episode"].lower() for h in hits)
    ok = c["expect_substring"].lower() in blob
    print(f"[{'PASS' if ok else 'FAIL'}] {c['query']!r} → expect {c['expect_substring']!r}")
    passed += ok
print(f"\n{passed}/{len(cases)} retrieval cases passed")
sys.exit(0 if passed == len(cases) else 1)

# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy>=1.26"]
# ///
"""Run: uv run scripts/test_retrieve.py — tests cosine ranking with a fake index."""
import numpy as np
from retrieve import rank  # noqa: E402

def test_rank_orders_by_cosine_and_boosts_snippets():
    # 3 unit vectors; query closest to row 0, then row 1, then row 2.
    emb = np.array([[1, 0, 0], [0.8, 0.6, 0], [0, 0, 1]], dtype="float32")
    chunks = [
        {"text": "a", "source": "transcript", "episode": "E"},
        {"text": "b", "source": "snippet-bank", "episode": "S"},
        {"text": "c", "source": "transcript", "episode": "E"},
    ]
    q = np.array([1, 0, 0], dtype="float32")
    out = rank(q, emb, chunks, k=2, snippet_boost=0.0)
    assert [o["text"] for o in out] == ["a", "b"], out
    # With a boost, the snippet (row 1) should be able to overtake row 0.
    out2 = rank(q, emb, chunks, k=1, snippet_boost=0.5)
    assert out2[0]["source"] == "snippet-bank", out2

if __name__ == "__main__":
    test_rank_orders_by_cosine_and_boosts_snippets()
    print("retrieve ranking tests passed")

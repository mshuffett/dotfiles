# /// script
# requires-python = ">=3.10"
# ///
"""Run: uv run build/test_chunker.py"""
from build_index import chunk_words  # noqa: E402

def test_window_and_overlap():
    words = [f"w{i}" for i in range(450)]
    chunks = chunk_words(words, size=200, overlap=50)
    # 450 words, stride 150 → starts at 0,150,300 → 3 chunks
    assert len(chunks) == 3, len(chunks)
    assert chunks[0].split()[:1] == ["w0"]
    assert chunks[1].split()[0] == "w150"      # 200-50 overlap
    assert chunks[-1].split()[-1] == "w449"

def test_short_input_single_chunk():
    assert len(chunk_words(["a", "b", "c"], size=200, overlap=50)) == 1

if __name__ == "__main__":
    test_window_and_overlap(); test_short_input_single_chunk()
    print("chunker tests passed")

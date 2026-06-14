# /// script
# requires-python = ">=3.10"
# dependencies = ["openai>=1.40", "numpy>=1.26"]
# ///
"""Chunk snippet-bank.md + transcripts/*.md and embed into index/.
Usage: uv run build/build_index.py
Env: OPENAI_API_KEY (required), JOE_COACH_CORPUS (optional override).
"""
import json, os, pathlib, re, sys

CORPUS = pathlib.Path(os.environ.get(
    "JOE_COACH_CORPUS",
    os.path.expanduser("~/ws/notes/3-Resources/Joe Hudson Coaching Corpus"),
))
INDEX = CORPUS / "index"
MODEL = "text-embedding-3-small"   # 1536 dims


def chunk_words(words, size=200, overlap=50):
    """Sliding-window chunks of `size` words, stride = size - overlap."""
    if len(words) <= size:
        return [" ".join(words)] if words else []
    stride = size - overlap
    return [" ".join(words[i:i + size]) for i in range(0, len(words), stride)
            if words[i:i + size]]


def parse_frontmatter(text):
    if text.startswith("---"):
        _, fm, body = text.split("---", 2)
        meta = {}
        for line in fm.strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"')
        return meta, body.strip()
    return {}, text


def collect_chunks():
    chunks = []  # each: {text, source, episode, title, url}
    # 1) snippet bank — one chunk per snippet, flagged ground-truth.
    sb = CORPUS / "snippet-bank.md"
    if sb.exists():
        blocks = re.split(r"\n## \d+\n", sb.read_text(encoding="utf-8"))
        for b in blocks:
            m = re.search(r"^> (.+?)\n.*?- source: (.+)$", b.strip(), re.DOTALL | re.MULTILINE)
            if m:
                chunks.append({"text": m.group(1).strip(), "source": "snippet-bank",
                               "episode": m.group(2).strip(), "title": "", "url": ""})
    # 2) transcripts — sliding-window chunks.
    for tf in sorted((CORPUS / "transcripts").glob("*.md")):
        meta, body = parse_frontmatter(tf.read_text(encoding="utf-8"))
        body = re.sub(r"^#.*$", "", body, flags=re.MULTILINE)  # drop the H1
        for c in chunk_words(body.split(), size=200, overlap=50):
            chunks.append({"text": c, "source": "transcript",
                           "episode": meta.get("title", tf.stem),
                           "title": meta.get("title", ""), "url": meta.get("url", "")})
    return chunks


def embed(texts):
    import numpy as np
    from openai import OpenAI
    client = OpenAI()
    vecs = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        resp = client.embeddings.create(model=MODEL, input=batch)
        vecs.extend(d.embedding for d in resp.data)
        print(f"  embedded {min(i + 100, len(texts))}/{len(texts)}")
    arr = np.asarray(vecs, dtype="float32")
    arr /= (np.linalg.norm(arr, axis=1, keepdims=True) + 1e-8)  # L2-normalize for cosine
    return arr


def main():
    import numpy as np
    if not os.environ.get("OPENAI_API_KEY"):
        sys.exit("ERROR: OPENAI_API_KEY not set")
    chunks = collect_chunks()
    if not chunks:
        sys.exit("ERROR: no chunks — run extract_snippets.py and fetch_transcripts.py first")
    print(f"collected {len(chunks)} chunks "
          f"({sum(c['source']=='snippet-bank' for c in chunks)} snippets, "
          f"{sum(c['source']=='transcript' for c in chunks)} transcript chunks)")
    arr = embed([c["text"] for c in chunks])
    INDEX.mkdir(parents=True, exist_ok=True)
    with (INDEX / "chunks.jsonl").open("w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    np.save(INDEX / "embeddings.npy", arr)
    print(f"wrote index/chunks.jsonl ({len(chunks)} lines) and "
          f"index/embeddings.npy {arr.shape}")


if __name__ == "__main__":
    main()

# /// script
# requires-python = ">=3.10"
# ///
"""Extract the numbered verbatim snippet bank from research-report.md."""
import os, re, sys, pathlib

CORPUS = pathlib.Path(os.environ.get(
    "JOE_COACH_CORPUS",
    os.path.expanduser("~/ws/notes/3-Resources/Joe Hudson Coaching Corpus"),
))
report = (CORPUS / "research-report.md").read_text(encoding="utf-8")

# Isolate the snippet-bank section (between its heading and the next H2).
start = report.index("## Verbatim Style Snippet Bank")
end = report.index("\n## ", start + 1)
section = report[start:end]

# Each snippet starts with `N. ` and contains one or more bolded segments.
# Simple entries:   12. **"the quote"** — context [Episode]
# Labeled entries:  60. **Label:** **"quote"** … **"quote2"** [Episode]
#                   (the leading **Label:** must be skipped; capture the quote(s))
num_re = re.compile(r'^\s*(\d+)\.\s+(.*)$', re.DOTALL)
bold_re = re.compile(r'\*\*(.+?)\*\*', re.DOTALL)
# Pull an episode/source tag from trailing [..] if present.
tag_re = re.compile(r'\[([^\]]+)\]\s*$')
# Characters that mark the start/end of a quoted segment (straight + curly).
QUOTE_CHARS = '"“”‘’'


def is_quoted(seg: str) -> bool:
    """A bold segment is a verbatim quote if it opens or closes with a quote mark."""
    s = seg.strip()
    return bool(s) and (s[0] in QUOTE_CHARS or s[-1] in QUOTE_CHARS)


def is_label(seg: str) -> bool:
    """A leading bold segment is a label (not a quote) if it ends with ':' and
    doesn't itself start with a quote mark."""
    s = seg.strip()
    return bool(s) and s.endswith(":") and s[0] not in QUOTE_CHARS


def clean_quote(seg: str) -> str:
    """Strip bold markers and surrounding quote characters from a segment."""
    return seg.replace("**", "").strip().strip(QUOTE_CHARS).strip()


snippets = []
for raw in re.split(r'\n(?=\s*\d+\.\s+\*\*)', section):
    m = num_re.match(raw.strip())
    if not m:
        continue
    num, body = m.group(1), m.group(2).strip()
    segs = [s.strip() for s in bold_re.findall(body)]
    if not segs:
        continue
    # Drop a leading label segment if present, then take the verbatim quotes.
    rest = segs[1:] if is_label(segs[0]) else segs
    quoted = [clean_quote(s) for s in rest if is_quoted(s)]
    if quoted:
        # Join all verbatim quoted segments so the full metaphor is captured.
        quote = " ".join(q for q in quoted if q)
    else:
        # No quote-marked segment: fall back to the first bold segment
        # (preserves behavior for any entry whose quote lacks quote marks).
        quote = clean_quote(rest[0]) if rest else clean_quote(segs[0])
    tag_m = tag_re.search(body)
    episode = tag_m.group(1).strip() if tag_m else ""
    snippets.append((int(num), quote, episode))

snippets.sort()
out = ["# Joe Hudson — Verbatim Snippet Bank",
       "",
       f"_{len(snippets)} snippets extracted verbatim from research-report.md. "
       "Treat as retrieval ground truth._", ""]
for num, quote, episode in snippets:
    out.append(f"## {num}")
    out.append(f"> {quote}")
    out.append(f"")
    out.append(f"- source: {episode or 'unknown'}")
    out.append("")
(CORPUS / "snippet-bank.md").write_text("\n".join(out), encoding="utf-8")
print(f"Wrote {len(snippets)} snippets to snippet-bank.md")
if len(snippets) < 70:
    sys.exit(f"ERROR: expected ~87 snippets, only parsed {len(snippets)} — check the regex.")

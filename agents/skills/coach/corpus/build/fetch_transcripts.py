# /// script
# requires-python = ">=3.10"
# dependencies = ["youtube-transcript-api==0.6.2"]
# ///
"""Fetch transcripts for the 'Coaching Sessions with Joe' playlist.

Primary: youtube-transcript-api. Fallback: yt-dlp json3 auto-subs (CLI).
Idempotent: skips videos whose transcript md already exists.
Usage:
  uv run build/fetch_transcripts.py --playlist
  uv run build/fetch_transcripts.py --video <VIDEO_ID>   # single-video validation
"""
import argparse, json, os, pathlib, re, subprocess, sys, tempfile

CORPUS = pathlib.Path(os.environ.get(
    "JOE_COACH_CORPUS",
    os.path.expanduser("~/ws/notes/3-Resources/Joe Hudson Coaching Corpus"),
))
TRANSCRIPTS = CORPUS / "transcripts"
PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLrbct081G13-RY3N3PkjVN59a0bmhAV2j"


def slugify(title: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
    return s[:60] or "untitled"


def list_playlist():
    """Return list of (video_id, title) via yt-dlp flat enumeration."""
    out = subprocess.run(
        ["yt-dlp", "--flat-playlist", "--print", "%(id)s\t%(title)s", PLAYLIST_URL],
        capture_output=True, text=True, check=True,
    ).stdout.strip().splitlines()
    return [tuple(line.split("\t", 1)) for line in out if "\t" in line]


def video_title(video_id: str) -> str:
    try:
        return subprocess.run(
            ["yt-dlp", "--skip-download", "--print", "%(title)s",
             f"https://www.youtube.com/watch?v={video_id}"],
            capture_output=True, text=True, check=True,
        ).stdout.strip() or video_id
    except subprocess.CalledProcessError:
        return video_id


def fetch_segments_api(video_id: str):
    """Primary path: clean segments via youtube-transcript-api."""
    from youtube_transcript_api import YouTubeTranscriptApi
    return YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "en-US"])


def fetch_segments_ytdlp(video_id: str):
    """Fallback: yt-dlp json3 auto-subs → segments."""
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(
            ["yt-dlp", "--skip-download", "--write-auto-subs", "--sub-langs", "en.*",
             "--sub-format", "json3", "-o", f"{td}/%(id)s.%(ext)s",
             f"https://www.youtube.com/watch?v={video_id}"],
            capture_output=True, text=True, check=True,
        )
        files = list(pathlib.Path(td).glob("*.json3"))
        if not files:
            return []
        data = json.loads(files[0].read_text(encoding="utf-8"))
        segs = []
        for ev in data.get("events", []):
            text = "".join(s.get("utf8", "") for s in ev.get("segs", [])).strip()
            if text:
                segs.append({"text": text, "start": ev.get("tStartMs", 0) / 1000.0})
        return segs


def segments_to_markdown(video_id, title, segments) -> str:
    body = " ".join(s["text"].replace("\n", " ").strip() for s in segments)
    body = re.sub(r"\s+", " ", body).strip()
    return (
        f"---\n"
        f"title: {json.dumps(title)}\n"
        f"video_id: {video_id}\n"
        f"url: https://www.youtube.com/watch?v={video_id}\n"
        f"source: youtube-coaching-playlist\n"
        f"---\n\n# {title}\n\n{body}\n"
    )


def fetch_one(video_id, title=None):
    title = title or video_title(video_id)
    out_path = TRANSCRIPTS / f"{video_id}--{slugify(title)}.md"
    if out_path.exists():
        print(f"skip (exists): {out_path.name}")
        return out_path
    segments = []
    try:
        segments = fetch_segments_api(video_id)
    except Exception as e:  # noqa: BLE001 — fall back deliberately
        print(f"  api failed ({e.__class__.__name__}: {e}); trying yt-dlp fallback")
        try:
            segments = fetch_segments_ytdlp(video_id)
        except Exception as e2:  # noqa: BLE001
            print(f"  yt-dlp fallback failed: {e2}")
    if not segments:
        print(f"  NO TRANSCRIPT for {video_id} — skipping")
        return None
    TRANSCRIPTS.mkdir(parents=True, exist_ok=True)
    out_path.write_text(segments_to_markdown(video_id, title, segments), encoding="utf-8")
    words = sum(len(s["text"].split()) for s in segments)
    print(f"wrote {out_path.name} ({words} words)")
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--playlist", action="store_true")
    ap.add_argument("--video", metavar="VIDEO_ID")
    args = ap.parse_args()
    if args.video:
        ok = fetch_one(args.video)
        sys.exit(0 if ok else 1)
    if args.playlist:
        vids = list_playlist()
        print(f"playlist has {len(vids)} videos")
        got = 0
        for vid, title in vids:
            if fetch_one(vid, title):
                got += 1
        print(f"\nDone: {got}/{len(vids)} transcripts in {TRANSCRIPTS}")
        sys.exit(0 if got else 1)
    ap.error("pass --playlist or --video <ID>")


if __name__ == "__main__":
    main()

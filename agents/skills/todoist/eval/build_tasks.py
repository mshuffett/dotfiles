#!/usr/bin/env python3
"""Parse cached task contexts -> tasks.json (+ N shards for parallel triage).

Usage: python build_tasks.py [--shards N] [--round R]
Reads  ../fixtures/private/cache/*.txt
Writes ../fixtures/private/tasks.json  and  ../fixtures/private/runs/round-R/shard-K.json

Strips human-authored guidance comments (oracle) from the known guidance task IDs so triage
agents never see them. Everything stays under fixtures/private/ (gitignored)."""
import argparse, glob, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
PRIV = os.path.join(HERE, "..", "fixtures", "private")
CACHE = os.path.join(PRIV, "cache")

# Tasks whose only comment is Michael's triage-guidance (the oracle) — strip their comments.
GUIDANCE_IDS = {"6gr5mX4f8mvFJ294", "6gr3r8G3vQRjVfcW", "6gqvvJjm8wRVXrxW"}

def parse(path):
    txt = open(path).read()
    m = re.search(r"===== TASK (\w+) =====", txt)
    if not m: return None
    tid = m.group(1)
    body = txt[m.end():]
    # title: non-empty lines until a line starting with "ID:"
    title_lines = []
    for line in body.splitlines():
        if re.match(r"\s*ID:\s", line): break
        if line.strip(): title_lines.append(line.strip())
    content = " ".join(title_lines)
    def field(name):
        mm = re.search(rf"^\s*{name}:\s*(.+)$", body, re.M)
        return mm.group(1).strip() if mm else ""
    priority = field("Priority")
    project = field("Project")
    due = field("Due")
    # description: between "Description:" and "----- COMMENTS -----"
    desc = ""
    dm = re.search(r"Description:\s*(.*?)\n-----\s*COMMENTS", body, re.S)
    if dm: desc = dm.group(1).strip()
    # comments: after "----- COMMENTS -----"
    comments = ""
    cm = re.search(r"-----\s*COMMENTS\s*-----\s*(.*)$", body, re.S)
    if cm:
        c = cm.group(1).strip()
        if c and "No comments" not in c: comments = c
    if tid in GUIDANCE_IDS:
        comments = ""  # withhold oracle guidance
    return {"id": tid, "content": content, "project": project, "due": due,
            "priority": priority, "description": desc, "comments": comments,
            "has_withheld_guidance": tid in GUIDANCE_IDS}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shards", type=int, default=5)
    ap.add_argument("--round", default="2")
    a = ap.parse_args()
    tasks = []
    for p in sorted(glob.glob(os.path.join(CACHE, "*.txt"))):
        t = parse(p)
        if t and t["content"]: tasks.append(t)
    json.dump(tasks, open(os.path.join(PRIV, "tasks.json"), "w"), indent=2)
    rdir = os.path.join(PRIV, "runs", f"round-{a.round}")
    os.makedirs(rdir, exist_ok=True)
    for k in range(a.shards):
        shard = [t for i, t in enumerate(tasks) if i % a.shards == k]
        json.dump(shard, open(os.path.join(rdir, f"shard-{k}.json"), "w"), indent=2)
    print(f"tasks.json: {len(tasks)} tasks; {a.shards} shards in runs/round-{a.round}/")
    print("with description:", sum(1 for t in tasks if t["description"]),
          "| with comments:", sum(1 for t in tasks if t["comments"]),
          "| withheld-guidance:", sum(1 for t in tasks if t["has_withheld_guidance"]))

if __name__ == "__main__":
    main()

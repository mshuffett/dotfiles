# /// script
# requires-python = ">=3.10"
# dependencies = ["anthropic>=0.39"]
# ///
"""Generate coaching replies, score them for Joe-voice fidelity with Claude.
Run: uv run evals/run_voice_judge.py
Env: ANTHROPIC_API_KEY (or rely on the local Claude Code auth), JOE_COACH_CORPUS.
"""
import json, pathlib, re, sys
from anthropic import Anthropic

HERE = pathlib.Path(__file__).resolve().parent
SKILL = HERE.parent
persona = (SKILL / "references" / "coach-prompt-full.md").read_text(encoding="utf-8")
scenarios = json.loads((HERE / "scenarios.json").read_text())
client = Anthropic()

# Try claude-opus-4-7; fall back to claude-sonnet-4-6 if unavailable.
PREFERRED_MODEL = "claude-opus-4-7"
FALLBACK_MODEL = "claude-sonnet-4-6"

def pick_model():
    """Probe which model is available; return the model id used."""
    try:
        client.messages.create(
            model=PREFERRED_MODEL, max_tokens=5,
            messages=[{"role": "user", "content": "hi"}],
        )
        return PREFERRED_MODEL
    except Exception as e:
        msg = str(e)
        if "model" in msg.lower() or "not found" in msg.lower() or "invalid" in msg.lower():
            print(f"[warn] {PREFERRED_MODEL} unavailable ({e.__class__.__name__}); "
                  f"falling back to {FALLBACK_MODEL}")
            return FALLBACK_MODEL
        raise  # unexpected error — propagate

MODEL = pick_model()
print(f"[info] using model: {MODEL}\n")

RUBRIC = """Score 0-2 each (0 no, 1 partial, 2 yes):
(a) short turns / no long lecture;
(b) moves toward body/feeling not story;
(c) uses how/what not why;
(d) no "you should";
(e) validates before pushing;
(f) welcomes/amplifies the feeling rather than soothing or advising;
(g) no technique-narration.

IMPORTANT: Return ONLY a raw JSON object — no markdown, no prose before or after.
Format: {"scores":{"a":N,"b":N,"c":N,"d":N,"e":N,"f":N,"g":N},"total":N,"note":"..."}"""


def generate(scenario: str) -> str:
    msg = client.messages.create(
        model=MODEL, max_tokens=400,
        system=persona,
        messages=[{"role": "user", "content": scenario}],
    )
    return "".join(b.text for b in msg.content if b.type == "text")


def extract_json(txt: str) -> dict:
    """Extract first {...} block from txt; raises ValueError if none found."""
    # Find outermost {...} spanning the JSON object
    start = txt.find("{")
    if start == -1:
        raise ValueError("no '{' found")
    end = txt.rindex("}")
    if end <= start:
        raise ValueError("no matching '}' found")
    return json.loads(txt[start:end + 1])


def judge(scenario: str, reply: str, attempt: int = 1) -> dict | None:
    """Judge a coaching reply. Returns dict or None if unparseable after retry."""
    prompt = (
        f"COACHEE: {scenario}\n\n"
        f"COACH REPLY:\n{reply}\n\n"
        f"{RUBRIC}"
    )
    try:
        msg = client.messages.create(
            model=MODEL, max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        txt = "".join(b.text for b in msg.content if b.type == "text")
        return extract_json(txt)
    except (json.JSONDecodeError, ValueError) as e:
        if attempt == 1:
            print(f"  [warn] judge parse error on attempt 1 ({e}); retrying...")
            return judge(scenario, reply, attempt=2)
        print(f"  [warn] judge parse error on attempt 2 ({e}); skipping scenario.")
        return None


total, maxtotal = 0, 0
skipped = 0
for s in scenarios:
    print(f"\n=== Scenario: {s[:60]}...")
    reply = generate(s)
    verdict = judge(s, reply)
    if verdict is None:
        skipped += 1
        maxtotal += 14
        print(f"  SKIPPED (judge returned unparseable output)")
        print(f"  Generated reply:\n{reply}")
        continue
    score = verdict.get("total", sum(verdict.get("scores", {}).values()))
    total += score
    maxtotal += 14
    print(f"  Score: {score}/14")
    print(f"  Reply:\n{reply}")
    print(f"  Judge note: {verdict.get('note', '(none)')}")
    if "scores" in verdict:
        print(f"  Breakdown: {verdict['scores']}")

pct = 100 * total / maxtotal if maxtotal > 0 else 0
skipped_note = f" ({skipped} scenario(s) skipped — counted as 0/14)" if skipped else ""
print(f"\nVOICE FIDELITY: {total}/{maxtotal} ({pct:.0f}%){skipped_note}")
sys.exit(0 if pct >= 75 else 1)

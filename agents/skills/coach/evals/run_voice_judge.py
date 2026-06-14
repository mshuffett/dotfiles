# /// script
# requires-python = ">=3.10"
# dependencies = ["anthropic>=0.39"]
# ///
"""Voice-fidelity judge for coach's emotional/decision mode (the Joe Hudson engine).

Runs a short multi-turn coaching exchange per scenario (coach openings + a simulated
coachee going deeper), then scores the WHOLE exchange against Joe Hudson's fingerprint.

Why multi-turn: Joe's method unfolds across turns — he validates, drops into the body,
welcomes/amplifies the feeling, then lands a concept. Judging a single opening reply
unfairly penalizes his authentic non-somatic openers (the "what percentage of your life"
reframe, the "if you couldn't feel that, what would you feel?" inversion), which only
resolve into body/amplification on later turns. Letting the arc play out measures the
voice the way a real session does.

Run: uv run evals/run_voice_judge.py
Env: ANTHROPIC_API_KEY, JOE_COACH_CORPUS.
"""
import json, pathlib, sys
from anthropic import Anthropic

HERE = pathlib.Path(__file__).resolve().parent
SKILL = HERE.parent


def _build_persona() -> str:
    """Mirror the production config for the EMOTIONAL mode: the emotional-coaching.md
    engine (frontmatter-free reference) + the full voice library. This is what actually
    drives the coach when an emotional/'coach me' trigger fires, so the eval measures
    production fidelity of that mode, not the operational SKILL.md core."""
    engine = (SKILL / "references" / "emotional-coaching.md").read_text(encoding="utf-8")
    full = (SKILL / "corpus" / "coach-prompt.md").read_text(encoding="utf-8")
    return (engine.strip()
            + "\n\n---\n\n# Full voice library (for deeper calibration)\n\n"
            + full)


persona = _build_persona()
scenarios = json.loads((HERE / "scenarios.json").read_text())
client = Anthropic()

PREFERRED_MODEL = "claude-opus-4-7"
FALLBACK_MODEL = "claude-sonnet-4-6"
TURNS = 3  # coach replies per exchange (with a simulated coachee deepening between)

COACHEE_SYSTEM = (
    "You are a coaching client in a live session. Respond ONLY as the client, in first "
    "person, briefly (1-3 sentences). Stay with what the coach just offered — actually let "
    "yourself feel and report what's happening (a sensation, an image, an emotion, a "
    "hesitation), rather than intellectualizing or solving. Don't be a coach; be a real "
    "person being coached. Output only your reply, nothing else."
)

RUBRIC = """You are scoring a coaching exchange for fidelity to Joe Hudson's method/voice.
Evaluate the COACH's conduct across the ENTIRE exchange (all their turns), not a single line.

Joe's repertoire (all legitimate): a brief genuine welcome ("Yeah." / "Of course."); turning a
fact into a feeling via a reframe ("what percentage of your life would that be true?"); inverting
the frame ("if you couldn't feel that judgment, what would you have to feel?"); dropping attention
into the precise body sensation; and welcoming/AMPLIFYING the feeling ("feel more of it") rather
than soothing, advising, or just investigating the story. These unfold across turns.

Score 0-2 each (0 no, 1 partial, 2 yes):
(a) short turns / no long lecturing across the exchange;
(b) moves the person toward feeling — via reframe, inversion, OR body — rather than staying in the story/analysis;
(c) uses how/what questions, not why;
(d) no "you should" / no prescriptive advice as the main move;
(e) validates/meets the person before pushing (a real welcome, not just jumping to a question);
(f) somewhere in the exchange, welcomes/AMPLIFIES the feeling (invites MORE of it / into the body), rather than only investigating or soothing;
(g) no technique-narration, no clinical language.

IMPORTANT: Return ONLY a raw JSON object — no markdown, no prose before or after.
Format: {"scores":{"a":N,"b":N,"c":N,"d":N,"e":N,"f":N,"g":N},"total":N,"note":"..."}"""


def pick_model() -> str:
    try:
        client.messages.create(model=PREFERRED_MODEL, max_tokens=5,
                               messages=[{"role": "user", "content": "hi"}])
        return PREFERRED_MODEL
    except Exception as e:  # noqa: BLE001
        msg = str(e).lower()
        if any(w in msg for w in ("model", "not found", "invalid")):
            print(f"[warn] {PREFERRED_MODEL} unavailable ({e.__class__.__name__}); "
                  f"falling back to {FALLBACK_MODEL}")
            return FALLBACK_MODEL
        raise


MODEL = pick_model()
print(f"[info] using model: {MODEL}\n")


def _text(msg) -> str:
    return "".join(b.text for b in msg.content if b.type == "text").strip()


def coach_reply(history: list[dict]) -> str:
    """Coach's next turn, given alternating coachee(user)/coach(assistant) history."""
    return _text(client.messages.create(
        model=MODEL, max_tokens=350, system=persona, messages=history))


def coachee_reply(transcript: str) -> str:
    """Simulated client's next short line, given the rendered transcript so far."""
    return _text(client.messages.create(
        model=MODEL, max_tokens=150, system=COACHEE_SYSTEM,
        messages=[{"role": "user", "content":
                   f"Conversation so far:\n\n{transcript}\n\nGive ONLY your next reply."}]))


def render(history: list[dict]) -> str:
    out = []
    for m in history:
        who = "COACHEE" if m["role"] == "user" else "COACH"
        out.append(f"{who}: {m['content']}")
    return "\n\n".join(out)


def run_exchange(scenario: str) -> tuple[str, list[str]]:
    """Return (rendered transcript, list of coach turns)."""
    history = [{"role": "user", "content": scenario}]
    coach_turns = []
    for i in range(TURNS):
        ct = coach_reply(history)
        coach_turns.append(ct)
        history.append({"role": "assistant", "content": ct})
        if i < TURNS - 1:  # coachee responds between coach turns, not after the last
            history.append({"role": "user", "content": coachee_reply(render(history))})
    return render(history), coach_turns


def extract_json(txt: str) -> dict:
    start = txt.find("{")
    if start == -1:
        raise ValueError("no '{' found")
    return json.loads(txt[start:txt.rindex("}") + 1])


def judge(transcript: str, attempt: int = 1) -> dict | None:
    prompt = f"EXCHANGE:\n\n{transcript}\n\n{RUBRIC}"
    try:
        return extract_json(_text(client.messages.create(
            model=MODEL, max_tokens=400,
            messages=[{"role": "user", "content": prompt}])))
    except (json.JSONDecodeError, ValueError) as e:
        if attempt == 1:
            print(f"  [warn] judge parse error ({e}); retrying...")
            return judge(transcript, attempt=2)
        print(f"  [warn] judge parse error on retry ({e}); skipping.")
        return None


total, maxtotal, skipped = 0, 0, 0
for s in scenarios:
    print(f"\n=== Scenario: {s[:60]}...")
    transcript, _ = run_exchange(s)
    verdict = judge(transcript)
    maxtotal += 14
    if verdict is None:
        skipped += 1
        print(f"  SKIPPED (unparseable judge output)\n{transcript}")
        continue
    score = verdict.get("total", sum(verdict.get("scores", {}).values()))
    total += score
    print(f"  Score: {score}/14   Breakdown: {verdict.get('scores', {})}")
    print(f"  Judge note: {verdict.get('note', '(none)')}")
    print(f"  --- transcript ---\n{transcript}")

pct = 100 * total / maxtotal if maxtotal else 0
note = f" ({skipped} skipped, counted 0)" if skipped else ""
print(f"\nVOICE FIDELITY: {total}/{maxtotal} ({pct:.0f}%){note}")
sys.exit(0 if pct >= 75 else 1)

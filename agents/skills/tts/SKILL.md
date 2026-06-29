---
name: tts
description: Use when generating spoken audio / text-to-speech from the command line — "read this aloud", "make an audio clip", "generate a voiceover", "TTS this", "have it say…", "multi-speaker dialogue", "podcast-style audio", "use my voice", or any request to turn text into speech. Covers the four committed TTS CLIs in ~/.dotfiles/bin (elevenlabs-tts, hume-tts, gemini-tts, inworld-tts): which engine to pick, single- and multi-speaker usage, Michael's cloned-voice aliases, and ElevenLabs v3 audio tags. Prefer this over hand-rolling curl calls to any TTS API.
---

# TTS (text-to-speech CLIs)

Four committed CLI tools in `~/.dotfiles/bin/` wrap the TTS providers. Each takes text, writes an audio file, and prints a `✓` on success. They read API keys from `~/.env.zsh`. **Don't hand-roll `curl` to a TTS API — use these tools; if one is missing a capability, extend the tool (see `cli-tools` skill) rather than doing a one-off.**

## Pick an engine

| Want… | Use | Why |
|-------|-----|-----|
| **Michael's own voice** (cloned) | `elevenlabs-tts` | Only engine with his voice clone; default choice |
| **Expressive control via [tags]** | `elevenlabs-tts` | v3 audio tags: `[laughs]`, `[whispers]`, etc. |
| **Free-ish 2-speaker dialogue** | `gemini-tts --multi-speaker` | Gemini 2.5; prebuilt voices only (no clone) |
| **Emotionally-aware narration** | `hume-tts` | Octave; natural-language voice descriptions, library voices |
| **Fast single-utterance / realtime** | `inworld-tts` | Single text + single voice only (no multi-speaker) |

**Default to `elevenlabs-tts`** unless the user wants a free option (Gemini) or a specific provider. It's the only one that speaks in Michael's voice.

## Multi-speaker support

| Tool | Multi-speaker | Mechanism |
|------|---------------|-----------|
| `elevenlabs-tts` | ✅ native | `--dialogue` → text-to-dialogue API (N speakers, one combined clip) |
| `gemini-tts` | ✅ native | `--multi-speaker` → exactly 2 prebuilt voices, `Speaker 1:`/`Speaker 2:` labels |
| `hume-tts` | ✅ native | `--dialogue` → `utterances[]` with per-line voice, one combined clip |
| `inworld-tts` | ❌ none | API takes one `text` + one `voiceId`; would require stitching N calls |

## elevenlabs-tts (default)

Voice **aliases** (no need to remember IDs): `me`/`male` → Michael's clone, `female` → a female voice. Any other value is a literal ElevenLabs voice_id.

```bash
# single speaker (defaults to --voice me)
elevenlabs-tts "Hey, this is a quick test." -o out.mp3
elevenlabs-tts "[whispers] don't tell anyone [sighs] it's a secret" --voice female

# multi-speaker dialogue (one request → one combined mp3)
elevenlabs-tts --dialogue --speaker "Me=me" --speaker "Her=female" \
  "Me: Did it work?
   Her: It did. [laughs]"
# or from a file:
elevenlabs-tts --dialogue --speaker "Me=me" --speaker "Her=female" --script chat.txt
```

**Audio tags (v3)** pass straight through the text — the engine performs them, not speaks them. The voice must be capable of the tag (a calm narrator won't `[shout]`), and tags need `Creative`/`Natural` stability to take effect. Don't over-stuff: a couple per line.
- Emotion: `[happy]` `[sad]` `[angry]` `[excited]` `[sarcastic]` `[nervous]`
- Non-verbal: `[laughs]` `[chuckles]` `[sighs]` `[gasps]` `[clears throat]` `[crying]`
- Delivery: `[whispers]` `[shouts]` `[rushed]` `[dramatic tone]`
- Accents (can switch mid-line): `[British accent]` `[Southern US accent]` `[French accent]` `[pirate voice]`
- Dialogue dynamics: `[interrupting]` `[overlapping]`
- Pacing also comes from punctuation: `...` trails off; commas/periods add natural breaths.

## gemini-tts

Self-bootstrapping `uv` script (PEP 723) — first run auto-installs `google-genai`, no system-Python install needed. Multi-speaker is exactly 2 named speakers.

```bash
gemini-tts "Hello there." --voice Zephyr -o out.wav
gemini-tts --multi-speaker --voice Zephyr --voice2 Puck \
  "Speaker 1: Did it work? Speaker 2: It did!" -o dialogue.wav
```
30 prebuilt voices (Zephyr, Puck, Kore, Charon, …). Output is WAV (24kHz). No voice cloning. Models: `--model flash|pro|native-audio`.

## hume-tts (Octave)

```bash
hume-tts "Warm and calm narration." --description "soothing, slow" -o out.mp3
# multi-speaker:
hume-tts --dialogue \
  --speaker "Alice=<voiceId>" --speaker "Bob=<voiceId>" \
  "Alice: Did it work?
   Bob: It did." -o dialogue.mp3
# voices: --provider HUME_AI (library, default) or CUSTOM_VOICE (saved/cloned)
# list library voices: curl -s "https://api.hume.ai/v0/tts/voices?provider=HUME_AI" -H "X-Hume-Api-Key: $HUME_API_KEY"
```
Library voices via UUID; pass `--provider CUSTOM_VOICE` for cloned/saved voices. Michael has no Hume clone saved yet (would need a 5–15s sample uploaded to make Hume speak as him).

## inworld-tts

```bash
inworld-tts "Single-voice line." --voice Ashley --model inworld-tts-max -o out.mp3
```
Single speaker only. Voices: Ashley, Bryson, Emma, Ethan, … (see `--help`). Cloning is supported by the API but not wired into this CLI.

## Playback & env

- Play a clip: `afplay out.mp3` (macOS).
- Required keys in `~/.env.zsh`: `ELEVEN_LABS_API_KEY`, `GEMINI_API_KEY`, `HUME_API_KEY`, `INWORLD_API_KEY`.
- Each tool has `--help` with full options and examples.

## Dialogue script format (shared convention)

`elevenlabs-tts` and `hume-tts` parse `--dialogue` text the same way: each line is `SpeakerName: text`, where `SpeakerName` matches a `--speaker "Name=voiceOrId"` mapping. Lines without a recognized prefix continue the previous speaker. Use `--script file.txt` to read a multi-line script from a file.

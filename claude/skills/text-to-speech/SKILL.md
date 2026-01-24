---
name: tts
description: Use when generating speech audio, creating voiceovers, or making podcasts. Covers Inworld, Hume Octave, and Gemini TTS providers with voice selection and emotion control.
---

# Text-to-Speech (TTS)

Generate high-quality speech audio using three top-tier TTS services.

## When This Skill Activates

- User asks to generate speech or audio from text
- Creating voiceovers, podcasts, or audio content
- User mentions "text to speech", "TTS", "generate audio"
- Working with voice synthesis or audio generation

## Available Services

### Hume Octave (#1 on TTS Arena V2 - ELO 1632)

- **Dynamic voice generation from text** (unique feature!)
- Optional voice style descriptions
- Built-in emotional intelligence
- Voice Library with 100+ pre-crafted voices (requires UUID)
- Command: `hume-tts`

### Inworld TTS MAX (#2 on TTS Arena V2 - ELO 1629)

- Highest quality Inworld model
- 20+ pre-defined voices
- Best for quality-critical applications
- Command: `inworld-tts --model inworld-tts-max`

### Inworld TTS (#3 on TTS Arena V2 - ELO 1609)

- 20+ pre-defined voices
- Fast, consistent results (default model)
- Command: `inworld-tts`

### Google Gemini 2.5 TTS (Latest)

- **Native multi-speaker podcast generation** (unique feature!)
- 30 pre-defined voices with distinct characteristics
- Single-speaker and 2-speaker modes
- Automatic script generation for conversations
- Command: `gemini-tts`

## Quick Start

### Inworld TTS

```bash
# Basic usage (uses Eve voice by default)
inworld-tts "Your text here"

# Custom voice
inworld-tts "Hello world" --voice Noah

# High quality model
inworld-tts "Hello world" --model inworld-tts-max

# Custom output file
inworld-tts "Hello world" --output greeting.mp3
```

### Hume TTS

```bash
# Dynamic voice generation (no voice specified)
hume-tts "Your text here"

# With voice style description
hume-tts "Hello world" --description "smooth, captivating, slightly breathy female"

# Use voice from library (requires UUID)
hume-tts "Hello world" --voice "f898a92e-685f-43fa-985b-a46920f0650b"

# Instant mode for faster processing
hume-tts "Hello world" --instant
```

**Michael's Preferred Voices** (pick one per session, stay consistent):

| Voice | ID | Best For |
|-------|-----|----------|
| Mysterious Woman | `f898a92e-685f-43fa-985b-a46920f0650b` | Engaging, captivating (favorite) |
| Inspiring Woman | `b201d214-914c-4d0a-b8e4-54adfc14a0dd` | Motivational, warm |
| Ava Song | `5bb7de05-c8fe-426a-8fcc-ba4fc4ce9f9c` | Quick, expressive |
| Demure Conversationalist | `d6fd5cc2-53e6-4e80-ba83-93972682386a` | Soft, thoughtful |
| Serene Assistant | `71de875d-bc14-4ed5-87da-8584ba4ea247` | Calm, professional |
| Expressive Girl | `6b530c02-5a80-4e60-bb68-f2c171c5029f` | Animated, lively |

**Preferred style modifiers** (layer on top of voice ID via description):

```text
"slight vocal fry, breathy, airy, light feminine resonance, intimate, engaging, emphasis on important words, subtle British pronunciation"
```

### Gemini TTS

```bash
# Basic usage (uses Zephyr voice by default, outputs WAV)
gemini-tts "Your text here"

# Custom voice
gemini-tts "Hello world" --voice Sulafat

# Multi-speaker with explicit dialogue (text must include speaker labels)
gemini-tts "Speaker 1: Hello! Speaker 2: Hi there!" --multi-speaker

# Custom output file and model
gemini-tts "Hello world" --output greeting.wav --model pro
```

## Choosing a Service

- **Inworld**: Best for consistent voices, faster generation, specific voice requirements
- **Hume**: Best for dynamic/unique voices, emotional intelligence, voice style descriptions
- **Gemini**: Best for multi-speaker podcast generation, natural conversations

## Common Workflows

### Generate and Play Audio

```bash
inworld-tts "Your text here" && afplay output.mp3
hume-tts "Your text here" && afplay output.mp3
gemini-tts "Your text here" && afplay output.wav
```

### Multi-Speaker Podcast Generation

```bash
# Gemini's native multi-speaker mode (requires speaker labels)
gemini-tts "Speaker 1: Welcome to our show about AI! Speaker 2: Thanks for having me!" --multi-speaker -o podcast.wav
```

### Dynamic Voice with Description

```bash
# Let Hume generate voices based on style descriptions
hume-tts "Welcome to our podcast" -d "professional news anchor" -o intro.mp3
hume-tts "Thanks for listening!" -d "warm and enthusiastic" -o outro.mp3
```

## Emotion Control

### Hume: Acting Instructions (via `--description`)

- **Emotional tone**: happy, sad, excited, nervous, melancholic, frustrated
- **Delivery style**: whispering, shouting, rushed, measured pace
- **Context**: speaking to a crowd, intimate conversation, pedagogical

```bash
hume-tts "I can't believe this happened" -d "shocked, dismayed" -o shocked.mp3
hume-tts "Let us begin by taking a deep breath in" -d "calm, pedagogical" --speed 0.65 -o meditation.mp3
```

### Inworld: Audio Markups (Text Inline)

- `[happy]`, `[sad]`, `[angry]`, `[excited]` - Emotions
- `[whispering]`, `[shouting]` - Delivery
- `[laughing]`, `[sigh]`, `[cough]` - Non-verbal
- `*word*` - Emphasis

```bash
inworld-tts "[happy] I can't believe this is happening!" -o happy.mp3
inworld-tts "[angry] I can't believe you did that. [laughing] Got you!" -o prank.mp3
```

## Available Voices

### Inworld Female Voices

Eve (default), Ashley, Cassidy, Daria, Emma, Harper, Madison, Olivia, Riley, Samantha

### Inworld Male Voices

Bryson, Dylan, Ethan, Jackson, Liam, Mason, Noah

### Inworld Gender-Neutral

Jordan, Kelly, Morgan, Taylor

### Gemini Voices (30 total)

Zephyr (Bright), Sulafat (Warm), Charon (Engaging), Kore (Soothing), Aoede (Groundbreaking), Puck (Expressive), Fenrir (Clear), Oberon (Deep), and more

## Environment Variables

- `INWORLD_API_KEY` - Inworld API key (base64 encoded)
- `HUME_API_KEY` - Hume API key
- `GEMINI_API_KEY` - Google Gemini API key

All configured in `~/.env.zsh`.

## Script Locations

- `~/.dotfiles/bin/inworld-tts` (Node.js)
- `~/.dotfiles/bin/hume-tts` (Node.js)
- `~/.dotfiles/bin/gemini-tts` (Python 3)

## Acceptance Checks

- [ ] Generated audio file exists at specified output path
- [ ] Audio plays correctly via `afplay` (macOS)
- [ ] Correct voice was used (verify by listening)
- [ ] For multi-speaker: both voices are distinguishable

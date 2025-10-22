---
description: Text-to-speech generation using Inworld TTS (#1 on TTS Arena) and Hume Octave (#2 on TTS Arena). Provides high-quality voice synthesis with 20+ voices, dynamic voice generation, and multiple quality models. Use when user asks to generate speech, create audio from text, or work with TTS/voice generation. Includes command reference for both services, voice options, and workflow examples.
---

# Text-to-Speech (TTS) Command

Generate high-quality speech audio using two top-ranked TTS services.

## Available Services

### Inworld TTS (#1 on TTS Arena - ELO 1679)
- 20+ pre-defined voices
- Two quality models (standard and max)
- Fast, consistent results
- Command: `inworld-tts`

### Hume Octave (#2 on TTS Arena - ELO 1669)
- **Dynamic voice generation from text** (unique feature!)
- Optional voice style descriptions
- Built-in emotional intelligence
- Voice Library with 100+ pre-crafted voices (requires UUID)
- Command: `hume-tts`

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
hume-tts "Hello world" --description "warm and friendly"

# Use voice from library (requires UUID)
hume-tts "Hello world" --voice "uuid-from-voice-library"

# Instant mode for faster processing
hume-tts "Hello world" --instant
```

## Command Reference

### Inworld TTS

**Syntax:**
```bash
inworld-tts <text> [options]
```

**Options:**
- `--voice, -v <name>` - Voice ID (default: Eve)
- `--model, -m <id>` - Model ID (default: inworld-tts-1)
- `--output, -o <file>` - Output filename (default: output.mp3)
- `--help, -h` - Show help message

**Models:**

**inworld-tts-1** (default)
- Ranked #1 on TTS Arena (ELO: 1679)
- 60% win rate
- Fast, high quality

**inworld-tts-max**
- Ranked #3 on TTS Arena (ELO: 1668)
- 65% win rate
- Higher quality, slightly slower

### Hume TTS (Octave)

**Syntax:**
```bash
hume-tts <text> [options]
```

**Options:**
- `--voice, -v <name>` - Voice ID (default: dynamic generation)
- `--description, -d <text>` - Voice style description
- `--speed, -s <float>` - Playback speed multiplier (default: 1.0)
- `--output, -o <file>` - Output filename (default: output.mp3)
- `--format, -f <type>` - Audio format: mp3, wav, pcm (default: mp3)
- `--instant` - Use instant mode for faster processing
- `--help, -h` - Show help message

**Voice Library:**
- 100+ pre-crafted voices with unique styles, personalities, and accents
- Requires UUID from Voice Library (list at: `https://api.hume.ai/v0/tts/voices?provider=HUME_AI`)
- Or use your own saved custom voices

**Dynamic Voice Generation (Recommended):**
If no `--voice` is specified, Hume generates a unique voice based on the text's emotional and semantic content. Use `--description` to guide the voice style (e.g., "warm and friendly", "professional and clear", "energetic and upbeat").

## Available Voices

### Female Voices
- **Eve** (default)
- Ashley
- Cassidy
- Daria
- Emma
- Harper
- Madison
- Olivia
- Riley
- Samantha

### Male Voices
- Bryson
- Dylan
- Ethan
- Jackson
- Liam
- Mason
- Noah

### Gender-Neutral Voices
- Jordan
- Kelly
- Morgan
- Taylor

## Common Workflows

### Generate and Play Audio
```bash
inworld-tts "Your text here" && open output.mp3
hume-tts "Your text here" && open output.mp3
```

### Batch Generation
```bash
inworld-tts "First message" -o message1.mp3
inworld-tts "Second message" -o message2.mp3
inworld-tts "Third message" -o message3.mp3
```

### Different Voices for Dialogue
```bash
# Using Inworld
inworld-tts "Hello, how are you?" -v Emma -o speaker1.mp3
inworld-tts "I'm doing great, thanks!" -v Noah -o speaker2.mp3

# Using Hume with dynamic voices
hume-tts "Hello, how are you?" -d "friendly female voice" -o speaker1.mp3
hume-tts "I'm doing great, thanks!" -d "upbeat male voice" -o speaker2.mp3
```

### Test Multiple Voices
```bash
# Inworld voices
for voice in Eve Noah Emma Liam; do
  inworld-tts "Testing $voice voice" -v "$voice" -o "test-inworld-$voice.mp3"
done

# Hume voices
for voice in ITO KORA DACHER AURA; do
  hume-tts "Testing $voice voice" -v "$voice" -o "test-hume-$voice.mp3"
done
```

### Compare Services
```bash
# Same text, different services
TEXT="The quick brown fox jumps over the lazy dog"
inworld-tts "$TEXT" -o inworld-comparison.mp3
hume-tts "$TEXT" -o hume-comparison.mp3
```

### Dynamic Voice with Description
```bash
# Let Hume generate voices based on style descriptions
hume-tts "Welcome to our podcast" -d "professional news anchor" -o intro.mp3
hume-tts "Thanks for listening!" -d "warm and enthusiastic" -o outro.mp3
```

## Environment

Environment variables are set in `~/.env.zsh`:

**Inworld:**
- `INWORLD_API_KEY` - Inworld API key (base64 encoded)

**Hume:**
- `HUME_API_KEY` - Hume API key
- `HUME_SECRET_KEY` - Hume secret key (optional)

## Script Locations

Both scripts are located in `~/.dotfiles/bin/` and version controlled:
- `~/.dotfiles/bin/inworld-tts`
- `~/.dotfiles/bin/hume-tts`

## TTS Arena Rankings (Reference)

Top performing TTS models as of 2025:
1. **Inworld TTS** - ELO 1679 (60% win rate) ← **You have this**
2. **Hume Octave** - ELO 1669 (66% win rate) ← **You have this**
3. **Inworld TTS MAX** - ELO 1668 (65% win rate) ← **You have this**
4. Eleven Turbo v2.5 - ELO 1647
5. Papla P1 - ELO 1599

Top open-source:
- Kokoro v1.0 - ELO 1467 (#13 overall)
- CosyVoice 2.0 - ELO 1439 (#14 overall)

**You have access to the top 3 models on TTS Arena!**

## Tips

### Choosing a Service
- **Inworld**: Best for consistent voices, faster generation, specific voice requirements
- **Hume**: Best for dynamic/unique voices, emotional intelligence, voice style descriptions

### Voice Selection
- **Inworld**: Test a few pre-defined voices to find what works best
- **Hume**: Use voice descriptions for natural variation, or built-in voices for consistency

### Model/Quality
- Use `inworld-tts-1` for speed, `inworld-tts-max` for highest quality
- Use `--instant` flag with Hume for real-time applications

### File Organization
- Use descriptive output filenames to stay organized
- Consider prefixing with service name for comparisons (e.g., `inworld-intro.mp3`, `hume-intro.mp3`)

### Playback
- MP3 files default to VLC on your system

## Troubleshooting

**Error: API key not set**
- Run `source ~/.env.zsh` in current session
- Or start a new terminal session (auto-loaded)
- Verify keys exist in `~/.env.zsh`

**Script not found**
- Verify `~/.dotfiles/bin` is in your PATH (check ~/.zshrc line 158)
- Run `chmod +x ~/.dotfiles/bin/inworld-tts ~/.dotfiles/bin/hume-tts`

**API errors**
- **Inworld**: Check your API key at https://studio.inworld.ai
- **Hume**: Check your API key at https://platform.hume.ai
- Verify you have API credits remaining

**Hume: No audio generated**
- Check the response error message for details
- Ensure utterances array is properly formatted
- Try using `--instant` flag for faster processing

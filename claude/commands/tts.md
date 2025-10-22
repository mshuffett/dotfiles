---
description: Text-to-speech generation using Inworld TTS (ranked #1 on TTS Arena). Provides high-quality voice synthesis with 20+ voices and multiple quality models. Use when user asks to generate speech, create audio from text, or work with TTS/voice generation. Includes command reference, voice options, and workflow examples.
---

# Text-to-Speech (TTS) Command

Generate high-quality speech audio using Inworld TTS API (ranked #1 on TTS Arena).

## Quick Start

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

## Command Reference

### Syntax
```bash
inworld-tts <text> [options]
```

### Options
- `--voice, -v <name>` - Voice ID (default: Eve)
- `--model, -m <id>` - Model ID (default: inworld-tts-1)
- `--output, -o <file>` - Output filename (default: output.mp3)
- `--help, -h` - Show help message

### Models

**inworld-tts-1** (default)
- Ranked #1 on TTS Arena (ELO: 1679)
- 60% win rate
- Fast, high quality

**inworld-tts-max**
- Ranked #3 on TTS Arena (ELO: 1668)
- 65% win rate
- Higher quality, slightly slower

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
```

### Batch Generation
```bash
inworld-tts "First message" -o message1.mp3
inworld-tts "Second message" -o message2.mp3
inworld-tts "Third message" -o message3.mp3
```

### Different Voices for Dialogue
```bash
inworld-tts "Hello, how are you?" -v Emma -o speaker1.mp3
inworld-tts "I'm doing great, thanks!" -v Noah -o speaker2.mp3
```

### Test Multiple Voices
```bash
# Compare voices quickly
for voice in Eve Noah Emma Liam; do
  inworld-tts "Testing $voice voice" -v "$voice" -o "test-$voice.mp3"
done
```

## Environment

The `inworld-tts` command uses the `INWORLD_API_KEY` environment variable, which is set in `~/.env.zsh`.

## Script Location

The script is located at `~/.dotfiles/bin/inworld-tts` and is version controlled in your dotfiles repository.

## TTS Arena Rankings (Reference)

Top performing TTS models as of 2025:
1. **Inworld TTS** - ELO 1679 (60% win rate) ← You have this
2. Hume Octave - ELO 1669 (66% win rate)
3. **Inworld TTS MAX** - ELO 1668 (65% win rate) ← You have this
4. Eleven Turbo v2.5 - ELO 1647
5. Papla P1 - ELO 1599

Top open-source:
- Kokoro v1.0 - ELO 1467 (#13 overall)
- CosyVoice 2.0 - ELO 1439 (#14 overall)

## Tips

- **Voice selection**: Test a few voices to find what works best for your content
- **Model choice**: Use `inworld-tts-1` for speed, `inworld-tts-max` for quality
- **File organization**: Use descriptive output filenames to stay organized
- **Playback**: MP3 files default to VLC on your system

## Troubleshooting

**Error: INWORLD_API_KEY not set**
- Run `source ~/.env.zsh` in current session
- Or start a new terminal session (auto-loaded)

**Script not found**
- Verify `~/.dotfiles/bin` is in your PATH (check ~/.zshrc line 158)
- Run `chmod +x ~/.dotfiles/bin/inworld-tts`

**API errors**
- Check your API key is valid at https://studio.inworld.ai
- Verify you have API credits remaining

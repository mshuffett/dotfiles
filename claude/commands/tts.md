---
description: Text-to-speech generation using Inworld TTS (#1 on TTS Arena), Hume Octave (#2 on TTS Arena), and Google Gemini 2.5. Provides high-quality voice synthesis with 30+ voices, dynamic voice generation, multiple quality models, and native multi-speaker podcast generation. Use when user asks to generate speech, create audio from text, work with TTS/voice generation, or create podcast-style conversations. Includes command reference for all services, voice options, and workflow examples.
---

# Text-to-Speech (TTS) Command

Generate high-quality speech audio using three top-tier TTS services.

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
`"slight vocal fry, breathy, airy, light feminine resonance, intimate, engaging, emphasis on important words, subtle British pronunciation"`

**Research-backed attractive voice traits** (use in descriptions):
- **Breathiness** - Most impactful; "monotonically increases attractiveness"
- **Airy/light feminine resonance** - Wide formant dispersion (spacing between resonant frequencies); sounds more feminine
- **Slight vocal fry** - Adds intimacy/seduction when subtle
- **Emphasis on important words** - Dynamic delivery, not monotone
- **Subtle British pronunciation** - Adds sophistication
- **Lower pitch** - People naturally lower pitch when being seductive
- **Smooth delivery** - Low jitter perceived as healthier/more attractive

**Dynamic description fallback**: `"smooth, captivating, slightly breathy female"`

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

### Gemini TTS

**Syntax:**
```bash
gemini-tts <text> [options]
```

**Options:**
- `--voice, -v <name>` - Voice name (default: Zephyr)
- `--voice2 <name>` - Second voice for multi-speaker (default: Puck)
- `--multi-speaker` - Enable 2-person mode (text must include "Speaker 1:" and "Speaker 2:" labels)
- `--output, -o <file>` - Output filename (default: output.wav)
- `--model, -m <type>` - Model: flash, pro, or native-audio (default: flash)
- `--help, -h` - Show help message

**Models:**
- `flash` - gemini-2.5-flash-preview-tts (faster, default)
- `pro` - gemini-2.5-pro-preview-tts (higher quality)
- `native-audio` - gemini-2.5-flash-native-audio-preview-09-2025 (specialized native audio model)

**Multi-Speaker Mode:**
When `--multi-speaker` is enabled:
- Your text must include "Speaker 1:" and "Speaker 2:" labels for each line of dialogue
- Speaker 1 uses the voice specified by `--voice` (default: Zephyr)
- Speaker 2 uses the voice specified by `--voice2` (default: Puck)
- Output is a WAV file with distinct voices for each speaker

**Available Voices (30 total):**
- Zephyr (Bright), Sulafat (Warm), Charon (Engaging), Kore (Soothing)
- Aoede (Groundbreaking), Puck (Expressive), Fenrir (Clear), Oberon (Deep)
- Enceladus (Breathy), Algieba (Smooth), Achird (Friendly)
- ... and 19 more voices with distinct characteristics

**Note:** Outputs WAV format (not MP3). Requires `google-genai` Python package (`pip install google-genai`).

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
inworld-tts "Your text here" && afplay output.mp3
hume-tts "Your text here" && afplay output.mp3
gemini-tts "Your text here" && afplay output.wav
```

Note: `afplay` is macOS's built-in CLI audio player. Use `&` to play in background: `afplay output.mp3 &`

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
gemini-tts "$TEXT" -o gemini-comparison.mp3
```

### Multi-Speaker Podcast Generation
```bash
# Gemini's native multi-speaker mode (requires speaker labels)
gemini-tts "Speaker 1: Welcome to our show about AI in healthcare! Speaker 2: Thanks for having me! Speaker 1: Let's discuss how AI is transforming diagnosis. Speaker 2: It's fascinating - AI can now detect patterns humans miss." --multi-speaker -o podcast.wav

# Hume with explicit dialogue (single voice with acting)
hume-tts "Speaker1: Welcome to our show!
Speaker2: Thanks for having me!
Speaker1: Today we're discussing AI in healthcare.
Speaker2: It's fascinating how AI is transforming diagnosis..." -d "conversational, engaging" -o hume-podcast.mp3
```

### Dynamic Voice with Description
```bash
# Let Hume generate voices based on style descriptions
hume-tts "Welcome to our podcast" -d "professional news anchor" -o intro.mp3
hume-tts "Thanks for listening!" -d "warm and enthusiastic" -o outro.mp3
```

## Controlling Emotion and Expression

Both services offer advanced emotional control, but through different mechanisms.

### Hume: Acting Instructions (via `--description`)

Hume's `--description` parameter provides natural language control over:
- **Emotional tone**: happy, sad, excited, nervous, melancholic, frustrated
- **Delivery style**: whispering, shouting, rushed, measured pace
- **Context**: speaking to a crowd, intimate conversation, pedagogical

**Best Practices:**
- Keep instructions concise (≤100 characters)
- Use specific emotions instead of broad terms
  - ✅ "melancholic, hesitant"
  - ❌ "sad"
- Combine emotion with delivery style
  - ✅ "excited but whispering"
  - ✅ "calm, pedagogical"
  - ✅ "frightened, rushed"

**Examples:**
```bash
# Emotional variations
hume-tts "I can't believe this happened" -d "shocked, dismayed" -o shocked.mp3
hume-tts "I can't believe this happened" -d "excited, delighted" -o excited.mp3

# Delivery style control
hume-tts "Listen carefully to this" -d "whispering, secretive" -o whisper.mp3
hume-tts "Listen carefully to this" -d "shouting, urgent" -o shout.mp3

# Combined emotional context
hume-tts "Let us begin by taking a deep breath in" -d "calm, pedagogical" --speed 0.65 -o meditation.mp3
```

### Inworld: Audio Markups (Text Inline)

Inworld uses inline audio markups in your text for emotion and expression control.

**NOTE:** Current CLI script doesn't support audio markups yet. Text must include markups directly.

**Emotion Markups:**
- `[happy]` - Happy emotion
- `[sad]` - Sad emotion
- `[angry]` - Angry emotion
- `[excited]` - Excited emotion

**Delivery Style:**
- `[whispering]` - Whispered speech
- `[shouting]` - Loud speech

**Non-verbal Vocalizations:**
- `[laughing]` - Laughter
- `[sigh]` - Sighing sound
- `[cough]` - Coughing sound
- `[clear_throat]` - Throat clearing
- `[yawn]` - Yawning sound

**Text Emphasis:**
- Use asterisks: `*really*` for emphasis

**Examples:**
```bash
# Emotion control
inworld-tts "[happy] I can't believe this is happening!" -o happy.mp3
inworld-tts "[angry] I can't believe you did that." -o angry.mp3

# Mixed emotions
inworld-tts "[angry] I can't believe you didn't save the last bite of cake for me. [laughing] Got you! I was just kidding." -o prank.mp3

# Non-verbal vocalizations
inworld-tts "[clear_throat] Did you hear what I said? [sigh] You never listen to me!" -o frustrated.mp3

# Emphasis
inworld-tts "I *really* need you to understand this." -o emphasis.mp3
```

### Comparison: Hume vs Inworld Emotion Control

**Hume (Acting Instructions):**
- ✅ Natural language descriptions
- ✅ Holistic understanding of context
- ✅ Affects entire utterance
- ✅ Easier to use (no markup syntax)
- ❌ Less granular control within sentences

**Inworld (Audio Markups):**
- ✅ Precise control at word/phrase level
- ✅ Mix multiple emotions in one utterance
- ✅ Non-verbal vocalizations
- ✅ Fine-grained emphasis markers
- ❌ Requires markup syntax in text

### Additional Prosody Parameters

**Hume:**
- `--speed <0.5-2.0>` - Speaking rate (non-linear scale)
- `--description` - Emotional/delivery instructions
- Trailing silence (API parameter, not in CLI yet)

**Inworld (API only, not in CLI):**
- Temperature (0.6-1.0) - Controls randomness/expressiveness
- Pitch adjustment - Negative for deeper, positive for higher
- Talking speed - 0.5 (half speed) to 1.5 (1.5x faster)

## Environment

Environment variables are set in `~/.env.zsh`:

**Inworld:**
- `INWORLD_API_KEY` - Inworld API key (base64 encoded)

**Hume:**
- `HUME_API_KEY` - Hume API key
- `HUME_SECRET_KEY` - Hume secret key (optional)

**Gemini:**
- `GEMINI_API_KEY` - Google Gemini API key

## Script Locations

All scripts are located in `~/.dotfiles/bin/` and version controlled:
- `~/.dotfiles/bin/inworld-tts` (Node.js)
- `~/.dotfiles/bin/hume-tts` (Node.js)
- `~/.dotfiles/bin/gemini-tts` (Python 3)

**Note:** Gemini TTS script requires the `google-genai` Python package. Install with: `pip install google-genai`

## TTS Arena V2 Rankings (December 2025)

Top performing TTS models on [TTS Arena V2](https://tts-agi-tts-arena-v2.hf.space/leaderboard):
1. **Hume Octave** - ELO 1632 (66% win rate) ← **You have this**
2. **Inworld TTS MAX** - ELO 1629 (67% win rate) ← **You have this**
3. **Inworld TTS** - ELO 1609 (61% win rate) ← **You have this**
4. Papla P1 - ELO 1586 (57% win rate)
5. CastleFlow v1.0 - ELO 1585 (60% win rate)
6. Eleven Multilingual v2 - ELO 1561 (59% win rate)
7. Eleven Flash v2.5 - ELO 1556 (56% win rate)
8. MiniMax Speech-02-HD - ELO 1553 (58% win rate)

**You have access to the top 3 models on TTS Arena!**

Note: TTS Arena V2 is a fresh leaderboard - votes from V1 don't carry over. ELO scores are lower than V1 because it's a new rating pool.

## Tips

### Choosing a Service
- **Inworld**: Best for consistent voices, faster generation, specific voice requirements
- **Hume**: Best for dynamic/unique voices, emotional intelligence, voice style descriptions
- **Gemini**: Best for multi-speaker podcast generation, natural conversations, automatic script creation

### Voice Selection
- **Inworld**: Test a few pre-defined voices to find what works best
- **Hume**: Use voice descriptions for natural variation, or built-in voices for consistency
- **Gemini**: 30 distinct voices with clear characteristics (Bright, Warm, Engaging, etc.)

### Model/Quality
- Use `inworld-tts-1` for speed, `inworld-tts-max` for highest quality
- Use `--instant` flag with Hume for real-time applications

### File Organization
- Use descriptive output filenames to stay organized
- Consider prefixing with service name for comparisons (e.g., `inworld-intro.mp3`, `hume-intro.mp3`)

### Playback
- Use `afplay` for CLI playback (macOS built-in): `afplay output.mp3`
- Add `&` to play in background: `afplay output.mp3 &`

## Troubleshooting

**Error: API key not set**
- Run `source ~/.env.zsh` in current session
- Or start a new terminal session (auto-loaded)
- Verify keys exist in `~/.env.zsh`

**Script not found**
- Verify `~/.dotfiles/bin` is in your PATH (check ~/.zshrc line 158)
- Run `chmod +x ~/.dotfiles/bin/inworld-tts ~/.dotfiles/bin/hume-tts ~/.dotfiles/bin/gemini-tts`
- For gemini-tts: Ensure Python 3 is installed and in PATH

**API errors**
- **Inworld**: Check your API key at https://studio.inworld.ai
- **Hume**: Check your API key at https://platform.hume.ai
- **Gemini**: Check your API key at https://aistudio.google.com/apikey
- Verify you have API credits remaining

**Hume: No audio generated**
- Check the response error message for details
- Ensure utterances array is properly formatted
- Try using `--instant` flag for faster processing

**Gemini: Multi-speaker not working**
- Ensure you're using the `--multi-speaker` flag
- Text must include "Speaker 1:" and "Speaker 2:" labels for dialogue
- Check that GEMINI_API_KEY is set in ~/.env.zsh

**Gemini: google-genai package not found**
- Install the Python package: `pip install google-genai`
- Or use pip3: `pip3 install google-genai`
- Verify installation: `python3 -c "from google import genai"`

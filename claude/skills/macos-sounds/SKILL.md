---
description: Use when playing sounds in hooks, notifications, or alerts. Reference for macOS/iOS system sounds with file paths and Michael's favorites by use case.
---

# System Sounds Reference

## Locations

| Collection | Path | Format |
|------------|------|--------|
| Classic macOS | `/System/Library/Sounds/` | `.aiff` |
| iOS Modern | `.../ToneLibrary.framework/.../AlertTones/Modern/` | `.m4r` |
| iOS Classic | `.../ToneLibrary.framework/.../AlertTones/Classic/` | `.m4r` |
| iOS EncoreInfinitum | `.../ToneLibrary.framework/.../AlertTones/EncoreInfinitum/` | `.caf` |
| Custom | `~/.dotfiles/sounds/` | various |

Full ToneLibrary path: `/System/Library/PrivateFrameworks/ToneLibrary.framework/Versions/A/Resources/AlertTones/`

## Michael's Favorites

| Sound | Use Case | Path |
|-------|----------|------|
| elevenlabs-notification-7.mp3 | Stop hook (current) | `~/.dotfiles/sounds/` |
| Portal-EncoreInfinitum.caf | Notification hook | EncoreInfinitum |
| Welcome-EncoreInfinitum.caf | SessionStart hook | EncoreInfinitum |
| Rebound-EncoreInfinitum.caf | Alternative Stop | EncoreInfinitum |
| Glass.aiff | Subtle alerts | Classic macOS |
| Blow.aiff | Unique wind tone | Classic macOS |
| Tri-Tone.m4r | Famous iOS sound | iOS Classic |

## Classic macOS Sounds

Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink

## iOS Modern

Aurora, Bamboo, Chord, Circles, Complete, Hello, Input, Keys, Note, Popcorn, Pulse, Synth

## iOS Classic

Alert, Anticipate, Bell, Bloom, Calypso, Chime, Choo Choo, Descent, Ding, Electronic, Fanfare, Glass, Horn, Ladder, Minuet, News Flash, Noir, Sherwood Forest, Spell, Suspense, Swish, Swoosh, Telegraph, Tiptoes, Tri-Tone, Tweet, Typewriters, Update

## iOS EncoreInfinitum

Antic, Cheers, Droplet, Handoff, Milestone, Passage, Portal, Rattle, Rebound, Slide, Welcome

## Usage

```bash
# Play classic macOS sound
afplay /System/Library/Sounds/Glass.aiff

# Play EncoreInfinitum sound
afplay "/System/Library/PrivateFrameworks/ToneLibrary.framework/Versions/A/Resources/AlertTones/EncoreInfinitum/Rebound-EncoreInfinitum.caf"

# Play custom sound
afplay ~/.dotfiles/sounds/elevenlabs-notification-7.mp3
```

### Hook Configuration

```json
{
  "hooks": {
    "Stop": [{
      "type": "command",
      "command": "afplay ~/.dotfiles/sounds/elevenlabs-notification-7.mp3"
    }]
  }
}
```

## Notes

- All formats (`.aiff`, `.m4r`, `.caf`) work with `afplay`
- EncoreInfinitum sounds have modern echo quality
- For notifications, prefer sounds under 2 seconds (avoid Welcome)

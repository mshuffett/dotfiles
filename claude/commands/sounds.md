---
description: macOS and iOS system sounds reference - includes all built-in alert tones, notification sounds, and chimes. Documents sound file locations and Michael's favorites for different use cases. Use when working with sound notifications, hooks, or alerts.
---

# System Sounds Reference

Complete reference of macOS and iOS system sounds available on the system.

## Classic macOS System Sounds

**Location:** `/System/Library/Sounds/`

Available sounds (all `.aiff` format):
- Basso.aiff - Deep bass tone
- Blow.aiff - Wind/blow sound ⭐ (Michael likes)
- Bottle.aiff - Bottle pop sound
- Frog.aiff - Frog croak
- Funk.aiff - Funky sound effect
- Glass.aiff - Gentle glass chime ⭐ (Michael likes)
- Hero.aiff - Triumphant fanfare
- Morse.aiff - Morse code beep
- Ping.aiff - Simple ping sound
- Pop.aiff - Pop sound
- Purr.aiff - Soft purring sound
- Sosumi.aiff - Classic Mac "So sue me" sound
- Submarine.aiff - Submarine sonar ping
- Tink.aiff - Light metallic tink

## iOS Alert Tones

**Base Location:** `/System/Library/PrivateFrameworks/ToneLibrary.framework/Versions/A/Resources/AlertTones/`

### Modern (iOS Modern Collection)

**Location:** `AlertTones/Modern/` (all `.m4r` format)

- Aurora.m4r
- Bamboo.m4r
- Chord.m4r
- Circles.m4r
- Complete.m4r
- Hello.m4r
- Input.m4r
- Keys.m4r
- Note.m4r
- Popcorn.m4r
- Pulse.m4r
- Synth.m4r

### Classic (Traditional iOS Sounds)

**Location:** `AlertTones/Classic/` (all `.m4r` format)

- Alert.m4r
- Anticipate.m4r
- Bell.m4r
- Bloom.m4r
- Calypso.m4r
- Chime.m4r
- Choo Choo.m4r
- Descent.m4r
- Ding.m4r
- Electronic.m4r
- Fanfare.m4r
- Glass.m4r
- Horn.m4r
- Ladder.m4r
- Minuet.m4r
- News Flash.m4r
- Noir.m4r
- Sherwood Forest.m4r
- Spell.m4r
- Suspense.m4r
- Swish.m4r
- Swoosh.m4r
- Telegraph.m4r
- Tiptoes.m4r
- Tri-Tone.m4r (famous iOS notification sound)
- Tweet.m4r
- Typewriters.m4r
- Update.m4r

### EncoreInfinitum (Newest iOS Sounds)

**Location:** `AlertTones/EncoreInfinitum/` (all `.caf` format)

- Antic-EncoreInfinitum.caf
- Cheers-EncoreInfinitum.caf
- Droplet-EncoreInfinitum.caf
- Handoff-EncoreInfinitum.caf
- Milestone-EncoreInfinitum.caf
- Passage-EncoreInfinitum.caf
- Portal-EncoreInfinitum.caf ⭐ (Michael's favorite)
- Rattle-EncoreInfinitum.caf ⭐ (Michael's favorite)
- Rebound-EncoreInfinitum.caf ⭐⭐ (Michael's top choice - used for Stop hook)
- Slide-EncoreInfinitum.caf
- Welcome-EncoreInfinitum.caf ⭐ (Michael likes but too long for notifications)

## Michael's Favorites

**From Classic macOS:**
- Glass.aiff - Gentle, subtle
- Blow.aiff - Unique wind sound

**From EncoreInfinitum (newest iOS sounds):**
- **Rebound** ⭐⭐ - Top choice, has nice echo quality (currently used for Stop hook)
- Portal - Great sound
- Rattle - Nice percussive
- Welcome - Beautiful but too long for quick notifications

**Notable mention:**
- Tri-Tone (Classic iOS) - The famous iOS notification sound

## Usage Examples

### Playing sounds with afplay

```bash
# Classic macOS sound
afplay /System/Library/Sounds/Glass.aiff

# Modern iOS sound
afplay "/System/Library/PrivateFrameworks/ToneLibrary.framework/Versions/A/Resources/AlertTones/Modern/Chord.m4r"

# EncoreInfinitum sound (Michael's favorite)
afplay "/System/Library/PrivateFrameworks/ToneLibrary.framework/Versions/A/Resources/AlertTones/EncoreInfinitum/Rebound-EncoreInfinitum.caf"
```

### In Claude Code hooks (settings.json)

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/PrivateFrameworks/ToneLibrary.framework/Versions/A/Resources/AlertTones/EncoreInfinitum/Rebound-EncoreInfinitum.caf"
          }
        ]
      }
    ]
  }
}
```

## Notes

- `.aiff` files are classic macOS audio format
- `.m4r` files are iOS ringtone format (still playable with afplay)
- `.caf` files are Core Audio Format (Apple's native format)
- All formats work with `afplay` command
- EncoreInfinitum sounds are the newest and have the most modern, echo-y quality
- For quick notifications, avoid sounds longer than 2 seconds (like Welcome)

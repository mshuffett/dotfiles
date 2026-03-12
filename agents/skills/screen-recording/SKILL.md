---
name: screen-recording
description: >
  Use when recording the screen on macOS via CLI, creating screen recordings,
  or capturing video of a browser/app. Covers ffmpeg AVFoundation setup,
  recommended settings for web demos, and file size estimates.
  Use this skill whenever the user mentions screen recording, video capture,
  recording a demo, or capturing their screen — even if they don't mention ffmpeg.
---

# Screen Recording (macOS CLI via ffmpeg)

> **Status: Settings are still being refined.** The presets below are a working
> baseline from initial testing. Update this file as better defaults emerge.

## Prerequisites

- ffmpeg installed via Homebrew (`brew install ffmpeg`)
- Screen Recording permission granted in System Settings > Privacy & Security

## Device Discovery

List available capture devices:

```bash
ffmpeg -f avfoundation -list_devices true -i "" 2>&1
```

Typical device map (varies per machine):

| Index | Device |
|-------|--------|
| Video 3 | Capture screen 0 |
| Audio 0 | BlackHole 2ch (system audio) |
| Audio 1 | MacBook Pro Microphone |

The `-i` flag format is `"<video>:<audio>"` — use `"3:none"` for no audio.

## Recommended Presets

### Web Screen Recording (1080p30) — default choice

Optimized for browser demos with crisp text and smooth scrolling.

```bash
ffmpeg -f avfoundation -framerate 30 -capture_cursor 1 -capture_mouse_clicks 1 \
  -i "3:none" \
  -c:v h264_videotoolbox \
  -b:v 8M \
  -pix_fmt yuv420p \
  -vf "scale=1920:1080:flags=lanczos" \
  output.mp4
```

### With Microphone

```bash
ffmpeg -f avfoundation -framerate 30 -capture_cursor 1 -capture_mouse_clicks 1 \
  -i "3:1" \
  -c:v h264_videotoolbox -b:v 8M -pix_fmt yuv420p \
  -vf "scale=1920:1080:flags=lanczos" \
  -c:a aac \
  output.mp4
```

### With System Audio (via BlackHole)

```bash
ffmpeg -f avfoundation -framerate 30 -capture_cursor 1 -capture_mouse_clicks 1 \
  -i "3:0" \
  -c:v h264_videotoolbox -b:v 8M -pix_fmt yuv420p \
  -vf "scale=1920:1080:flags=lanczos" \
  -c:a aac \
  output.mp4
```

### Full Retina (archival / editing source)

Skip the downscale for maximum fidelity:

```bash
ffmpeg -f avfoundation -framerate 30 -capture_cursor 1 -i "3:none" \
  -c:v h264_videotoolbox -b:v 15M -pix_fmt yuv420p \
  output.mp4
```

## Key Settings Explained

| Setting | Value | Why |
|---------|-------|-----|
| `-c:v h264_videotoolbox` | H.264 hardware encoder | Uses Apple silicon GPU — fast, low CPU |
| `-b:v 8M` | 8 Mbps | Sharp text at 1080p; drop to 5M if size matters more |
| `-framerate 30` | 30fps | Smooth enough for scrolling; 60fps doubles file size for little benefit |
| `-capture_cursor 1` | Show cursor | Essential for demos |
| `-capture_mouse_clicks 1` | Show click feedback | Visual cue for interactions |
| `-pix_fmt yuv420p` | Pixel format | Maximum compatibility (browsers, editors, social media) |
| `scale=...:flags=lanczos` | Lanczos downscale | Keeps text sharp when scaling to 1080p (default scaler blurs text) |

## File Size Estimates

| Preset | Bitrate | Per Minute | Per 10 Min | Per Hour |
|--------|---------|------------|------------|----------|
| 1080p30 @ 8M | 8 Mbps | ~60 MB | ~600 MB | ~3.5 GB |
| 1080p30 @ 5M | 5 Mbps | ~37 MB | ~375 MB | ~2.2 GB |
| 1080p60 @ 12M | 12 Mbps | ~90 MB | ~900 MB | ~5.3 GB |
| Full Retina @ 15M | 15 Mbps | ~113 MB | ~1.1 GB | ~6.6 GB |

Screen recordings typically compress 10-30% smaller than these theoretical numbers
because of large static areas and repeated frames.

## Stopping a Recording

Press `q` in the terminal where ffmpeg is running.

## Troubleshooting

- **"Permission denied" or black frames**: Grant Screen Recording permission in
  System Settings > Privacy & Security > Screen Recording, then restart the terminal.
- **Device index wrong**: Rerun the device discovery command — indices can shift
  when external displays or audio devices are connected/disconnected.
- **Audio out of sync**: Add `-async 1` or try `-vsync cfr` to force constant frame rate.

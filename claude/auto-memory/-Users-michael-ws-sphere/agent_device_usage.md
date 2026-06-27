---
name: agent-device iOS simulator & device control
description: How to use agent-device CLI for iOS simulator and physical device automation — session lifecycle, ref syntax, device targeting, and common gotchas
type: reference
---

## agent-device CLI reference

Installed globally via `npm install -g agent-device`. Official skill installed in `.agents/skills/agent-device/`.

### Session lifecycle
1. `agent-device open <bundleId>` — opens session (required before any interaction)
2. Interact (snapshot, click, screenshot, etc.)
3. `agent-device close` — end session

### Key commands
- **Screenshot**: `agent-device screenshot /tmp/screen.png --json`
- **Accessibility tree**: `agent-device snapshot --json` (read-only) or `snapshot -i` (interactive refs)
- **Tap by ref**: `agent-device click @e15` (note the `@` prefix — bare `e15` fails with INVALID_ARGS)
- **Tap by coords**: `agent-device click 200 400`
- **Type text**: `agent-device type "hello"`
- **Tap + type**: `agent-device fill @e5 "text"`
- **Scroll**: `agent-device scroll down`

### Device targeting
- **Simulator (default)**: `agent-device open <app>` picks first booted simulator
- **Physical device**: `agent-device open <app> --platform ios --device <deviceName>`
- Device name comes from `agent-device devices --json` (e.g., "Shadow")
- Phone must be **unlocked** and **trusted** in Xcode for developer disk image mount
- App must be **installed** on the device first — `open` doesn't install, just launches
- Use `--relaunch` to kill and restart the app

### Common gotchas
- `SESSION_NOT_FOUND` — forgot to `agent-device open` first
- Refs are ephemeral — re-snapshot after UI changes
- `click e15` fails — must use `click @e15` (@ prefix required)
- Keyboard dismiss not supported on iOS — tap elsewhere or use `back`
- Physical device errors: "DeviceLocked" = phone screen locked; "not installed" = need to build first
- Expo dev client: after relaunch, app shows Expo launcher, need to tap the Metro server entry to load JS bundle

### Installed tools for device automation
- `agent-device` (npm global) — primary tool, AI-optimized
- `idb-companion` (brew, facebook/fb tap) — backup, element trees + screenshots
- `pymobiledevice3` (pipx) — physical device screenshots (needs `sudo tunneld`)
- `xcrun simctl` — built-in, device management only (no UI automation)
- `libimobiledevice` / `idevicescreenshot` — needs developer disk image mounted

### Sphere app details
- Bundle ID: `com.waycraft.sphere`
- Simulator: iPhone 16e (DF66299E-E572-4AB3-966C-9818A871C6E9)
- Physical device: "Shadow" / iPhone Air (00008150-000225313C47801C) — Michael's personal iPhone
- Build to device: pass UDID directly to skip interactive picker: `npx expo run:ios --device 00008150-000225313C47801C`
- Build to device: `pnpm --filter mobile ios --device`

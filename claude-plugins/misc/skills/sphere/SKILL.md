---
description: Sphere mobile app - Local streaming AI chat application using Vercel AI Gateway with Claude Opus. React Native (0.79.5) + Expo (53.0.22) + React 19. Multi-provider AI support (Claude, Gemini, OpenAI), server-side streaming via SSE, NativeWind/Tailwind styling, Zustand state management, Supabase backend. Use this command when user asks about "the mobile app", "sphere", or mobile development work.
---

# Sphere Mobile App

## Project Overview

**Location:** `/Users/michael/ws/sphere`

**Purpose:** Local streaming AI chat application for mobile (iOS/Android) with multi-provider support

**Tech Stack:**
- **React Native:** 0.79.5
- **Expo:** 53.0.22
- **React:** 19.0.0
- **Routing:** Expo Router (file-based)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State Management:** Zustand
- **Backend:** Supabase
- **AI Providers:**
  - Claude Opus (via Anthropic API)
  - Google Gemini
  - OpenAI
  - Vercel AI Gateway

**Key Features:**
- Server-side streaming via SSE (Server-Sent Events)
- Multi-provider AI model switching
- Native mobile UI with drawer navigation
- AsyncStorage for local persistence
- Bottom sheet components (Gorhom)
- Optimized lists (Shopify Flash List)

## Starting the Development Server

### Standard Start (Current Session Only)
```bash
cd /Users/michael/ws/sphere
pnpm run start
```

### Persistent Start with nohup (Survives Session Close)
```bash
cd /Users/michael/ws/sphere
nohup pnpm run start > sphere.log 2>&1 &

# View the process
ps aux | grep "expo start" | grep sphere

# View logs
tail -f sphere.log

# Stop the server
pkill -f "expo start.*sphere"
```

**Server URLs:**
- Metro Bundler: `http://localhost:8081`
- Expo Dev Server: `exp://192.168.86.192:8081` (update IP as needed)
- Web (optional): Check terminal for URL

### Get Current Network URL
```bash
# Get your current local IP
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1

# Expo URL format: exp://[YOUR_IP]:8081
```

## Viewing on Phone

### Option 1: Expo Go (Quick Test)
1. Install Expo Go on your phone
2. Ensure phone and computer are on same WiFi
3. Scan QR code in terminal, OR
4. Manually enter URL: `exp://[YOUR_IP]:8081`

**Note:** React Native 0.79.5 may require development build instead of Expo Go

### Option 2: Development Build (Recommended)
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Option 3: Tunnel (Different Networks)
```bash
cd /Users/michael/ws/sphere
pnpm run start -- --tunnel
```

## Resource Usage

**Typical Memory Usage:** ~95.6 MB total
- Main Expo process: ~15 MB
- Metro worker processes: 6 × ~11 MB
- TailwindCSS worker: ~11 MB

**CPU Usage:** 0.1% (idle), spikes during bundling

**Monitoring Resources:**
```bash
# Check all Sphere processes
ps aux | grep -E "sphere|expo" | grep -v grep

# Detailed resource view
ps aux | grep sphere | awk '{printf "PID: %s  CPU: %s%%  MEM: %s%%  RSS: %.1f MB\n", $2, $3, $4, $6/1024}'

# Kill all Sphere processes if needed
pkill -f sphere
```

## Environment Variables

Environment variables are loaded from:
- `.env.local` (project-specific, gitignored)
- `~/.env.zsh` (global secrets)

**Required Variables:**
```bash
ANTHROPIC_API_KEY
EXPO_PUBLIC_ANTHROPIC_API_KEY
EXPO_PUBLIC_GEMINI_API_KEY
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_OPENAI_API_KEY
EXPO_PUBLIC_DEFAULT_AI_MODEL
VERCEL_AI_GATEWAY_KEY
```

## Project Structure

```
sphere/
├── app/                    # Expo Router pages
├── components/             # React components
├── lib/                    # Utilities, hooks, stores
├── assets/                 # Images, fonts
├── app.json               # Expo configuration
├── package.json
├── tailwind.config.js
└── metro.config.js
```

## Common Commands

```bash
# Start development server
pnpm run start

# Start with clear cache
pnpm run start -- --clear

# Run on iOS simulator
pnpm run ios

# Run on Android emulator
pnpm run android

# Run web version
pnpm run web

# Type checking
pnpm run typecheck

# Linting (Biome)
pnpm run lint

# Run tests
pnpm test
```

## Development Workflow

### Making Changes
1. Edit files in `app/` or `components/`
2. Fast Refresh automatically updates
3. Check terminal for bundler output
4. Check phone/simulator for UI changes

### Testing AI Providers
- Use in-app settings to switch providers
- Test streaming responses
- Verify SSE connection in network tab

### Debugging
- Use React DevTools
- Check Metro bundler logs
- Use Flipper for advanced debugging
- Console logs appear in terminal

## Known Issues & Warnings

**Deprecation Warnings (Non-Breaking):**
- `shadow*` style props → Use `boxShadow`
- `props.pointerEvents` → Use `style.pointerEvents`

These are just warnings and don't affect functionality.

## When to Use This Command

**Invoke `/sphere` when user asks about:**
- "The mobile app" (if context suggests Sphere)
- "Sphere app"
- React Native development
- Mobile AI chat app
- Expo development
- "How do I start the mobile app?"
- "Is the mobile app running?"
- "View on my phone"

## Related Projects

Other React Native apps in workspace (for comparison):
- Pipecat examples (voice chat with Daily.co WebRTC)
- Gemini Pipecat workshop (educational voice examples)

## Useful Links

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [NativeWind Documentation](https://www.nativewind.dev)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)

## Quick Reference Card

```bash
# Start server (persistent)
cd ~/ws/sphere && nohup pnpm start > sphere.log 2>&1 &

# Check if running
ps aux | grep "expo start" | grep sphere

# Get URL for phone
echo "exp://$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1):8081"

# View logs
tail -f ~/ws/sphere/sphere.log

# Stop server
pkill -f "expo start.*sphere"

# Check resources
ps aux | grep sphere | awk '{sum+=$6} END {printf "Total: %.1f MB\n", sum/1024}'
```

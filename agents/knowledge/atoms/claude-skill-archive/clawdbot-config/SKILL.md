---
name: clawdbot-config
description: Use when working with clawdbot, configuring messaging bindings, WhatsApp/iMessage/Telegram channels, or managing agent identities and routing.
---

# Clawdbot Configuration Guide

Clawdbot is Michael's personal AI messaging bot that bridges multiple chat platforms to AI agents.

## Configuration Location

**Primary config**: `~/.dotfiles/clawdbot/clawdbot.json`

This file is version-controlled in dotfiles. After changes, commit to persist.

## Key Concepts

### Agents

Agents are AI personas with their own workspace and identity:

```json
{
  "id": "art",
  "workspace": "/Users/michael/clawd",
  "identity": {
    "name": "Art",
    "theme": "Owl — wise, cool, philosophical",
    "emoji": "🦉"
  }
}
```

### Bindings

Bindings route specific conversations to specific agents:

```json
{
  "agentId": "founders",
  "match": {
    "channel": "whatsapp",
    "peer": {
      "kind": "dm",
      "id": "+17035173349"
    }
  }
}
```

### Channels

Channel configs control which platforms are enabled and who can message:

```json
{
  "channel": "whatsapp",
  "config": {
    "dmPolicy": "allowlist",
    "allowFrom": ["+17035173349"],
    "groupPolicy": "allowlist"
  }
}
```

**Policies**:
- `allowlist` - Only numbers in `allowFrom` can message
- `open` - Anyone can message
- `disabled` - Channel is off

## Common Tasks

### Add a WhatsApp contact

1. Add number to `channels.whatsapp.allowFrom`
2. Add a binding to route to an agent

### Remove a WhatsApp contact

1. Remove from `channels.whatsapp.allowFrom`
2. Remove any bindings for that number

### Change agent for a contact

Update the `agentId` in the relevant binding.

## Related Locations

- **Agent workspaces**: `/Users/michael/clawd`, `/Users/michael/clawd-michael`, etc.
- **Clawdbot source**: `/Users/michael/ws/clawdbot`
- **Logs**: `~/.dotfiles/clawdbot/logs/`

## After Changes

Always validate JSON after editing:

```bash
cat ~/.dotfiles/clawdbot/clawdbot.json | jq . > /dev/null && echo "Valid"
```

**Restart required**: Config is loaded at startup. After editing, restart the gateway:

```bash
clawdbot daemon restart
```

Verify with `clawdbot health` to confirm channels are connected.

Then commit to dotfiles if the change should persist.

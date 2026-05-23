---
name: openclaw-message
description: Send a message to Michael's OpenClaw / "puffin" agent (the WhatsApp/Telegram bot running on EC2) and get its reply back. Use whenever Michael wants to talk to, ping, test, ask, or relay something to his openclaw/puffin/clawdbot agent, or check whether the agent is responding — e.g. "ask my openclaw bot to…", "ping puffin", "is the agent replying?", "have my bot draft…". Also use to message a specific persona agent (openclaw/michael, openclaw/art, etc.).
---

# Messaging the OpenClaw agent

This sends a chat message to Michael's OpenClaw agent on EC2 and prints the reply.

## How it works (and why it's indirect)

The bot's **public OpenAI-compatible endpoint is currently broken** — the puffin
wrapper (`apps/wrapper/src/server.js`, port 80 → `http://34.236.245.154/v1/...`)
hangs on every completion. The **gateway behind it is healthy**, but it only
listens on `127.0.0.1:18789` inside the container and its auth token is
regenerated on every restart. So the script reaches the gateway directly via AWS
SSM: it reads the current token from the gateway's startup log, then pipes the
request through `docker exec` to `127.0.0.1:18789`.

If the wrapper proxy ever gets fixed (or the image rebuilt), prefer the public
`/v1/chat/completions` endpoint instead — it's simpler. Until then, use this.

## Usage

```bash
python3 scripts/send.py "your message here"
python3 scripts/send.py "draft a reply declining politely" --agent openclaw/michael
python3 scripts/send.py "ping" --raw          # full JSON response
```

- Default agent/model is `openclaw/default`. Other personas: `openclaw/michael`,
  `openclaw/michael-bot`, `openclaw/art`, `openclaw/miranda`, `openclaw/founders`.
- The script handles the SSM round-trip and prints just the assistant's text
  (use `--raw` for the full response).
- Responses can take 20–90s (the agent runs a full turn), so be patient.

## Prerequisites / facts

- AWS account `636160605813`, region `us-east-1`, instance `i-02cef0acfa720d57b`
  (Name `puffin-openclaw`, container `puffin-openclaw-1`).
- Uses the custom SSM document **`PuffinRunShell`** (this account has AWS-managed
  SSM docs stripped, so a custom run-shell document was created). If SSM calls
  fail with `InvalidDocument`, recreate it:
  `aws ssm create-document --name PuffinRunShell --document-type Command --document-format JSON --content '{"schemaVersion":"2.2","description":"run shell","parameters":{"commands":{"type":"StringList"}},"mainSteps":[{"action":"aws:runShellScript","name":"run","inputs":{"runCommand":"{{ commands }}"}}]}'`
- The agent's default model is `openai-codex/gpt-5.4` (codex OAuth) with
  `amazon-bedrock/...opus...` as fallback.

## Troubleshooting

- **Empty reply / timeout**: the agent turn may be slow or wedged. Check the
  container: `aws ssm send-command --region us-east-1 --instance-ids i-02cef0acfa720d57b --document-name PuffinRunShell --parameters 'commands=["docker logs --tail 30 puffin-openclaw-1"]'`.
- **`401`**: the gateway token rotated mid-call; just retry (the script re-reads it each run).
- The WhatsApp channel is logged out (`openclaw channels login` needed) — unrelated to API messaging.

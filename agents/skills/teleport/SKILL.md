---
name: teleport
description: Teleport the current Claude Code session to the Everything Agent cloud for autonomous continuation. Use when a task will take a long time, the user wants to walk away, or they say "teleport this".
---

# Session Teleport

You are teleporting this Claude Code session to the cloud. The Everything Agent will continue your work autonomously. Follow these steps exactly.

## Step 1: Generate Briefing

Write a JSON file at `/tmp/teleport-briefing.json` with this structure:

```json
{
  "goal": "<one sentence: what are we building/doing>",
  "progress": "<summary of what's been accomplished so far>",
  "decisions": ["<key decision 1 with WHY>", "..."],
  "remaining": ["<specific remaining task 1>", "<specific remaining task 2>", "..."],
  "context": "<any important context the cloud agent needs — blockers, gotchas, user preferences>"
}
```

Be thorough in `remaining` — list every concrete step the cloud agent should take. Be specific in `decisions` — include WHY each decision was made so the cloud agent doesn't re-litigate them.

## Step 2: Handle Git State

1. Check `git status` for uncommitted changes
2. If there are uncommitted changes:
   - `git add -A`
   - `git commit -m "teleport: WIP state for cloud continuation"`
3. Record the current branch name (this is the `base-branch`)
4. Create and push a teleport branch:
   - Generate a short ID: first 8 chars of `$CLAUDE_SESSION_ID`
   - `git checkout -b teleport/<id>`
   - `git push origin teleport/<id>`
5. Return to the original branch:
   - `git checkout <original-branch>`

## Step 3: Invoke Teleport CLI

The session ID is available as `$CLAUDE_SESSION_ID`.

Run the teleport script:

```bash
npx tsx /Users/michael/ws/everything-monorepo/scripts/teleport.ts \
  --session-id "$CLAUDE_SESSION_ID" \
  --briefing /tmp/teleport-briefing.json \
  --branch "teleport/<id>" \
  --base-branch "<original-branch>" \
  --project-dir "$(pwd)"
```

Required environment variables (check they're set before running):
- `TELEPORT_API_KEY`
- `TELEPORT_ORG_ID`
- `TELEPORT_PROJECT_ID`
- `TELEPORT_CREATOR_ID`

If any are missing, tell the user which variables to set and stop.

## Step 4: Report

After the script succeeds, tell the user:
- The monitoring URL from the script output
- That the cloud agent will create a PR when done
- They can close their terminal safely now
- They can also interact with the agent live via the web app

If the script fails, show the error output and suggest fixes.

## Step 5: Clean Up

Remove the temporary briefing file:
```bash
rm -f /tmp/teleport-briefing.json
```

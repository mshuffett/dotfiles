# Claude Code Lane — Persistent Playwright via tmux REPL

Claude Code has no `js_repl`, but the same interactive workflow works with a
detached tmux session running a Node REPL. One REPL process owns the browser;
you send code with `send-keys`, read results with `capture-pane`, and inspect
screenshots with the Read tool. Handles (`browser`, `page`, contexts) survive
across all of your Bash calls — no edit-script→rerun loops.

Verified working pattern (2026-06-12, node 24, playwright 1.59): launch →
goto → screenshot → Read, all incremental, fully headless.

## Why detached tmux

- A detached session (`tmux new-session -d`) never touches the user's panes or
  focus — consistent with the no-foreground policy.
- The REPL process persists between your tool calls, exactly like js_repl's
  kernel.
- Node's REPL supports top-level `await`, so cells read like the js_repl lane.

## Setup (once per debugging session)

Run from a directory where `playwright` is installed (check
`node_modules/playwright` or install per the One-time setup section).

```bash
tmux kill-session -t pw-repl 2>/dev/null
tmux new-session -d -s pw-repl -c "$PWD" 'node'
sleep 1
tmux send-keys -t pw-repl "const { chromium } = require('playwright')" Enter
tmux send-keys -t pw-repl "let browser, context, page" Enter
tmux send-keys -t pw-repl "browser = await chromium.launch({ headless: true }); page = await browser.newPage(); console.log('READY')" Enter
sleep 5
tmux capture-pane -t pw-repl -p | tail -5   # expect READY
```

## The loop

Send one focused burst, wait for the async work, read the tail:

```bash
tmux send-keys -t pw-repl "await page.goto('http://127.0.0.1:3000'); console.log('TITLE:', await page.title())" Enter
sleep 3
tmux capture-pane -t pw-repl -p | tail -10
```

Screenshots go to files; inspect them with the Read tool (never a viewer app):

```bash
tmux send-keys -t pw-repl "await page.screenshot({ path: '/tmp/pw-step1.png' }); console.log('SHOT')" Enter
sleep 2
tmux capture-pane -t pw-repl -p | tail -3
# then: Read /tmp/pw-step1.png
```

## Conventions that keep this reliable

- **Sentinel logs.** End each burst with `console.log('SOMETHING_DONE')` so the
  capture-pane tail tells you unambiguously whether the cell finished. Poll
  with short sleeps rather than one long sleep.
- **Quote discipline.** Prefer double-quoting the send-keys argument and single
  quotes inside the JS. For code containing both quote kinds, write it to a
  file and `tmux send-keys -t pw-repl ".load /tmp/cell.js" Enter`.
- **One concern per cell**, same as the js_repl lane — easier to see where
  things break.
- **Stale handles**: if the REPL state gets corrupted, kill and relaunch the
  session; don't fight it. `tmux kill-session -t pw-repl`.
- **Capture more context when confused**: `capture-pane -p -S -100` shows the
  last 100 lines, including errors that scrolled past.
- **Session naming**: `pw-repl` by default; suffix it (`pw-repl-gmail`) when
  running more than one.

## Headed-but-invisible (when headless is genuinely blocked)

Some flows (e.g. Google sign-in) refuse headless. Apply the no-foreground
policy from SKILL.md: keep the window off-screen at real size —

```javascript
browser = await chromium.launch({
  headless: false,
  args: ['--window-position=-2800,0', '--window-size=1400,1000'],
});
```

The app may still appear in the Dock briefly; the window itself never lands on
screen. Return to headless as soon as the blocked step (login) is done —
persist the auth state (`context.storageState()` or a `userDataDir`) so future
runs stay headless.

## Cleanup (always)

```bash
tmux send-keys -t pw-repl "await browser.close()" Enter
sleep 2
tmux kill-session -t pw-repl 2>/dev/null
```

Exiting the conversation does NOT close the browser — the tmux session owns
it. Kill the session when done, or note explicitly that you're keeping it
alive for further work.

## Relationship to other tools

- **Official `webapp-testing` skill** (anthropics/skills): headless-by-default
  Playwright scripts — good for repeatable test runs, but script-per-run (no
  persistent handles). Use it for finished tests; use this lane for iterating.
- **agent-browser skill**: higher-level CLI for general site automation; use
  when you don't need raw Playwright APIs or persistent programmatic handles.

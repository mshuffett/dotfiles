# Save Experiment

Use when building quick prototypes, HTML experiments, or scratch work that should be preserved.

## Location

All experiments go to: `~/ws/experiments/`
- GitHub: `mshuffett/experiments` (private)

## Naming Convention

```
YYYY-MM-DD-descriptive-name.ext       # single files
YYYY-MM-project-name/                  # multi-file projects
```

Examples:
- `2026-01-24-inbox-triage-viewer.html`
- `2026-01-demo-swarm-playback/`

## Process

1. When creating a prototype/experiment during a session:
   ```bash
   # Single file
   cp /tmp/my-experiment.html ~/ws/experiments/$(date +%Y-%m-%d)-my-experiment.html

   # Multi-file
   cp -r /tmp/my-project ~/ws/experiments/$(date +%Y-%m)-my-project/
   ```

2. **Document the experiment** - Create a matching `.md` file:
   ```markdown
   # Experiment Name

   Brief description of what it does.

   ## Context
   Why it was built, what problem it solves.

   ## Future ideas
   What could be added or improved.

   ## Session
   Created in Claude session: `$CLAUDE_SESSION_ID`
   ```

3. Commit and push:
   ```bash
   cd ~/ws/experiments && git add . && git commit -m "add [description]" && git push
   ```

4. Open in browser if HTML:
   ```bash
   open ~/ws/experiments/2026-01-24-my-experiment.html
   ```

## When to Use

- Building quick HTML/CSS/JS prototypes
- Creating one-off tools or visualizations
- Experimenting with ideas that might be useful later
- Anything the user might want to revisit or build on

## Key Principle

Zero friction > organization. Just save it with a date prefix and move on. The user can reorganize later if needed.

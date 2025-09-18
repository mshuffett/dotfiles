My name is Michael
- The current year is 2025
- Prefer the vercel AI SDK to using the provider SDKs directly but when using the Vercel AI SDK refer to the docs online and examples rather than relying on your memory of the API.
- Use biome as the linter
- Don't estimate date timelines for tasks -- you are really bad at that, instead just do sequences or points.

When using the Anthropic API use the model claude-opus-4-1-20250805 for difficult tasks or claude-sonnet-4-20250514 as the default model. Do not use claude 3 for anything

Use pnpm instead of npm.

## Notifications
IMPORTANT: Only use the `push` command when I explicitly ask you to notify me. Do not proactively send notifications.

When I ask you to notify me when a task is complete, use the `push` command:
- `push "Task completed: [description]"` - sends a normal priority notification
- `push "Task completed: [description]" 1` - sends a high priority notification (bypasses quiet hours)
- `push "Task completed: [description]" 2` - sends an emergency notification (makes sound even on silent)

The push command is available at ~/bin/push (symlinked from ~/.dotfiles/bin/push).
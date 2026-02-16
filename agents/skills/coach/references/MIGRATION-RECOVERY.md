# Migration Recovery Reference

Files absorbed or deleted during the 2026-02-15 coach skill consolidation. All are recoverable from git history.

## Deleted from dotfiles repo (`~/.dotfiles`)

| File | What It Was | Recovery |
|------|------------|---------|
| `agents/skills/pomodoro-coaching/SKILL.md` | Global pomodoro coaching skill (evening review, tomorrow plan, pomodoro protocol, Toggl) | `git show HEAD~1:agents/skills/pomodoro-coaching/SKILL.md` |
| `claude-plugins/productivity/commands/morning.md` | PPV-integrated morning routine (Notion daily tracking, Todoist, calendar, habit checkboxes) | `git show HEAD~1:claude-plugins/productivity/commands/morning.md` |
| `claude-plugins/productivity/commands/evening.md` | PPV-integrated evening shutdown (Notion habit updates, Todoist inbox clearing, tomorrow planning) | `git show HEAD~1:claude-plugins/productivity/commands/evening.md` |
| `claude-plugins/productivity/commands/weekly.md` | PPV weekly review (Notion weeks database, action items, daily tracking, projects) | `git show HEAD~1:claude-plugins/productivity/commands/weekly.md` |
| `claude-plugins/productivity/commands/coach.md` | Meta-Cognitive Potentiality Agent V6.0 (existential coaching, pattern interruption) — absorbed into `references/metacognitive-coaching.md` | `git show HEAD~1:claude-plugins/productivity/commands/coach.md` |

## Deleted from notes repo (`~/ws/notes`)

| File | What It Was | Recovery |
|------|------------|---------|
| `.claude/skills/executive-assistant/SKILL.md` | EA skill (daily notes, capture, decision logging) | Check notes repo git log |
| `.claude/skills/executive-assistant/references/weekly-review.md` | Generic GTD weekly review | Check notes repo git log |
| `.claude/skills/executive-assistant/references/inbox-processing.md` | GTD-PARA inbox processing | Check notes repo git log |
| `.claude/skills/pomodoro-coaching/SKILL.md` | Repo-local pomodoro coaching duplicate | Check notes repo git log |
| `skills/pomodoro-coaching/SKILL.md` | Root-level pomodoro coaching duplicate | Check notes repo git log |
| `5-Tools/Reviews/📅 Daily Review Template.md` | Legacy daily review template | Check notes repo git log |
| `5-Tools/Reviews/📊 Weekly Review Template.md` | Legacy weekly review template | Check notes repo git log |
| `5-Tools/Reviews/README.md` | Legacy reviews README | Check notes repo git log |
| `5-Tools/Reviews/run_daily_review.sh` | Legacy review runner script | Check notes repo git log |
| `1-Projects/.../Coach Prompt (Daily + Weekly).md` | Project-scoped coach prompt (absorbed into SKILL.md + references) | Check notes repo git log |
| `.claude/rules/ea-patterns.md` | EA learned patterns (renamed to coach-patterns.md) | Check notes repo git log |

## Notion PPV Integration Note

The deleted productivity commands contained Notion database IDs and PPV (Pillars-Pipelines-Vaults) integration. If re-adding Notion tracking to the coach skill later:

- **Daily Tracking DB**: `17e577f8-2e28-8183-9177-000bbb7d847f`
- **Action Items DB**: `17e577f8-2e28-81cf-9d6b-000bc2cf0d50`
- **Weeks DB**: `17e577f8-2e28-8186-b8d7-000b3ee8cfa3`
- **Michael's Notion User ID**: `5923a1d0-4c9c-4376-b7d7-3c50704758c1`
- **Todoist Project IDs**: Inbox `377445380`, Ideas `2263875911`, Everything AI Backlog `2352252927`

These IDs can be used to restore Notion integration in the coach skill if needed.

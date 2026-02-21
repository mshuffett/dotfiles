# Common Anti-Patterns (Universal)

Known mistakes that apply across all projects. Review these before implementing features.

## Git Operations

### Pushing directly to main/develop branch
**Issue**: Bypasses code review process
**Prevention**: Always create feature branches; use `gh pr create`
**Rule**: Feature branch creation is STEP 1 of any implementation task

### Committing unrelated staged changes
**Issue**: Includes other people's work in your commit
**Prevention**: Always run `git status` and only `git add` specific files you modified
**Rule**: Use `git add` with specific files, never commit pre-staged changes

## Code Quality

### Not running tests before completing tasks
**Issue**: Introduces bugs that could have been caught
**Prevention**: Always run relevant tests before marking tasks complete

### Creating unnecessary files
**Issue**: Clutters codebase and duplicates functionality
**Prevention**: Always prefer editing existing files over creating new ones

### Running independent tasks sequentially
**Issue**: Wastes time when tasks don't depend on each other
**Prevention**: Batch independent tasks in parallel (multiple tool invocations)

## Memory Management

### Adding all "remember" requests to CLAUDE.md
**Issue**: CLAUDE.md becomes too large and unfocused
**Prevention**: Use memory hierarchy — only core info in CLAUDE.md

### Misplacing "always do" instructions
**Issue**: "Always" instructions affect every interaction and must be in CLAUDE.md
**Prevention**: Any instruction containing "always", "every time", or affecting all interactions → CLAUDE.md

### Using commands to reload memory files
**Issue**: In Claude Code, CLAUDE.md and memory files are already loaded into context
**Prevention**: Commands define behavior; memory provides context. Don't re-inject.

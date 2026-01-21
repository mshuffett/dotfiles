---
name: create-design-discussion
description:  first step of planning
---

# Design Discussion Phase

You are now in the Design Discussion phase. Based on the research findings and the user's change request, work with them to make design decisions.

## Steps to follow after receiving the user's request

1. **Read all mentioned files immediately and FULLY**:
   - Ticket files (e.g., `rpi/tasks/eng-1234-description/ticket.md`)
   - Research documents (e.g. `rpi/tasks/eng-1234-description/research.md`)
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context
   - **NEVER** read files partially - if a file is mentioned, read it completely

2. **Check for related task content**:
   - if a path in `rpi/tasks/TASKNAME` is mentioned, use Bash(`ls rpi/tasks/TASKNAME`)
   - **IMPORTANT** DO NOT USE search or glob or grep, as rpi/tasks may be a symlink and those tools don't traverse symlinks
   - read all relevant files in the task directory to fully understand the work so far

3. **Create a research todo list** using TodoWrite to track exploration tasks

4. **Spawn parallel sub-tasks for comprehensive research**:
   - Create multiple Task agents to research different aspects concurrently
   - Use the right agent for each type of research:

   **For deeper investigation:**
   - **codebase-locator** - To find more specific files (e.g., "find all files that handle [specific component]")
   - **codebase-analyzer** - To understand implementation details (e.g., "analyze how [system] works")
   - **codebase-pattern-finder** - To find similar features we can model after

   Each agent knows how to:
   - Find the right files and code patterns
   - Identify conventions and patterns to follow
   - Look for integration points and dependencies
   - Return specific file:line references
   - Find tests and examples

## Work with the user to iterate on the design

1. **Present patterns to follow** based on the research
   - Identify existing patterns in the codebase that should be followed
   - Include file locations and multiline code snippets showing the pattern

2. **Discuss design decisions**
   - For each major design choice, present options with pros/cons
   - Make recommendations based on codebase conventions
   - Record final decisions with rationale

3. **If the user gives any input along the way**:
   - DO NOT just accept the correction
   - Spawn new research tasks to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed with updates once you've verified the facts yourself
   - interpret ALL user feedback as instructions to update the document, not to begin implementation

## Output Format

1. **Read the design discussion Template**

`Read({SKILLBASE}/references/design_discussion_template.md)`

2. **Write the design discussion** to `rpi/tasks/ENG-XXXX-description/YYYY-MM-DD-design-discussion.md`
   - First, find the task directory: `ls rpi/tasks | grep -i "eng-XXXX"`
   - If the directory doesn't exist, create: `rpi/tasks/ENG-XXXX-description/`
   - Format: `YYYY-MM-DD-design-discussion.md` where YYYY-MM-DD is today's date
   - Directory naming:
     - With ticket: `rpi/tasks/ENG-1478-parent-child-tracking/2025-01-08-design-discussion.md`
     - Without ticket: `rpi/tasks/improve-error-handling/2025-01-08-design-discussion.md`

3. **Read the final output template**

`Read({SKILLBASE}/references/design_discussion_final_answer.md)`

4.  Respond to the user with a summary following the template, including GitHub permalinks

<guidance>
## GitHub Permalinks

When referencing documents in rpi/, use the `rpi permalink` command to generate GitHub links:
- Run `rpi permalink rpi/tasks/TASKNAME/document.md` to get the permalink
- Include this link in your final output for easy navigation

## Markdown Formatting

When writing markdown files that contain code blocks showing other markdown (like README examples or SKILL.md templates), use 4 backticks (````) for the outer fence so inner 3-backtick code blocks don't prematurely close it:

````markdown
# Example README
## Installation
```bash
npm install example
```
````
</guidance>

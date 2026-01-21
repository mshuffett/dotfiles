---
name: iterate-plan
description: iterate on implementation plan based on user feedback
---

# Iterate Plan

You are iterating on an existing implementation plan based on user feedback.

## Steps

1. **Read all input files FULLY**:
   - Use Read tool WITHOUT limit/offset to read the plan document and any other provided paths
   - `ls rpi/tasks/TASKNAME` to find all related documents in the task directory
   - Read everything in the task directory to build full context

2. **If a ticket file is provided, read it for feedback**:
   - Look for comments mentioning you (linear-assistant, LinearLayer, claude)
   - These comments contain instructions/feedback from the user

3. **If the user gives any input**:
   - DO NOT just accept the correction blindly
   - Read the specific files/directories they mention
   - Verify code examples and file paths are accurate
   - Only proceed once you've verified the facts yourself


4. **Process the feedback**:
   - If user requested phase changes: Reorganize or modify phases as requested
   - If user requested code changes: Update the specific code examples
   - If user found errors: Fix inaccuracies in file paths, code, or descriptions
   - Keep the same YAML frontmatter and format

5. **Update document** (if changes needed):
   - Update the document at the same path
   - Ensure code examples are accurate and complete
   - Verify success criteria are actionable
   - Maintain the phase structure with automated/manual verification

6. **Update the user**
   - Read the final output template:
   `Read({SKILLBASE}/references/plan_final_answer.md)`
   - Respond with a summary following the template, including GitHub permalinks.

## Plan Writing Guidelines

- Each phase should be independently testable
- Include specific code examples, not just descriptions
- Automated verification should be runnable commands
- Manual verification should be specific, actionable steps
- Pause for human confirmation between phases


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

## Validation Design

Not every phase requires manual validation, don't put steps for manual validation just to have them.
</guidance>

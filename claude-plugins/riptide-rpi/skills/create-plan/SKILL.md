---
name: create-plan
description: convert structure outline into a detailed implementation plan
---

# Create Plan

You are in the final Plan Writing phase. Convert the structure outline into a complete, detailed implementation plan.

## Steps

1. **Read all input files FULLY**:
   - Use Read tool WITHOUT limit/offset to read all provided file paths
   - `ls rpi/tasks/TASKNAME` to find all related documents in the task directory
   - Read everything in the task directory to build full context

2. **Read relevant code files**:
   - Read any source files mentioned in the research, design, or structure documents
   - Build context for writing specific code examples

3. **Read the plan template**:

`Read({SKILLBASE}/references/plan_template.md)`

4. **Write the implementation plan**:
   - Write to `rpi/tasks/ENG-XXXX-description/YYYY-MM-DD-plan.md`
   - Convert each phase from the structure outline into detailed implementation steps
   - Include specific code examples for each change
   - Add both automated and manual success criteria

## Plan Writing Guidelines

- Each phase should be independently testable
- Include specific code examples, not just descriptions
- Automated verification should be runnable commands
- Manual verification should be specific, actionable steps
- Pause for human confirmation between phases

## Output

1. **Read the final output template**:

`Read({SKILLBASE}/references/plan_final_answer.md)`

2. Respond with a summary following the template, including GitHub permalinks

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

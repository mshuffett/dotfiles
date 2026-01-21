---
name: iterate-research
description: iterate on research document based on user feedback. This skill requires a path to a document and feedback from the human
---

# Iterate Research

You are iterating on an existing research document based on user feedback.

## Steps

1. **Read the existing document FULLY**:
   - Use Read tool WITHOUT limit/offset to read the entire document at `docPath`
   - Understand what research was previously conducted
   - Don't read any other files in the rpi/ directory for the task, focus on the research document and the provided feedback.

2. **Process the feedback**:
   - If user requested additional research: Spawn sub-agents to investigate
   - If user requested corrections: Update the document at the same path
   - Keep the same YAML frontmatter and format

3. **Conduct additional research** (if needed):
   - Spawn parallel sub-agent tasks for comprehensive research
   - Use the right agent for each type of research:

   **For codebase research:**
   - **codebase-locator**: Find WHERE files and components live
     - Finds relevant source files, configs, and tests
     - Returns file paths organized by purpose
   - **codebase-analyzer**: Understand HOW specific code works (without critiquing it)
     - Traces data flow and key functions
     - Returns detailed explanations with file:line references
   - **codebase-pattern-finder**: Find examples of existing patterns (without evaluating them)
     - Identifies conventions and patterns
     - Returns code examples with locations

   **For web research (only if user explicitly asks):**
   - **web-search-researcher**: For external documentation and resources
     - If used, instruct agents to return LINKS with their findings
     - Include those links in the updated document

   **Agent usage tips:**
   - Start with locator agents to find what exists
   - Then use analyzer agents on the most promising findings
   - Run multiple agents in parallel when searching for different things
   - Each agent knows its job - just tell it what you're looking for
   - Don't write detailed prompts about HOW to search - the agents already know
   - Keep the main agent focused on synthesis, not deep file reading

4. **Update document** (if changes needed):
   - Update the document at the same `docPath`
   - Add new findings to relevant sections

5. **Update the user**
   - Read the final output template:
   `Read({SKILLBASE}/references/research_final_answer.md)`
   - Respond with a summary following the template, including GitHub permalinks.

## Research Guidelines

Your job is to DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY:
- DO NOT suggest improvements or changes unless explicitly asked
- DO NOT perform root cause analysis unless explicitly asked
- DO NOT propose future enhancements unless explicitly asked
- DO NOT critique the implementation or identify problems
- DO NOT recommend refactoring, optimization, or architectural changes
- ONLY describe what exists, where it exists, how it works, and how components interact

Document structure should include:
- Summary answering the research question
- Detailed findings by component/area with file:line references
- Code references with descriptions
- Architecture documentation (patterns, conventions, design)
- Open questions for areas needing further investigation

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
## Important notes:
- Use parallel Task agents to maximize efficiency and minimize context usage
- Focus on finding concrete file paths and line numbers for developer reference
- Research documents should be self-contained with all necessary context
- Each sub-agent prompt should be specific and focused on read-only documentation operations
- Document cross-component connections and how systems interact
- Link to GitHub when possible for permanent references
- Stay focused on synthesis, not deep file reading
- Have sub-agents document examples and usage patterns as they exist
- **REMEMBER**: Document and Ask about what IS and WHY, not what SHOULD BE
- **NO RECOMMENDATIONS OR IMPLEMENTATION SUGGESTIONS**: Only describe the current state of the codebase
- **File reading**: Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks
- **Critical ordering**: Follow the numbered steps exactly
  - ALWAYS read mentioned files first before spawning sub-tasks (step 1)
  - ALWAYS wait for all sub-agents to complete before synthesizing (step 4)
  - ALWAYS gather metadata before writing the document (step 5 before step 6)
  - NEVER write the research document with placeholder values
- **Path handling**: Task-specific research goes in rpi/tasks/
  - Use `rpi/tasks/ENG-XXXX-description/YYYY-MM-DD-research.md` for task research
</guidance>


Remember, you must respond to the user according to the output template at `{SKILLBASE}/references/research_final_answer.md`

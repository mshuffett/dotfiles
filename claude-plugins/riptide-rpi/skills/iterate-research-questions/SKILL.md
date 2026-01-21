---
name: iterate-research-questions
description: iterate on rpi/tasks/*/*-research-questions.md doc based on user feedback. 
---

# Iterate Research Questions

You are iterating on an existing research questions document based on user feedback.

## Input

- `docPath`: Path to the existing research questions document (e.g., `rpi/tasks/ENG-XXXX-description/YYYY-MM-DD-research-questions.md`)
- Optionally, a ticket file path containing comments with feedback

## Steps

1. **Read the existing document FULLY**:
   - Use Read tool WITHOUT limit/offset to read the entire document at `docPath`
   - Understand what questions were previously created

2. **If a ticket file is provided, read it for feedback**:
   - Look for comments mentioning you (linear-assistant, LinearLayer, claude)
   - These comments contain instructions/feedback from the user

3. **Process the feedback**:
   - Update the document at the same path based on feedback
   - Keep the same YAML frontmatter and format

4. **Write updated document** (if changes needed):
   - Update the document at the same `docPath`
   - Address each piece of feedback from the user

5. **Update the user**
   - Read the final output template:
   `Read({SKILLBASE}/references/research_questions_final_answer.md)`
   - Respond with a summary following the template, including GitHub permalinks.

## Research Question Guidelines

Questions should focus ONLY on the current state of the codebase:
- Do NOT include questions about what should be built
- Do NOT suggest improvements unless asked
- Do NOT ask about what changes need to happen
- Only ask questions that document what exists, where it exists, and how components are organized

Good research questions explore:
- Current implementation details
- Relevant patterns or constraints
- Potential complexities or edge cases
- Architecture, dependencies, and implementation details

Format questions as high-level codebase exploration:
- "Explain how [FEATURE] works end to end and all the systems involved"
- "Explore the contract between [COMPONENT1] and [COMPONENT2] and how it's implemented on both sides"
- "Trace the flow of logic from [ENDPOINT] down to [DATASTORE]"
- "Find all users of [DATABASE COLUMN or DATABASE TABLE] and what the data is used for"

Use 3-8 questions per task (use your judgement based on complexity).

CRITICAL - DO NOT LEAK ANY IMPLEMENTATION DETAILS OR THE NATURE OF YOUR TASK INTO THE QUESTION LIST. NO "HOW WOULD WE XYZ" - ONLY "HOW DOES IT WORK"

<guidance>
## GitHub Permalinks

When referencing documents in rpi/, use the `rpi permalink` command to generate GitHub links:
- Run `rpi permalink rpi/tasks/TASKNAME/document.md` to get the permalink
- Include this link in your final output for easy navigation
</guidance>
